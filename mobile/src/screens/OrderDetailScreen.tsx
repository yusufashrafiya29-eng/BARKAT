import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { waiterApi } from '../api/waiterApi';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const { lastMessage } = useWebSocket();
  const { canSettleOrders } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Listen to real-time WebSocket updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'order_update' && lastMessage.order_id === orderId) {
      setOrder((prevOrder: any) => ({
        ...prevOrder,
        status: lastMessage.status,
        items: lastMessage.items || prevOrder.items
      }));
    }
  }, [lastMessage, orderId]);

  const fetchOrderDetails = async () => {
    try {
      // Assuming GET /orders/waiter/active returns full list, we might need a specific endpoint 
      // or we just fetch all and find it for now if there isn't a single GET /orders/{id}.
      // Let's assume there is a way or we use the getOrdersByTable / getOrders from active.
      const data = await waiterApi.getAllOrders();
      const found = data.find((o: any) => o.id === orderId);
      if (found) {
        setOrder(found);
      } else {
        Alert.alert('Error', 'Order not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await waiterApi.updateOrderStatus(orderId, newStatus);
      // Optimistic update
      setOrder({ ...order, status: newStatus });
      Alert.alert('Success', `Order marked as ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateBill = () => {
    (navigation.navigate as any)('Billing', { order });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Table: {order.table?.table_number?.toString() || 'Unknown'}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <Text style={styles.statusValue}>{order.status}</Text>
        </View>

        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.itemsCard}>
          {order.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menu_item?.name || 'Unknown Item'}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{((item.price_at_order_time || 0) * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{order.total_amount?.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsContainer}>
          {order.status !== 'SERVED' && order.status !== 'COMPLETED' && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
              onPress={() => handleUpdateStatus('SERVED')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>Mark Served</Text>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'SERVED' && canSettleOrders === false && (
            <View style={{ backgroundColor: '#1e1e1e', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#333' }}>
              <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>
                Served — ask an authorized staff member to settle this table.
              </Text>
            </View>
          )}

          {order.status === 'SERVED' && canSettleOrders !== false && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#8b5cf6' }]}
              onPress={handleGenerateBill}
              disabled={updating}
            >
              <Text style={styles.actionBtnText}>Settle</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
  },
  statusLabel: {
    color: '#888',
    fontSize: 16,
  },
  statusValue: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemQuantity: {
    color: '#888',
    fontSize: 14,
  },
  itemPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionsContainer: {
    marginBottom: 40,
  },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});
