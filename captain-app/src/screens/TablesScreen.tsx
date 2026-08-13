import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, ActivityIndicator, RefreshControl, Alert, Platform,
  Modal, TextInput, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { waiterApi } from '../api/waiterApi';
import api from '../api/axios';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#6366f1';      // Indigo — matches web app
const PRIMARY_DARK = '#4f46e5';
const YELLOW = '#FFC107';       // Occupied table — same as web app
const SETTLE_RED = '#e85d04';   // Settle & Save — orange like web app KOT btn

type OrderType = 'DINE_IN' | 'DELIVERY' | 'PICKUP';

export default function TablesScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('AC');
  const [tables, setTables] = useState<any[]>([]);
  const [tableOrderMap, setTableOrderMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<any>(null);

  // Order type popup
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>('DINE_IN');

  // 3-dot menu
  const [threeDotTable, setThreeDotTable] = useState<any>(null);
  const [showThreeDot, setShowThreeDot] = useState(false);

  // Add Table Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNo, setNewTableNo] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [newCategory, setNewCategory] = useState('AC');
  const [addingTable, setAddingTable] = useState(false);

  const getElapsedTime = (dateString: string) => {
    if (!dateString) return '0m';
    const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const fetchTablesAndOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [tablesRes, ordersRes] = await Promise.all([
        waiterApi.getTables(),
        waiterApi.getAllOrders()
      ]);
      const activeOrders: any[] = ordersRes || [];

      // Build tableId → order map (pick the most recent non-SERVED or SERVED-unpaid order)
      const orderMap: Record<string, any> = {};
      activeOrders.forEach((o: any) => {
        if (!o.table_id) return;
        const existing = orderMap[o.table_id];
        if (!existing) { orderMap[o.table_id] = o; }
      });

      const mapped = (tablesRes || []).map((t: any) => {
        const order = orderMap[t.id];
        
        let tableStatus = 'free';
        if (order) {
           if (order.status === 'SERVED' && order.payment_status !== 'PAID') {
             tableStatus = 'printed';
           } else if (order.source === 'CUSTOMER' && order.status === 'PENDING') {
             tableStatus = 'customer';
           } else {
             tableStatus = 'running';
           }
        }

        return {
          ...t,
          active_order: order || null,
          is_occupied: !!order,
          tableStatus,
          active_order_amount: order?.total_amount || 0,
          active_order_time: order?.created_at || null,
          order_status: order?.status || null,
          payment_status: order?.payment_status || null,
        };
      });
      setTables(mapped);
      setTableOrderMap(orderMap);
    } catch { }
    finally { if (!silent) setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTablesAndOrders();
      intervalRef.current = setInterval(() => fetchTablesAndOrders(true), 5000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTablesAndOrders(true);
    setRefreshing(false);
  }, []);

  const filteredTables = tables.filter(t => {
    const cat = ((t.category || t.zone_type || 'AC') + '').toLowerCase().trim();
    const tab = activeTab.toLowerCase().trim();
    return cat === tab;
  });

  const handleTablePress = (table: any) => {
    if (!table.is_occupied) {
      // Free table → go to menu with selected order type
      navigation.navigate('TableMenu', {
        tableId: table.id,
        tableNumber: table.table_number,
        orderType: selectedOrderType,
      });
    } else {
      // Occupied table → open 3-dot options
      setThreeDotTable(table);
      setShowThreeDot(true);
    }
  };

  const handleSettleAndSave = (table: any) => {
    setShowThreeDot(false);
    if (!table.active_order) return;
    navigation.navigate('Checkout', {
      orderId: table.active_order.id,
      tableNumber: table.table_number,
    });
  };

  const handleAddOrder = (table: any) => {
    setShowThreeDot(false);
    navigation.navigate('TableMenu', {
      tableId: table.id,
      tableNumber: table.table_number,
      orderType: selectedOrderType,
    });
  };

  const handleDeleteOrder = async (table: any) => {
    setShowThreeDot(false);
    if (!table.active_order) return;
    const doDelete = async () => {
      try {
        await waiterApi.deleteOrder(table.active_order.id);
        fetchTablesAndOrders(true);
      } catch (e: any) {
        const msg = e.response?.data?.detail || 'Failed to delete';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete order for this table?')) doDelete();
    } else {
      Alert.alert('Delete Order?', 'This will remove the active order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  const handleAddTable = async () => {
    if (!newTableNo.trim()) {
      const msg = 'Please enter a table number';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }
    setAddingTable(true);
    try {
      await api.post('/tables/', {
        table_number: parseInt(newTableNo),
        capacity: parseInt(newCapacity) || 4,
        category: newCategory,
      });
      setShowAddModal(false);
      setNewTableNo(''); setNewCapacity('4'); setNewCategory('AC');
      fetchTablesAndOrders();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add table';
      Platform.OS === 'web' ? window.alert(`Error: ${msg}`) : Alert.alert('Error', msg);
    } finally { setAddingTable(false); }
  };

  const orderTypeLabel = selectedOrderType === 'DINE_IN' ? 'Dine In'
    : selectedOrderType === 'DELIVERY' ? 'Delivery' : 'Pick Up';

  const renderTable = ({ item: table }: { item: any }) => {
    const isOccupied = table.is_occupied;
    const isServedUnpaid = table.order_status === 'SERVED' && table.payment_status !== 'PAID';

    const STATUS_COLORS: any = {
      free: { bg: '#ffffff', text: '#334155', border: 'rgba(0,0,0,0.07)' },
      customer: { bg: '#eef2ff', text: '#4338ca', border: '#a5b4fc' }, 
      running: { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },  
      printed: { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },  
      reserved: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' }
    };
    const style = STATUS_COLORS[table.tableStatus || 'free'];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleTablePress(table)}
        style={[
          styles.card,
          { backgroundColor: style.bg, borderColor: style.border, borderWidth: 1.5 }
        ]}
      >
        {/* Time badge */}
        {isOccupied && table.active_order_time && (
          <View style={[styles.timeBadge, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
            <Feather name="clock" size={10} color={style.text} />
            <Text style={[styles.timeText, { color: style.text }]}>{getElapsedTime(table.active_order_time)}</Text>
          </View>
        )}

        {/* Table number */}
        <Text style={[styles.tableNum, { color: style.text }]}>
          {table.table_number}
        </Text>

        {/* Settle & Save button OR amount + 3-dot */}
        {isOccupied ? (
          isServedUnpaid ? (
            <TouchableOpacity
              style={[styles.settleBtn, { backgroundColor: '#10b981', shadowColor: '#10b981' }]}
              onPress={() => handleSettleAndSave(table)}
              activeOpacity={0.85}
            >
              <Text style={styles.settleBtnText}>Settle & Save</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cardFooter}>
              <Text style={[styles.amountText, { color: style.text }]}>
                {table.active_order_amount ? `₹${Math.round(table.active_order_amount)}` : ''}
              </Text>
              <TouchableOpacity
                onPress={() => { setThreeDotTable(table); setShowThreeDot(true); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="more-vertical" size={16} color={style.text} />
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.cardFooter}>
            <Text style={styles.availableText}>Available</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* AC / Non AC Tabs */}
        <View style={styles.tabRow}>
          {['AC', 'Non AC'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tables Grid */}
        <FlatList
          data={filteredTables}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTable}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="table-off" size={44} color="#cbd5e1" />
              <Text style={styles.emptyText}>No tables in this section</Text>
              <TouchableOpacity style={styles.addEmptyBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.addEmptyBtnText}>+ Add Table</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.dineInBtn} onPress={() => setShowOrderTypeModal(true)}>
            <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color="#fff" />
            <Text style={styles.dineInText}>{orderTypeLabel}</Text>
            <Feather name="chevron-up" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addTableBtn} onPress={() => setShowAddModal(true)}>
            <Feather name="plus-circle" size={18} color={PRIMARY} />
            <Text style={styles.addTableText}>Add Table</Text>
          </TouchableOpacity>
        </View>

        {/* ── ORDER TYPE MODAL ── */}
        <Modal visible={showOrderTypeModal} transparent animationType="slide" onRequestClose={() => setShowOrderTypeModal(false)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowOrderTypeModal(false)}>
            <View style={styles.orderTypeSheet}>
              {(['DINE_IN', 'DELIVERY', 'PICKUP'] as OrderType[]).map((type, idx) => {
                const label = type === 'DINE_IN' ? 'Dine In' : type === 'DELIVERY' ? 'Delivery' : 'Pick Up';
                const isSelected = selectedOrderType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.orderTypeItem,
                      isSelected && styles.orderTypeItemActive,
                      idx < 2 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }
                    ]}
                    onPress={() => { setSelectedOrderType(type); setShowOrderTypeModal(false); }}
                  >
                    <Text style={[styles.orderTypeText, isSelected && styles.orderTypeTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── 3-DOT MENU MODAL ── */}
        <Modal visible={showThreeDot} transparent animationType="fade" onRequestClose={() => setShowThreeDot(false)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowThreeDot(false)}>
            <View style={styles.threeDotSheet}>
              <View style={styles.threeDotHeader}>
                <Text style={styles.threeDotTitle}>Table {threeDotTable?.table_number}</Text>
                <Text style={styles.threeDotSub}>
                  {threeDotTable?.order_status} · ₹{Math.round(threeDotTable?.active_order_amount || 0)}
                </Text>
              </View>
              {[
                { label: 'Add / Edit Items', icon: 'edit-2', action: () => handleAddOrder(threeDotTable) },
                { label: 'Settle & Save', icon: 'credit-card', action: () => handleSettleAndSave(threeDotTable), color: PRIMARY },
                { label: 'Delete Order', icon: 'trash-2', action: () => handleDeleteOrder(threeDotTable), color: '#ef4444' },
              ].map((opt, i) => (
                <TouchableOpacity key={i} style={styles.threeDotItem} onPress={opt.action}>
                  <Feather name={opt.icon as any} size={18} color={opt.color || '#334155'} />
                  <Text style={[styles.threeDotItemText, { color: opt.color || '#334155' }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── ADD TABLE MODAL ── */}
        <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add New Table</Text>
              <View style={styles.modalRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Table No.</Text>
                  <TextInput
                    style={[styles.textInput, { outlineStyle: 'none' } as any]}
                    keyboardType="numeric"
                    value={newTableNo}
                    onChangeText={setNewTableNo}
                    placeholder="Table number"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Capacity</Text>
                  <TextInput
                    style={[styles.textInput, { outlineStyle: 'none' } as any]}
                    keyboardType="numeric"
                    value={newCapacity}
                    onChangeText={setNewCapacity}
                    placeholder="Seats"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.toggleRow}>
                {['AC', 'Non AC'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.toggleBtn, newCategory === cat && styles.toggleBtnActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[styles.toggleBtnText, newCategory === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createBtn, addingTable && { opacity: 0.7 }]}
                  onPress={handleAddTable}
                  disabled={addingTable}
                >
                  {addingTable
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.createBtnText}>Create</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerAll: { justifyContent: 'center', alignItems: 'center' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 14, paddingHorizontal: 20, marginRight: 4,
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: PRIMARY },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  activeTabText: { color: PRIMARY, fontWeight: '800' },
  listContent: { padding: 10, paddingBottom: 90 },
  card: {
    flex: 1, margin: 6, minHeight: 110, borderRadius: 12, padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  timeText: { fontSize: 10, fontWeight: '700', color: '#5c4000' },
  tableNum: { fontSize: 34, fontWeight: '900', textAlign: 'center', marginVertical: 2 },
  settleBtn: {
    backgroundColor: SETTLE_RED, borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
    shadowColor: SETTLE_RED, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 3,
  },
  settleBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountText: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  availableText: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textAlign: 'center', width: '100%' },
  emptyBox: { padding: 48, alignItems: 'center', gap: 12 },
  emptyText: { color: '#64748b', fontSize: 15, fontWeight: '500' },
  addEmptyBtn: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: PRIMARY, borderRadius: 10,
  },
  addEmptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  dineInBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 12, gap: 6,
  },
  dineInText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  addTableBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, gap: 6,
    borderWidth: 1.5, borderColor: PRIMARY,
  },
  addTableText: { color: PRIMARY, fontWeight: '700', fontSize: 14 },
  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  orderTypeSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: 'hidden', marginBottom: 0,
  },
  orderTypeItem: {
    paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center',
  },
  orderTypeItemActive: { backgroundColor: PRIMARY },
  orderTypeText: { fontSize: 17, fontWeight: '700', color: '#334155' },
  orderTypeTextActive: { color: '#fff' },
  threeDotSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 20, paddingBottom: 32,
  },
  threeDotHeader: {
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  threeDotTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  threeDotSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  threeDotItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  threeDotItemText: { fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    width: '88%', maxWidth: 400,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  modalRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfInput: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  textInput: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
    color: '#0f172a', backgroundColor: '#fff',
  },
  toggleRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, overflow: 'hidden', marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f8fafc' },
  toggleBtnActive: { backgroundColor: PRIMARY },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  createBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    backgroundColor: PRIMARY, alignItems: 'center',
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});


