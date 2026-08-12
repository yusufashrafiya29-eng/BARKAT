import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios';

const PRIMARY = '#6366f1';

export default function KOTScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<any>(null);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [ordersRes, tablesRes] = await Promise.all([
        api.get('/orders/waiter/active'),
        api.get('/tables/')
      ]);
      // KOT shows all non-served kitchen tickets
      const kotOrders = (ordersRes.data || []).filter(
        (o: any) => !['SERVED', 'CANCELLED'].includes(o.status)
      );
      setOrders(kotOrders);
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
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING:   { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
    ACCEPTED:  { bg: '#eef2ff', text: '#4338ca', dot: '#6366f1' },
    PREPARING: { bg: '#fdf4ff', text: '#7e22ce', dot: '#a855f7' },
    READY:     { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
  };

  const renderKOT = ({ item: order }: { item: any }) => {
    const sc = STATUS_COLOR[order.status] || STATUS_COLOR.PENDING;
    const tNum = getTableNum(order.table_id);

    return (
      <View style={[styles.kotCard, { backgroundColor: sc.bg }]}>
        {/* KOT Header */}
        <View style={styles.kotHeader}>
          <View style={styles.kotLeft}>
            <View style={[styles.dotIndicator, { backgroundColor: sc.dot }]} />
            <Text style={[styles.kotTableNum, { color: sc.text }]}>Table {tNum}</Text>
          </View>
          <View style={styles.kotRight}>
            <Text style={[styles.kotStatus, { color: sc.text }]}>{order.status}</Text>
            <Text style={styles.kotTime}>{getElapsed(order.created_at)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.kotDivider, { borderColor: sc.dot + '40' }]} />

        {/* KOT Details */}
        <Text style={styles.kotOrderNum}>KOT #{order.id.slice(0, 8).toUpperCase()}</Text>

        {/* Items */}
        <View style={styles.kotItems}>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} style={styles.kotItemRow}>
              <Text style={[styles.kotQty, { color: sc.text }]}>{item.quantity}×</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.kotItemName, { color: sc.text }]}>
                  {item.menu_item?.name || 'Item'}
                </Text>
                {item.notes ? (
                  <Text style={styles.kotItemNotes}>📝 {item.notes}</Text>
                ) : null}
                {item.is_parcel ? (
                  <Text style={styles.parcelTag}>📦 PARCEL</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Footer: Total */}
        <View style={[styles.kotFooter, { borderColor: sc.dot + '40' }]}>
          <Text style={[styles.kotTotal, { color: sc.text }]}>
            ₹{order.total_amount?.toFixed(2)}
          </Text>
          {order.customer_name && (
            <Text style={[styles.kotCustomer, { color: sc.text }]}>
              👤 {order.customer_name}
            </Text>
          )}
        </View>
      </View>
    );
  };

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
          <View>
            <Text style={styles.pageTitle}>🔥 KOT Board</Text>
            <Text style={styles.pageSubtitle}>Kitchen Order Tickets · {orders.length} active</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders()}>
            <Feather name="refresh-cw" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="check-circle" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Kitchen All Clear!</Text>
            <Text style={styles.emptySubtitle}>No pending kitchen tickets</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            renderItem={renderKOT}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff',
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  refreshBtn: {
    padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  kotCard: {
    borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  kotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  kotLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kotRight: { alignItems: 'flex-end' },
  dotIndicator: { width: 10, height: 10, borderRadius: 5 },
  kotTableNum: { fontSize: 18, fontWeight: '800' },
  kotStatus: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  kotTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  kotDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginBottom: 10 },
  kotOrderNum: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 10 },
  kotItems: { gap: 8, marginBottom: 12 },
  kotItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  kotQty: { fontSize: 16, fontWeight: '900', minWidth: 28 },
  kotItemName: { fontSize: 15, fontWeight: '600' },
  kotItemNotes: { fontSize: 12, color: '#b45309', fontStyle: 'italic', marginTop: 2 },
  parcelTag: { fontSize: 10, fontWeight: '700', color: '#f97316', marginTop: 2 },
  kotFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderStyle: 'dashed', paddingTop: 10,
  },
  kotTotal: { fontSize: 18, fontWeight: '800' },
  kotCustomer: { fontSize: 13, fontWeight: '600' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#64748b' },
  emptySubtitle: { fontSize: 14, color: '#94a3b8' },
});


