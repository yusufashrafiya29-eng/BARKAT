import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { waiterApi } from '../api/waiterApi';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

export default function KOTScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { token } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrdersAndTables = async () => {
    try {
      const [ordersData, tablesData] = await Promise.all([
        waiterApi.getAllOrders(),
        waiterApi.getTables()
      ]);
      setOrders(ordersData);
      setTables(tablesData);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch data'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchOrdersAndTables();
    }
  }, [isFocused, token]);

  // Listen to real-time WebSocket updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'order_update') {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === lastMessage.order_id 
            ? { ...order, status: lastMessage.status, items: lastMessage.items || order.items } 
            : order
        )
      );
    }
  }, [lastMessage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrdersAndTables();
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return '#f59e0b'; // amber
      case 'accepted': return '#3b82f6'; // blue
      case 'preparing': return '#8b5cf6'; // purple
      case 'ready': return '#10b981'; // green
      case 'served': return '#6b7280'; // gray
      case 'completed': return '#22c55e'; // green
      case 'cancelled': return '#ef4444'; // red
      default: return '#888';
    }
  };

  const getStatusText = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending':
      case 'accepted':
        return 'Order sent to kitchen';
      case 'preparing':
        return 'Order will be ready in some time';
      case 'ready':
        return 'Order ready';
      case 'served':
        return 'Order served';
      default:
        return status;
    }
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    // Calculate total items
    const itemCount = item.items ? item.items.reduce((acc: number, curr: any) => acc + curr.quantity, 0) : 0;
    
    // Parse time
    const orderTime = new Date(item.created_at);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - orderTime.getTime()) / 60000);
    const timeDisplay = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins/60)}h ${diffMins%60}m ago`;

    // Find table name
    const table = tables.find(t => t.id === item.table_id);
    const tableName = table ? (table.name || table.table_number.toString()) : 'Unknown Table';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.tableName}>{tableName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Items:</Text>
            <Text style={styles.infoValue}>{itemCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total:</Text>
            <Text style={styles.infoValueTotal}>₹{item.total_amount?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>{timeDisplay}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KOT Status</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : orders.length === 0 ? (
        <EmptyState 
          icon="📝" 
          message="No active orders" 
          subMessage="Orders punched by you will appear here." 
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoRow: {
    alignItems: 'center',
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  infoValueTotal: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
