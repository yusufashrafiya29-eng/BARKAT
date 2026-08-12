import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, TextInput, ScrollView, Alert, Platform,
  LayoutAnimation, UIManager
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios';

const PRIMARY = '#6366f1';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TableMenuScreen({ route, navigation }: any) {
  const { tableId, tableNumber, orderType = 'DINE_IN' } = route.params;
  const orderTypeLabel = orderType === 'DINE_IN' ? 'Dine In'
    : orderType === 'DELIVERY' ? 'Delivery' : 'Pick Up';

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu/categories');
      setCategories(res.data || []);
    } catch (e) {
      console.log('menu error', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCat(prev => prev === catId ? null : catId);
  };

  const updateCart = (item: any, delta: number) => {
    setCart(prev => {
      const qty = Math.max(0, (prev[item.id] || 0) + delta);
      const next = { ...prev };
      if (qty === 0) delete next[item.id];
      else next[item.id] = qty;
      return next;
    });
  };

  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);

  const handleGoToCart = () => {
    if (totalItems === 0) return;
    const allItems = categories.flatMap(c => c.menu_items || []);
    const cartArray = Object.keys(cart).map(id => ({
      ...allItems.find((i: any) => i.id === id),
      quantity: cart[id]
    }));
    navigation.navigate('Cart', { cartItems: cartArray, tableId, tableNumber, orderType });
  };

  const handleBack = () => {
    if (totalItems > 0) {
      if (Platform.OS === 'web') {
        if (window.confirm('Items in cart will be lost. Go back?')) navigation.goBack();
      } else {
        Alert.alert('Discard Cart?', 'Going back will clear your cart.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Back', style: 'destructive', onPress: () => navigation.goBack() }
        ]);
      }
    } else {
      navigation.goBack();
    }
  };

  // Search across all categories
  const allItems = categories.flatMap(c =>
    (c.menu_items || []).map((item: any) => ({ ...item, categoryName: c.name }))
  );
  const searchResults = searchQuery.trim()
    ? allItems.filter((i: any) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const renderItem = (item: any) => {
    const qty = cart[item.id] || 0;
    return (
      <View key={item.id} style={styles.itemRow}>
        {/* Veg / Non-Veg indicator */}
        <View style={[styles.vegBox, { borderColor: item.is_veg ? '#10b981' : '#ef4444' }]}>
          <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#10b981' : '#ef4444' }]} />
        </View>

        {/* Item info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹ {Number(item.price).toFixed(1)}</Text>
        </View>

        {/* Quantity controls */}
        {item.is_available !== false ? (
          qty > 0 ? (
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCart(item, -1)}>
                <Feather name="minus" size={14} color={PRIMARY} />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}.0</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCart(item, 1)}>
                <Feather name="plus" size={14} color={PRIMARY} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => updateCart(item, 1)}>
              <Feather name="plus" size={16} color={PRIMARY} />
            </TouchableOpacity>
          )
        ) : (
          <Text style={styles.unavailableTag}>Unavailable</Text>
        )}
      </View>
    );
  };

  const renderSearchItem = (item: any) => {
    const qty = cart[item.id] || 0;
    return (
      <View key={item.id}>
        <Text style={styles.searchCatLabel}>{item.categoryName}</Text>
        {renderItem(item)}
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

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.headerTitle}>Table {tableNumber}</Text>
            <Text style={styles.headerSub}>{orderTypeLabel}</Text>
          </View>
          <TouchableOpacity style={styles.searchIconBtn} onPress={() => { setSearchMode(s => !s); setSearchQuery(''); }}>
            <Feather name={searchMode ? 'x' : 'search'} size={20} color="#334155" />
          </TouchableOpacity>
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineBadgeText}>Online Orders</Text>
          </View>
        </View>

        {/* ── SEARCH BAR (full-screen mode) ── */}
        {searchMode && (
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#94a3b8" />
            <TextInput
              style={[styles.searchInput, { outlineStyle: 'none' } as any]}
              placeholder="Search items by name..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── CONTENT ── */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {searchMode && searchQuery.trim() ? (
            // ── SEARCH RESULTS ──
            searchResults.length > 0
              ? searchResults.map(item => renderSearchItem(item))
              : (
                <View style={styles.emptyState}>
                  <Feather name="search" size={32} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No items found for "{searchQuery}"</Text>
                </View>
              )
          ) : (
            // ── CATEGORY ACCORDION LIST ──
            categories.map(cat => {
              const items: any[] = cat.menu_items || [];
              const isOpen = expandedCat === cat.id;
              const catCartCount = items.reduce((s, i) => s + (cart[i.id] || 0), 0);

              return (
                <View key={cat.id} style={styles.categoryBlock}>
                  {/* Category Header Row */}
                  <TouchableOpacity
                    style={[styles.catHeader, isOpen && styles.catHeaderOpen]}
                    onPress={() => toggleCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.catLeft}>
                      <View style={[styles.catIndicator, { backgroundColor: isOpen ? PRIMARY : '#cbd5e1' }]} />
                      <Text style={[styles.catName, isOpen && styles.catNameOpen]}>{cat.name}</Text>
                      {catCartCount > 0 && (
                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{catCartCount}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.catRight}>
                      <Text style={styles.catItemCount}>{items.length} items</Text>
                      <Feather
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isOpen ? PRIMARY : '#94a3b8'}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Items — visible only when expanded */}
                  {isOpen && (
                    <View style={styles.itemsContainer}>
                      {items.length === 0 ? (
                        <View style={styles.emptyCat}>
                          <Text style={styles.emptyCatText}>No items in this category</Text>
                        </View>
                      ) : (
                        items.map(item => renderItem(item))
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* ── BOTTOM BAR ── */}
        <View style={styles.bottomBar}>
          <View style={styles.dineInCounter}>
            <Feather name="list" size={14} color="#64748b" />
            <Text style={styles.dineInCount}>{orderTypeLabel}: {totalItems}</Text>
          </View>
          <View style={styles.searchBoxBottom}>
            <Feather name="search" size={14} color="#94a3b8" />
            <TextInput
              style={[styles.searchInputBottom, { outlineStyle: 'none' } as any]}
              placeholder="Search items by name, code"
              placeholderTextColor="#94a3b8"
              value={searchMode ? searchQuery : ''}
              onFocus={() => setSearchMode(true)}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.cartBtn, totalItems === 0 && styles.cartBtnDisabled]}
            onPress={handleGoToCart}
            disabled={totalItems === 0}
          >
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
            <Feather name="shopping-cart" size={22} color="#fff" />
            <Text style={styles.cartLabel}>Cart</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8,
  },
  backBtn: { padding: 4 },
  headerMid: { flex: 1, marginLeft: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  searchIconBtn: { padding: 6 },
  onlineBadge: {
    backgroundColor: '#eef2ff', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#c7d2fe',
  },
  onlineBadgeText: { fontSize: 11, fontWeight: '700', color: PRIMARY },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#334155' },

  // Scroll
  scrollView: { flex: 1 },

  // ── CATEGORY ACCORDION ──
  categoryBlock: {
    backgroundColor: '#fff',
    marginBottom: 6,
    borderRadius: 0,
  },
  catHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  catHeaderOpen: {
    borderBottomColor: PRIMARY + '30',
    backgroundColor: '#fafafa',
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIndicator: { width: 4, height: 20, borderRadius: 2 },
  catName: { fontSize: 15, fontWeight: '700', color: '#334155' },
  catNameOpen: { color: PRIMARY },
  catBadge: {
    backgroundColor: PRIMARY, borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  catBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catItemCount: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  // Items container (inside accordion)
  itemsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  emptyCat: { padding: 20, alignItems: 'center' },
  emptyCatText: { color: '#94a3b8', fontSize: 13 },

  // ── ITEM ROW ──
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc', gap: 12,
    backgroundColor: '#fff',
  },
  vegBox: {
    width: 14, height: 14, borderRadius: 2, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  vegDot: { width: 7, height: 7, borderRadius: 1 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  itemPrice: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  // + button (when qty = 0)
  addBtn: {
    width: 34, height: 34, borderRadius: 8,
    borderWidth: 1.5, borderColor: PRIMARY,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#eef2ff',
  },

  // Qty stepper (when qty > 0)
  qtyControls: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 8,
    overflow: 'hidden', backgroundColor: '#fff',
  },
  qtyBtn: { padding: 8, backgroundColor: '#f8f9ff' },
  qtyNum: {
    fontSize: 14, fontWeight: '800', color: PRIMARY,
    minWidth: 30, textAlign: 'center',
  },

  unavailableTag: {
    fontSize: 10, fontWeight: '700', color: '#94a3b8',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },

  // Search results
  searchCatLabel: {
    fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    backgroundColor: '#f8fafc',
  },
  emptyState: { padding: 48, alignItems: 'center', gap: 10 },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500', textAlign: 'center' },

  // ── BOTTOM BAR ──
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  dineInCounter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
  },
  dineInCount: { fontSize: 12, fontWeight: '700', color: '#475569' },
  searchBoxBottom: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 10,
    paddingVertical: 8, gap: 6, borderWidth: 1, borderColor: '#e2e8f0',
  },
  searchInputBottom: { flex: 1, fontSize: 13, color: '#334155' },
  cartBtn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  cartBtnDisabled: { backgroundColor: '#cbd5e1' },
  cartBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#e85d04', borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cartLabel: { fontSize: 10, fontWeight: '700', color: '#fff', marginTop: 2 },
});
