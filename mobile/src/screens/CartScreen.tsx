import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { waiterApi } from '../api/waiterApi';
import { useAuth } from '../context/AuthContext';

export default function CartScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = useAuth();
  
  // Passed from AddOrderScreen
  const routeParams = route.params as any;
  const tableId = routeParams?.tableId;
  const tableName = routeParams?.tableName || 'Unknown';
  const initialItems = routeParams?.cartItems || []; // Array of { id, name, price, quantity, is_veg }

  const [cartItems, setCartItems] = useState<any[]>(initialItems);
  const [loading, setLoading] = useState(false);

  const grandTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => {
      const newItems = prev.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return newItems;
    });
  };

  const handlePunchKOT = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before punching KOT.');
      return;
    }

    if (!restaurantId) {
      Alert.alert('Error', 'Missing restaurant ID. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        table_id: tableId,
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          notes: "" // Optional notes can be added later
        }))
      };

      await waiterApi.placeOrder(orderPayload);
      
      Alert.alert('Success', 'KOT Punched Successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            // Navigate back to All Tables (safely pop all screens)
            (navigation as any).popToTop();
          }
        }
      ]);
    } catch (error: any) {
      let errorMsg = error.response?.data?.detail || error.message || 'Failed to punch KOT';
      if (typeof errorMsg !== 'string') {
        errorMsg = JSON.stringify(errorMsg);
      }
      Alert.alert('API Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMore = () => {
    // Go back to AddOrder with the updated cart items
    (navigation.navigate as any)('AddOrder', { 
      tableId, 
      tableName, 
      updatedCart: cartItems 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAddMore} style={styles.backButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Current Order</Text>
          <Text style={styles.headerSubtitle}>Table: {tableName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Cart is empty</Text>
          </View>
        ) : (
          cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemDetails}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                   <View style={[styles.vegIndicator, { borderColor: item.is_veg ? '#22c55e' : '#ef4444' }]}>
                     <View style={[styles.vegCircle, { backgroundColor: item.is_veg ? '#22c55e' : '#ef4444' }]} />
                   </View>
                   <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>

              <View style={styles.actionRow}>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => handleUpdateQuantity(item.id, -1)}>
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => handleUpdateQuantity(item.id, 1)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.lineTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer Totals & Actions */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddMore} disabled={loading}>
            <Text style={styles.addMoreBtnText}>+ Add More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.punchBtn, loading && { opacity: 0.7 }]} onPress={handlePunchKOT} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.punchBtnText}>Punch KOT</Text>}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerIcon: {
    color: '#111827',
    fontSize: 24,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  cartItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vegIndicator: {
    width: 12,
    height: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginRight: 8,
  },
  vegCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 8,
  },
  itemPrice: {
    color: '#888',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 2,
  },
  stepBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#333',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  lineTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 20,
    paddingBottom: 30, // Extra padding for bottom home indicator
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalLabel: {
    color: '#ddd',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#3b82f6', // Premium blue for total
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addMoreBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  addMoreBtnText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  punchBtn: {
    flex: 1.5,
    backgroundColor: '#10b981', // Success green
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  punchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
