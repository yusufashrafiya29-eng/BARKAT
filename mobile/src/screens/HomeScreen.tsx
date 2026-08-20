import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { waiterApi } from '../api/waiterApi';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const navigation = useNavigation();

  const [tables, setTables] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Timer ticker to force re-render every minute for accurate elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tablesData, ordersData] = await Promise.all([
        waiterApi.getTables(),
        waiterApi.getAllOrders()
      ]);
      
      setTables(tablesData);
      setActiveOrders(ordersData);

      // Extract unique categories
      const cats = Array.from(new Set(tablesData.map((t: any) => t.category || 'Other')));
      setCategories(['All', ...cats] as string[]);
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

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTablePress = (table: any, isOccupied: boolean, orderId?: string) => {
    if (isOccupied && orderId) {
      (navigation.navigate as any)('OrderDetail', { orderId });
    } else {
      (navigation.navigate as any)('AddOrder', { tableId: table.id, tableName: table.name || table.table_number.toString() });
    }
  };

  const filteredTables = activeCategory === 'All' 
    ? tables 
    : tables.filter(t => (t.category || 'Other') === activeCategory);

  const renderCategoryTab = (category: string) => (
    <TouchableOpacity 
      key={category}
      style={[styles.tab, activeCategory === category && styles.activeTab]}
      onPress={() => setActiveCategory(category)}
    >
      <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderTableCard = (item: any) => {
    const tableName = item.name || item.table_number.toString();
    
    // Find if table has an active order
    const activeOrder = activeOrders.find(o => o.table?.id === item.id || o.table_id === item.id);
    const isOccupied = !!activeOrder;
    
    // Calculate elapsed time if occupied
    let badgeText = '';
    let statusColor = '#f3f4f6'; // Default empty (light grey)
    let textColor = '#888';

    if (isOccupied && activeOrder) {
      // Ensure the timestamp is parsed as UTC by appending 'Z' if it doesn't already have timezone info
      const timeStr = activeOrder.created_at.endsWith('Z') || activeOrder.created_at.includes('+') 
        ? activeOrder.created_at 
        : `${activeOrder.created_at}Z`;
        
      const orderTime = new Date(timeStr);
      // Fallback to avoid negative timers if the local device clock is slightly behind the server
      const diffMins = Math.max(0, Math.floor((currentTime.getTime() - orderTime.getTime()) / 60000));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      badgeText = hours > 0 
        ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}` 
        : `00:${diffMins.toString().padStart(2, '0')}`;
        
      // Color logic based on status
      const status = activeOrder.status?.toLowerCase();
      if (status === 'pending') {
        statusColor = '#fef3c7'; // Amber/Yellow
      } else {
        statusColor = '#dcfce7'; // Light Green
      }
      textColor = '#111827';
    }

    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.tableCard, { backgroundColor: statusColor }]}
        onPress={() => handleTablePress(item, isOccupied, activeOrder?.id)}
      >
        {(isOccupied && badgeText !== '') ? (
          <View style={[styles.statusBadge, { backgroundColor: statusColor === '#fef3c7' ? '#fbbf24' : '#4ade80' }]}>
            <Text style={styles.statusText}>🕒 {badgeText}</Text>
          </View>
        ) : null}
        
        <Text style={[styles.tableName, { color: isOccupied ? textColor : '#374151' }]}>{tableName}</Text>
        
        <Text style={[styles.tableCapacity, { color: isOccupied ? '#111827' : '#9ca3af' }]}>
          {isOccupied && activeOrder?.total_amount ? `₹ ${activeOrder.total_amount.toFixed(0)}` : 'Empty'}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleScrollToCategory = (category: string) => {
    setActiveCategory(category);
    // In a full implementation, this would use a ScrollView reference to scroll to the Y offset.
    // For now, we update the active state so the UI underlines the correct tab.
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Tables</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {categories.map(category => (
            <TouchableOpacity 
              key={category}
              style={[styles.tab, activeCategory === category && styles.activeTab]}
              onPress={() => handleScrollToCategory(category)}
            >
              <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
                {category.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : tables.length === 0 ? (
        <EmptyState 
          icon="🪑" 
          message="No tables found" 
          subMessage="Add tables from the admin panel." 
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {categories.map(category => {
            if (category === 'All') return null;
            if (activeCategory !== 'All' && category !== activeCategory) return null;

            const categoryTables = tables.filter(t => (t.category || 'Other') === category);
            if (categoryTables.length === 0) return null;
            
            return (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                <View style={styles.gridContainer}>
                  {categoryTables.map(table => renderTableCard(table))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  menuIcon: {
    color: '#111827',
    fontSize: 24,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    color: '#6b7280',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tableCard: {
    width: '30%',
    minWidth: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  tableName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tableCapacity: {
    fontSize: 14,
  },
  statusBadge: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#111827',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
