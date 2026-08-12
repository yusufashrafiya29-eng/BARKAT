import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Text, KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, RADIUS, FONT, SHADOWS } from '../constants/theme';
import { waiterApi } from '../api/waiterApi';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { Category, MenuItem } from '../api/types';
import MenuItemCard from '../components/menu/MenuItemCard';
import FloatingCartBar from '../components/menu/FloatingCartBar';
import BottomSheet from '../components/ui/BottomSheet';
import Toast from '../components/ui/Toast';
import { haptic } from '../constants/haptics';
import { Search, X, ChevronDown, ChevronUp, ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// --- Accordion Category Section ---
interface CategorySectionProps {
  category: Category;
  cart: any[];
  onAdd: (item: MenuItem) => void;
  onUpdateQty: (item: MenuItem, delta: number) => void;
  searchQuery: string;
}

const CategorySection = React.memo(({ category, cart, onAdd, onUpdateQty, searchQuery }: CategorySectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const items = useMemo(() => {
    if (!searchQuery) return category.menu_items || [];
    const q = searchQuery.toLowerCase();
    return (category.menu_items || []).filter(i => i.name.toLowerCase().includes(q));
  }, [category.menu_items, searchQuery]);

  if (items.length === 0) return null;

  const toggleExpand = () => {
    haptic.select();
    const toValue = expanded ? 0 : 1;
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.categorySection}>
      {/* Category Header */}
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.categoryHeaderLeft}>
          <View style={styles.categoryDot} />
          <Text style={styles.categoryName}>{category.name}</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>{items.length}</Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown color={COLORS.textMuted} size={20} />
        </Animated.View>
      </TouchableOpacity>

      {/* Items List */}
      {expanded && (
        <View style={styles.itemsList}>
          {items.map(item => {
            const cartItem = cart.find(c => c.id === item.id);
            const quantity = cartItem ? cartItem.quantity : 0;
            return (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={quantity}
                onAdd={() => onAdd(item)}
                onUpdateQty={(delta) => onUpdateQty(item, delta)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
});

// --- Main Screen ---
export default function NewOrderScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const restaurantId = useAuthStore(state => state.restaurantId);
  const {
    cart,
    addToCart,
    updateQty,
    clearCart,
    totalAmount,
    itemCount,
    selectedTable,
    setTable,
    guestPax,
  } = useCartStore();

  const passedTable = route.params?.table;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [cartSheetVisible, setCartSheetVisible] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [toastConfig, setToastConfig] = useState({ visible: false, message: '', type: 'info' as any });

  useEffect(() => {
    if (passedTable !== undefined) setTable(passedTable);
  }, [passedTable, setTable]);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await waiterApi.getMenu();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load menu. Check API connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastConfig({ visible: true, message, type });
  };

  const handleAdd = useCallback((item: MenuItem) => {
    haptic.light();
    addToCart(item, [], 1);
  }, [addToCart]);

  const handleUpdateQty = useCallback((item: MenuItem, delta: number) => {
    haptic.select();
    const cartItem = cart.find(c => c.id === item.id);
    if (cartItem) {
      if (delta < 0 && cartItem.quantity === 1) {
        // remove from cart by updateQty bringing it to 0 effectively
        updateQty(cartItem.cartItemId, delta);
      } else {
        updateQty(cartItem.cartItemId, delta);
      }
    }
  }, [cart, updateQty]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      setPlacingOrder(true);
      haptic.success();
      const orderData = {
        table_id: selectedTable?.id || null,
        order_type: selectedTable ? 'DINE_IN' : 'TAKEAWAY',
        items: cart.map(c => ({
          menu_item_id: c.id,
          quantity: c.quantity,
          notes: c.notes || '',
          is_parcel: c.is_parcel,
        })),
        restaurant_id: restaurantId,
        source: 'WAITER',
        is_accepted: true,
        guests_count: guestPax,
        counter_name: 'Captain App',
      };

      await waiterApi.placeOrder(orderData);
      clearCart();
      setCartSheetVisible(false);
      showToast('🔥 KOT Fired! Order sent to kitchen', 'success');
      setTimeout(() => navigation.goBack(), 1200);
    } catch (error: any) {
      haptic.error();
      showToast(error.response?.data?.detail || 'Failed to place order', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(cat =>
      (cat.menu_items || []).some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categories, searchQuery]);

  const tableTitle = selectedTable ? `Table T-${selectedTable.table_number}` : 'Takeaway Order';
  const cartCount = itemCount();
  const cartTotal = totalAmount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{tableTitle}</Text>
          <Text style={styles.headerSub}>
            {categories.length > 0 ? `${categories.length} categories` : 'Loading menu...'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => { setIsSearchActive(!isSearchActive); setSearchQuery(''); }} style={styles.backBtn}>
          {isSearchActive ? <X color={COLORS.danger} size={22} /> : <Search color={COLORS.text} size={22} />}
        </TouchableOpacity>
        {cartCount > 0 && (
          <TouchableOpacity onPress={() => setCartSheetVisible(true)} style={styles.cartBtn}>
            <ShoppingCart color={COLORS.card} size={20} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Search bar */}
      {isSearchActive && (
        <View style={styles.searchBar}>
          <Search color={COLORS.textMuted} size={18} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            placeholderTextColor={COLORS.textLight}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={COLORS.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Menu List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Menu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CategorySection
              category={item}
              cart={cart}
              onAdd={handleAdd}
              onUpdateQty={handleUpdateQty}
              searchQuery={searchQuery}
            />
          )}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}

      {/* Floating Cart Bar */}
      <FloatingCartBar
        itemCount={cartCount}
        totalAmount={cartTotal}
        onViewCart={() => setCartSheetVisible(true)}
      />

      {/* Cart Review Bottom Sheet */}
      <BottomSheet visible={cartSheetVisible} onClose={() => setCartSheetVisible(false)} height="85%">
        {/* Table Banner */}
        <View style={styles.sheetTableBanner}>
          <Text style={styles.sheetTableLabel}>🍽️ {tableTitle}</Text>
          <Text style={styles.sheetItemCount}>{cartCount} items · ₹{cartTotal.toFixed(0)}</Text>
        </View>

        <FlatList
          data={cart}
          keyExtractor={item => item.cartItemId}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => {
            const isLastQty = item.quantity === 1;
            return (
              <View style={styles.cartRow}>
                <View style={styles.cartRowLeft}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(0)}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, isLastQty && styles.removeBtn]}
                    onPress={() => { haptic.select(); updateQty(item.cartItemId, -1); }}
                  >
                    <Text style={[styles.qtyBtnText, isLastQty && styles.removeBtnText]}>
                      {isLastQty ? '🗑' : '−'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => { haptic.select(); updateQty(item.cartItemId, 1); }}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Cart is empty</Text>
          }
        />

        <View style={styles.sheetFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmt}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.fireKotBtn, placingOrder && { opacity: 0.6 }]}
            onPress={handlePlaceOrder}
            disabled={placingOrder || cart.length === 0}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fireKotGradient}
            >
              {placingOrder ? (
                <ActivityIndicator color={COLORS.card} />
              ) : (
                <Text style={styles.fireKotText}>🔥 Fire KOT  ₹{cartTotal.toFixed(2)}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BottomSheet>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: FONT.black,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 120,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: FONT.medium,
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
  },

  // Category Section
  categorySection: {
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  itemCountBadge: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: FONT.bold,
    color: COLORS.primary,
  },
  itemsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: COLORS.background,
  },

  // Cart Sheet
  sheetTitle: {
    fontSize: 20,
    fontWeight: FONT.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cartRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: FONT.semibold,
    color: COLORS.text,
  },
  cartItemPrice: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: FONT.bold,
    color: COLORS.primary,
  },
  qtyVal: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: COLORS.primaryDark,
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  sheetFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: FONT.semibold,
  },
  totalAmt: {
    fontSize: 20,
    fontWeight: FONT.black,
    color: COLORS.primaryDark,
  },
  fireKotBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  fireKotGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireKotText: {
    color: COLORS.card,
    fontSize: 17,
    fontWeight: FONT.bold,
  },
  // Cart sheet
  sheetTableBanner: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTableLabel: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: COLORS.primaryDark,
  },
  sheetItemCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
  removeBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: RADIUS.sm,
  },
  removeBtnText: {
    color: COLORS.danger,
  },
});

