import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { waiterApi } from '../api/waiterApi';

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD'];

export default function BillingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params as { order: any };

  const [discountStr, setDiscountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const subtotal = order.total_amount || 0;
  const discount = parseFloat(discountStr) || 0;
  // TODO: Add service charge logic if needed from settings API. Defaults to 0 for now.
  const serviceCharge = 0; 
  const grandTotal = Math.max(0, subtotal - discount + serviceCharge);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // 1. Generate Bill
      await waiterApi.generateBill(order.id, paymentMethod, discount);
      
      // 2. Confirm Payment
      await waiterApi.confirmPayment(order.id, grandTotal, paymentMethod);

      // Show success screen layout
      setSuccess(true);
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || 'Failed to process billing';
      Alert.alert('Billing Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    // Return to All Tables
    (navigation.navigate as any)('MainDrawer', { screen: 'Home' });
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successMessage}>
            Table {order.table?.table_number?.toString() || 'Unknown'} is now free.
          </Text>

          <View style={styles.successAmountBox}>
            <Text style={styles.successLabel}>Collected via {paymentMethod}</Text>
            <Text style={styles.successAmount}>₹{grandTotal.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.printBtn} onPress={() => Alert.alert('Printing', 'Simulating bill print...')}>
            <Text style={styles.printBtnText}>🖨️ Print / Share Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneBtn} onPress={handleFinish}>
            <Text style={styles.doneBtnText}>Back to Tables</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout - Table: {order.table?.table_number?.toString() || 'Unknown'}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Itemized Bill</Text>
        <View style={styles.card}>
          {order.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>{item.menu_item?.name || 'Unknown Item'}</Text>
                <Text style={styles.itemQty}>{item.quantity} x ₹{item.price_at_order_time || 0}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{((item.price_at_order_time || 0) * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount (₹)</Text>
            <TextInput 
              style={styles.discountInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#888"
              value={discountStr}
              onChangeText={setDiscountStr}
            />
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethodsContainer}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity 
              key={method}
              style={[
                styles.methodBtn, 
                paymentMethod === method && styles.methodBtnActive
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={[
                styles.methodText,
                paymentMethod === method && styles.methodTextActive
              ]}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]} 
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Collect ₹{grandTotal.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerIcon: {
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  itemQty: {
    color: '#888',
    fontSize: 14,
  },
  itemTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 16,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: 80,
    textAlign: 'right',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    marginBottom: 0,
  },
  grandTotalLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: 'bold',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40, // Padding for footer
  },
  methodBtn: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  methodBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  methodText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  methodTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  confirmBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Success Screen Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    color: '#10b981',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successMessage: {
    color: '#888',
    fontSize: 16,
    marginBottom: 32,
  },
  successAmountBox: {
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 32,
  },
  successLabel: {
    color: '#888',
    fontSize: 16,
    marginBottom: 8,
  },
  successAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  printBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  printBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
