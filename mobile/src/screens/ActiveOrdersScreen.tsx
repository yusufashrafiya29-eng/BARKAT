import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, RADIUS, FONT } from '../constants/theme';
import { useOrderStore } from '../store/useOrderStore';
import { waiterApi } from '../api/waiterApi';
import Header from '../components/layout/Header';
import OrderCard from '../components/order/OrderCard';
import BillingSheet from '../components/order/BillingSheet';
import Toast from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { Order } from '../api/types';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'PENDING', label: '⏳ Pending' },
  { id: 'ACCEPTED', label: '✅ Accepted' },
  { id: 'PREPARING', label: '👨‍🍳 Preparing' },
  { id: 'READY', label: '🍽️ Ready' },
  { id: 'SERVED', label: '✔ Served' },
];

export default function ActiveOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { activeOrders, isRefreshing, fetchOrders, acceptOrder, updateStatus } = useOrderStore();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Billing state
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  
  // Confirm state
  const [confirmConfig, setConfirmConfig] = useState({ visible: false, title: '', message: '', action: () => {}, isDestructive: false });
  const [toastConfig, setToastConfig] = useState({ visible: false, message: '', type: 'info' as any });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await fetchOrders();
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastConfig({ visible: true, message, type });
  };

  const handleAction = (action: string, order: Order) => {
    if (action === 'ACCEPT') {
      acceptOrder(order.id).then(() => showToast('Order accepted', 'success'));
    } else if (action === 'REJECT') {
      setConfirmConfig({
        visible: true,
        title: 'Reject Order',
        message: 'Are you sure you want to reject this order?',
        action: () => updateStatus(order.id, 'CANCELLED').then(() => showToast('Order rejected', 'info')),
        isDestructive: true
      });
    } else if (action === 'PREPARING') {
      updateStatus(order.id, 'PREPARING').then(() => showToast('Order marked as preparing', 'success'));
    } else if (action === 'READY') {
      updateStatus(order.id, 'READY').then(() => showToast('Order marked as ready', 'success'));
    } else if (action === 'SERVED') {
      updateStatus(order.id, 'SERVED').then(() => showToast('Order marked as served', 'success'));
    } else if (action === 'BILL') {
      setBillingOrder(order);
    }
  };

  const handleGenerateBill = async (discount: number) => {
    if (!billingOrder) return;
    return await waiterApi.generateBill(billingOrder.id, 'CASH', discount);
  };

  const handleConfirmPayment = async (amount: number, method: string) => {
    if (!billingOrder) return;
    await waiterApi.confirmPayment(billingOrder.id, amount, method);
    showToast('✅ Payment Done! Table cleared.', 'success');
    fetchOrders();
  };

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return activeOrders;
    return activeOrders.filter(o => o.status === activeFilter);
  }, [activeOrders, activeFilter]);

  return (
    <View style={styles.container}>
      <Header 
        title="Running Orders" 
        rightAction="notification"
        badgeCount={activeOrders.length}
      />

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.id && styles.activeFilterChip]}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text style={[styles.filterText, activeFilter === item.id && styles.activeFilterText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          {[1,2,3].map(i => <SkeletonLoader key={i} height={150} style={{ marginBottom: 16 }} borderRadius={RADIUS.lg} />)}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <OrderCard order={item} onAction={handleAction} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchOrders} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}

      <BillingSheet
        visible={!!billingOrder}
        order={billingOrder}
        onClose={() => setBillingOrder(null)}
        onGenerateBill={handleGenerateBill}
        onConfirmPayment={handleConfirmPayment}
      />

      <ConfirmModal
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig({ ...confirmConfig, visible: false });
        }}
        onCancel={() => setConfirmConfig({ ...confirmConfig, visible: false })}
        isDestructive={confirmConfig.isDestructive}
      />

      <Toast 
        visible={toastConfig.visible} 
        message={toastConfig.message} 
        type={toastConfig.type} 
        onHide={() => setToastConfig({ ...toastConfig, visible: false })} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filtersContainer: {
    marginVertical: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: FONT.medium,
    color: COLORS.textMuted,
  },
  activeFilterText: {
    color: COLORS.card,
    fontWeight: FONT.bold,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
  }
});
