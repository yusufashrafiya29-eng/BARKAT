import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Alert, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axios';

const PRIMARY = '#6366f1';
const AMBER = '#f59e0b';   // Accept button — matches web app
const GREEN = '#10b981';   // Serve button — matches web app

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PENDING:   { bg: '#fffbeb', text: '#b45309', border: '#fcd34d', label: '⚡ Pending' },
  ACCEPTED:  { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', label: '🍽 Accepted' },
  PREPARING: { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff', label: '👨‍🍳 Preparing' },
  READY:     { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7', label: '✅ Ready' },
  SERVED:    { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: '🍴 Served' },
  CANCELLED: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', label: '❌ Cancelled' },
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const intervalRef = useRef<any>(null);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [ordersRes, tablesRes] = await Promise.all([
        api.get('/orders/waiter/active'),
        api.get('/tables/')
      ]);
      setOrders(ordersRes.data || []);
      setTables(tablesRes.data || []);
    } catch { }
    finally { if (!silent) setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      intervalRef.current = setInterval(() => fetchOrders(true), 5000);
      return () => clearInterval(intervalRef.current);
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  }, []);

  const getTableNum = (tableId: string) =>
    tables.find(t => t.id === tableId)?.table_number ?? '?';

  const getElapsed = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const setProc = (id: string, val: boolean) => {
    setProcessing(prev => { const n = new Set(prev); val ? n.add(id) : n.delete(id); return n; });
  };

  const handleAccept = async (id: string) => {
    if (processing.has(id)) return;
    setProc(id, true);
    try {
      await api.put(`/orders/${id}/accept`, {});
      fetchOrders(true);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally { setProc(id, false); }
  };

  const handleReject = async (id: string) => {
    if (processing.has(id)) return;
    const doReject = async () => {
      setProc(id, true);
      try {
        await api.put(`/orders/${id}/status`, { status: 'CANCELLED' });
        fetchOrders(true);
      } catch (e: any) {
        const msg = e.response?.data?.detail || 'Failed';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      } finally { setProc(id, false); }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Reject this order?')) doReject();
    } else {
      Alert.alert('Reject Order?', 'This will cancel the order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: doReject }
      ]);
    }
  };

  const handleServe = async (id: string) => {
    if (processing.has(id)) return;
    setProc(id, true);
    try {
      await api.put(`/orders/${id}/status`, { status: 'SERVED' });
      fetchOrders(true);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally { setProc(id, false); }
  };

  const handleCheckout = (order: any) => {
    navigation.navigate('Checkout', {
      orderId: order.id,
      tableNumber: getTableNum(order.table_id)
    });
  };

  const renderOrder = ({ item: order }: { item: any }) => {
    const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const tNum = getTableNum(order.table_id);
    const isProc = processing.has(order.id);

    return (
      <View style={[styles.orderCard, { borderColor: st.border }]}>
        {/* Color strip */}
        <View style={[styles.strip, { backgroundColor: st.border }]} />

        {/* Card header */}
        <View style={styles.cardHead}>
          <View style={[styles.tableChip, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.tableChipText, { color: st.text }]}>T{tNum}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.orderId}>#{order.id.slice(0, 6)}</Text>
            <Text style={styles.orderTime}>{getElapsed(order.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
          </View>
          <Text style={styles.orderAmount}>₹{order.total_amount?.toFixed(0)}</Text>
        </View>

        {/* Items */}
        <View style={styles.itemsList}>
          {order.items?.map((item: any, idx: number) => (
            <Text key={idx} style={styles.orderItem}>
              <Text style={{ fontWeight: '700' }}>{item.quantity}×</Text>{' '}
              {item.menu_item?.name || 'Item'}
              {item.notes ? <Text style={styles.notes}> ({item.notes})</Text> : null}
            </Text>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {order.status === 'PENDING' && (
            <>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(order.id)} disabled={isProc}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(order.id)} disabled={isProc}>
                {isProc ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.acceptText}>Accept ✓</Text>}
              </TouchableOpacity>
            </>
          )}
          {order.status === 'READY' && (
            <TouchableOpacity style={styles.serveBtn} onPress={() => handleServe(order.id)} disabled={isProc}>
              {isProc ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Feather name="check-circle" size={14} color="#fff" />
                  <Text style={styles.serveBtnText}>Mark Served</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {order.status === 'SERVED' && order.payment_status !== 'PAID' && (
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => handleCheckout(order)}>
              <Feather name="credit-card" size={14} color="#fff" />
              <Text style={styles.checkoutBtnText}>💳 Checkout</Text>
            </TouchableOpacity>
          )}
          {order.payment_status === 'PAID' && (
            <View style={styles.paidBadge}>
              <Feather name="check-circle" size={14} color="#10b981" />
              <Text style={styles.paidText}>PAID</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Group orders
  const pending = orders.filter(o => o.status === 'PENDING');
  const active = orders.filter(o => ['ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  const served = orders.filter(o => o.status === 'SERVED');

  const sections = [
    ...(pending.length ? [{ type: 'header', label: '⚡ Pending Acceptance', id: 'h1' }, ...pending.map(o => ({ ...o, _section: 'pending' }))] : []),
    ...(active.length ? [{ type: 'header', label: '🍽 Active Tickets', id: 'h2' }, ...active.map(o => ({ ...o, _section: 'active' }))] : []),
    ...(served.length ? [{ type: 'header', label: '✅ Served — Checkout', id: 'h3' }, ...served.map(o => ({ ...o, _section: 'served' }))] : []),
  ];

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
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Order Queue</Text>
          <Text style={styles.pageSubtitle}>{orders.length} active tickets</Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>No active orders right now</Text>
          </View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item: any) => item.id || item.type + item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />}
            contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
            renderItem={({ item }: any) => {
              if (item.type === 'header') {
                return (
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{item.label}</Text>
                    <View style={styles.sectionLine} />
                  </View>
                );
              }
              return renderOrder({ item });
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  pageHeader: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff',
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 10 },
  sectionHeaderText: {
    fontSize: 11, fontWeight: '800', letterSpacing: 0.5,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#f1f5f9', borderRadius: 20, color: '#475569',
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 10,
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  strip: { height: 4, width: '100%' },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 8 },
  tableChip: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  tableChipText: { fontSize: 14, fontWeight: '800' },
  orderId: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  orderTime: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  orderAmount: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  itemsList: { paddingHorizontal: 14, paddingBottom: 10 },
  orderItem: { fontSize: 13, color: '#475569', marginBottom: 3 },
  notes: { color: '#f59e0b', fontStyle: 'italic' },
  actionRow: {
    flexDirection: 'row', padding: 10, paddingTop: 0, gap: 8,
    borderTopWidth: 1, borderTopColor: '#f8fafc',
  },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  rejectText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  acceptBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 10,
    backgroundColor: AMBER, alignItems: 'center',
  },
  acceptText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  serveBtn: {
    flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 10,
    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  serveBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  checkoutBtn: {
    flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  checkoutBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  paidBadge: {
    flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#6ee7b7',
  },
  paidText: { fontSize: 12, fontWeight: '800', color: '#10b981' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#64748b' },
  emptySubtitle: { fontSize: 14, color: '#94a3b8' },
});


