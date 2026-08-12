import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import BottomSheet from '../ui/BottomSheet';
import { COLORS, RADIUS, FONT } from '../../constants/theme';
import { Order } from '../../api/types';
import { LinearGradient } from 'expo-linear-gradient';

interface BillingSheetProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onGenerateBill: (discount: number) => Promise<any>;
  onConfirmPayment: (amount: number, method: string) => Promise<void>;
}

export default function BillingSheet({ visible, order, onClose, onGenerateBill, onConfirmPayment }: BillingSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [discount, setDiscount] = useState('0');
  const [loading, setLoading] = useState(false);
  
  // Step 2 state
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [generatedBill, setGeneratedBill] = useState<any>(null);

  const resetState = () => {
    setStep(1);
    setDiscount('0');
    setPaymentMethod('CASH');
    setCashReceived('');
    setGeneratedBill(null);
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      const bill = await onGenerateBill(Number(discount) || 0);
      setGeneratedBill(bill);
      setStep(2);
    } catch (e) {
      // error handled in screen
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!generatedBill) return;
    try {
      setLoading(true);
      await onConfirmPayment(generatedBill.total_amount, paymentMethod);
      resetState();
      onClose();
    } catch (e) {
      // error handled in screen
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  const totalReturn = paymentMethod === 'CASH' && cashReceived
    ? Math.max(0, Number(cashReceived) - (generatedBill?.total_amount || 0))
    : 0;

  return (
    <BottomSheet visible={visible} onClose={() => { resetState(); onClose(); }} height={step === 1 ? '70%' : '60%'}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {step === 1 ? 'Bill Review' : 'Payment Details'}
        </Text>
        <Text style={styles.subtitle}>Order #{order.id.substring(0,6).toUpperCase()}</Text>
      </View>

      {step === 1 ? (
        <View style={styles.content}>
          <View style={styles.summaryBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.value}>₹{order.subtotal_amount?.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tax (Estimated)</Text>
              <Text style={styles.value}>₹{order.tax_amount?.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Discount (₹)</Text>
              <TextInput
                style={styles.input}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.card} /> : (
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.gradient}>
                <Text style={styles.btnText}>Generate Bill →</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.finalTotal}>₹{generatedBill?.total_amount?.toFixed(2)}</Text>
          <Text style={styles.finalTotalLabel}>Total Amount Due</Text>

          <View style={styles.paymentMethods}>
            {['CASH', 'UPI', 'CARD'].map(method => (
              <TouchableOpacity
                key={method}
                style={[styles.methodBtn, paymentMethod === method && styles.methodBtnActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                  {method === 'CASH' ? '💵' : method === 'UPI' ? '📱' : '💳'} {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod === 'CASH' && (
            <View style={styles.cashBox}>
              <Text style={styles.label}>Cash Received (₹)</Text>
              <TextInput
                style={[styles.input, styles.largeInput]}
                value={cashReceived}
                onChangeText={setCashReceived}
                keyboardType="numeric"
                placeholder="0.00"
              />
              {totalReturn > 0 && (
                <Text style={styles.returnText}>Return Change: ₹{totalReturn.toFixed(2)}</Text>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.card} /> : (
              <LinearGradient colors={[COLORS.success, '#059669']} style={styles.gradient}>
                <Text style={styles.btnText}>Confirm Payment ✓</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  summaryBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: FONT.medium,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: FONT.bold,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: FONT.medium,
  },
  largeInput: {
    width: '100%',
    textAlign: 'left',
    marginTop: 8,
    height: 48,
  },
  nextBtn: {
    marginTop: 'auto',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  confirmBtn: {
    marginTop: 'auto',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: FONT.bold,
  },
  finalTotal: {
    fontSize: 36,
    fontWeight: FONT.black,
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  finalTotalLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  methodText: {
    fontWeight: FONT.semibold,
    color: COLORS.textMuted,
  },
  methodTextActive: {
    color: COLORS.primaryDark,
  },
  cashBox: {
    marginBottom: 24,
  },
  returnText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: FONT.bold,
    color: COLORS.success,
  }
});
