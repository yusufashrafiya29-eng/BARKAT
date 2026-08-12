import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, RADIUS, SHADOWS, FONT } from '../constants/theme';
import { waiterApi } from '../api/waiterApi';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { Table, Reservation } from '../api/types';
import Header from '../components/layout/Header';
import TableCard from '../components/table/TableCard';
import TableStatusFilter from '../components/table/TableStatusFilter';
import { Plus, AlertCircle } from 'lucide-react-native';

export default function TablesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const restaurantName = useAuthStore(state => state.restaurantName);
  const { activeOrders, reservations, fetchOrders } = useOrderStore();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true);
      const [tablesData] = await Promise.all([
        waiterApi.getTables(),
        fetchOrders(),
      ]);
      setTables(Array.isArray(tablesData) ? tablesData : []);
    } catch (err: any) {
      console.error('Failed to load tables:', err);
      setError(err?.response?.data?.detail || err?.message || 'Could not load tables. Check network/API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    loadData();
    const intervalId = setInterval(() => { fetchOrders(); }, 5000);
    return () => clearInterval(intervalId);
  }, [loadData, fetchOrders]);

  const derivedTables = useMemo(() => {
    return tables.map(table => {
      const tableOrders = activeOrders.filter(o => o.table_id === table.id);
      const hasCustomerPending = tableOrders.some(o => o.source === 'CUSTOMER' && o.status === 'PENDING');
      const hasRunningOrder = tableOrders.some(o => ['ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
      const isReserved = reservations.some((r: Reservation) => r.table_id === table.id);

      let status = 'free';
      if (hasCustomerPending) status = 'customer';
      else if (hasRunningOrder) status = 'running';
      else if (isReserved) status = 'reserved';
      return { ...table, status };
    });
  }, [tables, activeOrders, reservations]);

  const filteredTables = useMemo(() => {
    if (activeFilter === 'all') return derivedTables;
    return derivedTables.filter(t => t.status === activeFilter);
  }, [derivedTables, activeFilter]);

  const pendingCount = activeOrders.filter(o => o.source === 'CUSTOMER' && o.status === 'PENDING').length;

  const handleTablePress = (table: Table) => {
    navigation.navigate('NewOrder', { table });
  };

  const renderTableCard = ({ item }: { item: Table }) => (
    <View style={styles.cardWrapper}>
      <TableCard table={item} onPress={() => handleTablePress(item)} />
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Floor Plan...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerBox}>
          <AlertCircle color={COLORS.danger} size={48} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredTables.length === 0) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>No Tables Found</Text>
          <Text style={styles.errorMsg}>
            {tables.length === 0
              ? 'No tables found on server. Add tables from the admin panel.'
              : 'No tables match the current filter.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredTables}
        keyExtractor={(item) => item.id}
        renderItem={renderTableCard}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[COLORS.primary]}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={restaurantName || 'Restaurant'}
        subtitle="Floor Plan"
        rightAction="notification"
        badgeCount={pendingCount}
        onRightPress={() => navigation.navigate('Orders')}
      />

      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.8}
        >
          <Text style={styles.pendingBannerText}>
            ⚡ {pendingCount} New Customer {pendingCount === 1 ? 'Order' : 'Orders'} Waiting
          </Text>
        </TouchableOpacity>
      )}

      <TableStatusFilter activeFilter={activeFilter} onSelect={setActiveFilter} />

      {renderContent()}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('NewOrder', { table: null })}
      >
        <Plus color={COLORS.card} size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 15,
    fontWeight: FONT.medium,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: FONT.bold,
    color: COLORS.text,
    marginTop: 12,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  retryText: {
    color: COLORS.card,
    fontWeight: FONT.bold,
    fontSize: 15,
  },
  pendingBanner: {
    backgroundColor: '#fffbeb',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    alignItems: 'center',
  },
  pendingBannerText: {
    color: '#b45309',
    fontWeight: FONT.bold,
    fontSize: 14,
  },
  listContent: {
    padding: 8,
    paddingBottom: 100,
  },
  row: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    flex: 0.5,
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 88,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});
