import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Alert, Platform, ScrollView, TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios';

const PRIMARY = '#6366f1';      // Indigo
const PRIMARY_DARK = '#4f46e5'; // Deep indigo
const ORANGE = '#e85d04';       // For accent buttons

type PayMethod = 'CASH' | 'CARD' | 'UPI';

export default function CheckoutScreen({ route, navigation }: any) {
  const { orderId, tableNumber } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [payMethod, setPayMethod] = useState<PayMethod>('CASH');
  const [discount, setDiscount] = useState('');
  const [customerPaid, setCustomerPaid] = useState('');

  useEffect(() => { fetchBill(); }, []);

  const fetchBill = async () => {
    try {
      // First get order details
      const ordersRes = await api.get('/orders/waiter/active');
      const found = (ordersRes.data || []).find((o: any) => o.id === orderId);
      if (found) setOrder(found);

      // Generate bill
      const billRes = await api.post(`/billing/${orderId}/generate`, {
        payment_method: 'CASH',
        discount_amount: 0
      });
      setBill(billRes.data);
    } catch (e) {
      console.log('Checkout fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async () => {
    try {
      const discAmt = parseFloat(discount) || 0;
      const res = await api.post(`/billing/${orderId}/generate`, {
        payment_method: payMethod,
        discount_amount: discAmt
      });
      setBill(res.data);
      setStep(2);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to generate bill';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    }
  };

  const confirmPayment = async () => {
    setProcessing(true);
    try {
      await api.put(`/billing/${orderId}/confirm`, {
        amount: bill.total_amount,
        payment_method: payMethod,
        transaction_reference: payMethod !== 'CASH' ? `TRX-${Date.now()}` : null
      });
      const msg = '✅ Payment confirmed! Table is now free.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Payment Confirmed', msg);
      navigation.reset({ index: 0, routes: [{ name: 'Drawer' }] });
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Payment failed';
      Platform.OS === 'web' ? window.alert(`Error: ${msg}`) : Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const grandTotal = bill?.total_amount || 0;
  const paid = parseFloat(customerPaid) || 0;
  const change = paid > 0 ? paid - grandTotal : null;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerSmall}>Step {step}/2 — {step === 1 ? 'Bill Review' : 'Payment'}</Text>
            <Text style={styles.headerTitle}>Table {tableNumber} · Settle & Save</Text>
          </View>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2].map(s => (
            <View key={s} style={[styles.stepBar, { backgroundColor: s <= step ? PRIMARY : '#e2e8f0' }]} />
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

          {/* ── STEP 1: BILL ── */}
          {step === 1 && (
            <>
              {/* Items */}
              {order?.items && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>ITEMS ORDERED</Text>
                  {order.items.map((item: any, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemName}>
                        <Text style={{ fontWeight: '700' }}>{item.quantity}×</Text>{' '}
                        {item.menu_item?.name || 'Item'}
                      </Text>
                      <Text style={styles.itemAmt}>
                        ₹{((item.price_at_order_time || 0) * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Bill summary */}
              {bill && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>BILL SUMMARY</Text>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Subtotal</Text>
                    <Text style={styles.billValue}>₹{bill.subtotal?.toFixed(2)}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Tax</Text>
                    <Text style={styles.billValue}>₹{bill.tax_amount?.toFixed(2)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Discount (₹)</Text>
                    <TextInput
                      style={[styles.discountInput, { outlineStyle: 'none' } as any]}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      value={discount}
                      onChangeText={setDiscount}
                    />
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalAmt}>₹{grandTotal.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── STEP 2: PAYMENT ── */}
          {step === 2 && (
            <>
              {/* Amount reminder */}
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
                <Text style={styles.sectionLabel}>AMOUNT TO PAY</Text>
                <Text style={styles.bigAmount}>₹{grandTotal.toFixed(2)}</Text>
              </View>

              {/* Payment methods */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>SELECT PAYMENT METHOD</Text>
                <View style={styles.payRow}>
                  {(['CASH', 'CARD', 'UPI'] as PayMethod[]).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.payBtn, payMethod === m && styles.payBtnActive]}
                      onPress={() => setPayMethod(m)}
                    >
                      <Feather
                        name={m === 'CASH' ? 'dollar-sign' : m === 'CARD' ? 'credit-card' : 'smartphone'}
                        size={20}
                        color={payMethod === m ? '#fff' : '#64748b'}
                      />
                      <Text style={[styles.payLabel, payMethod === m && { color: '#fff' }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cash change calculator */}
              {payMethod === 'CASH' && (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>CHANGE CALCULATOR</Text>
                  <View style={styles.changeRow}>
                    <Text style={styles.billLabel}>Customer Paid</Text>
                    <View style={styles.paidInput}>
                      <Text style={styles.rupee}>₹</Text>
                      <TextInput
                        style={[styles.paidInputText, { outlineStyle: 'none' } as any]}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        value={customerPaid}
                        onChangeText={setCustomerPaid}
                      />
                    </View>
                  </View>
                  {change !== null && (
                    <View style={[styles.changeBanner, { backgroundColor: change >= 0 ? '#ecfdf5' : '#fff1f2' }]}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: change >= 0 ? '#065f46' : '#be123c' }}>
                        {change >= 0 ? 'Return to Customer' : 'Amount Short'}
                      </Text>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: change >= 0 ? '#10b981' : '#f43f5e' }}>
                        ₹{Math.abs(change).toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Settlement Amount</Text>
                    <Text style={[styles.billValue, { fontWeight: '800' }]}>₹{grandTotal.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
          {step === 1 ? (
            <TouchableOpacity style={styles.settleBtn} onPress={applyDiscount}>
              <Text style={styles.settleBtnText}>Next: Payment →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.settleBtn, processing && { opacity: 0.7 }]}
              onPress={confirmPayment}
              disabled={processing}
            >
              {processing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.settleBtnText}>SETTLE & SAVE ✓</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PRIMARY_DARK, paddingHorizontal: 16, paddingVertical: 14,
  },
  headerSmall: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  stepRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  stepBar: { flex: 1, height: 4, borderRadius: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 13, color: '#334155', flex: 1 },
  itemAmt: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  billLabel: { fontSize: 13, color: '#64748b' },
  billValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  totalAmt: { fontSize: 22, fontWeight: '800', color: PRIMARY },
  discountInput: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, fontSize: 14,
    color: '#0f172a', width: 100, textAlign: 'right',
  },
  bigAmount: { fontSize: 36, fontWeight: '900', color: '#0f172a', marginTop: 4 },
  payRow: { flexDirection: 'row', gap: 10 },
  payBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 12, gap: 6,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  payBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  payLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  paidInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  rupee: { fontSize: 16, fontWeight: '700', color: '#94a3b8', marginRight: 4 },
  paidInputText: { fontSize: 16, fontWeight: '700', color: '#0f172a', width: 90, textAlign: 'right' },
  changeBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 12, padding: 14, marginBottom: 12,
  },
  footer: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  settleBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: ORANGE, alignItems: 'center',
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  settleBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});


