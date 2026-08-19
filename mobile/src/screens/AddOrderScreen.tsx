import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { waiterApi } from '../api/waiterApi';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import EmptyState from '../components/EmptyState';

export default function AddOrderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId, role, runnerAllowedCategories } = useAuth();
  
  // Table name and ID passed from navigation route
  const tableId = (route.params as any)?.tableId || 'UnknownId';
  const tableName = (route.params as any)?.tableName || 'Unknown';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        if (restaurantId) {
          const data = await waiterApi.getMenu();
          if (role === 'RUNNER') {
            const allowed = runnerAllowedCategories || [];
            const filtered = data.filter((cat: any) => allowed.includes(cat.id));
            setCategories(filtered);
          } else {
            setCategories(data);
          }
        }
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch menu categories'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [restaurantId, role, runnerAllowedCategories]);
  
  // Calculate total items in cart
  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleAddToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const renderItemCard = (item: any) => {
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.price}>₹{item.price}</Text>
          <View style={[styles.vegIndicator, { borderColor: item.is_veg ? '#22c55e' : '#ef4444' }]}>
            <View style={[styles.vegCircle, { backgroundColor: item.is_veg ? '#22c55e' : '#ef4444' }]} />
          </View>
        </View>
        
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item.id)}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
        
        {/* Quantity overlay if added */}
        {cart[item.id] > 0 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{cart[item.id]}</Text>
          </View>
        )}
      </View>
    );
  };

  // Rehydrate cart if navigating back from CartScreen
  React.useEffect(() => {
    const routeParams = route.params as any;
    if (routeParams?.updatedCart) {
      const newCart: { [key: string]: number } = {};
      routeParams.updatedCart.forEach((item: any) => {
        newCart[item.id] = item.quantity;
      });
      setCart(newCart);
    }
  }, [(route.params as any)?.updatedCart]);

  const handleOpenCart = () => {
    if (cartItemCount === 0) return;
    
    // Convert cart object to array of full item details
    const cartItemsList: any[] = [];
    Object.keys(cart).forEach(itemId => {
      if (cart[itemId] > 0) {
        // Find the item details from categories
        for (const cat of categories) {
          const item = cat.menu_items?.find((i: any) => i.id === itemId);
          if (item) {
            cartItemsList.push({
              ...item,
              quantity: cart[itemId]
            });
            break;
          }
        }
      }
    });

    (navigation.navigate as any)('Cart', {
      tableId,
      tableName,
      cartItems: cartItemsList
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Add Order</Text>
          <Text style={styles.headerSubtitle}>Table: {tableName}</Text>
        </View>
        <TouchableOpacity style={styles.customerButton} onPress={() => {}}>
          <Text style={styles.customerIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search here"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Menu Categories */}
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : categories.length === 0 ? (
        <EmptyState 
          icon="🍽️" 
          message="No menu items" 
          subMessage="Menu is empty or failed to load." 
        />
      ) : (
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.name.toUpperCase()}</Text>
              <View style={styles.gridContainer}>
                {category.menu_items?.map(renderItemCard)}
              </View>
            </View>
          ))}
          {/* Padding for FAB */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB - Cart Button */}
      <TouchableOpacity style={[styles.fab, cartItemCount === 0 && { opacity: 0.5 }]} onPress={handleOpenCart}>
        <Text style={styles.fabIcon}>🛒</Text>
        {cartItemCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{cartItemCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  customerButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  customerIcon: {
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 18,
    color: '#9ca3af',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    paddingVertical: 10,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
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
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
    height: 120, // fixed height for uniformity
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  price: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: 'bold',
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  vegCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  addIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  quantityBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  quantityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981', // Premium green for cart
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
  fabBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  fabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
