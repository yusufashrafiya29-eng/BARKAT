import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Platform, TextInput,
  Modal, ScrollView, Share
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axios';
import { printerService } from '../utils/PrinterService';

const PRIMARY = '#6366f1';      // Indigo — matches web app
const PRIMARY_DARK = '#4f46e5'; // Indigo dark
const PRIMARY_LIGHT = '#eef2ff';// Indigo light
const ORANGE = '#e85d04';       // KOT button — matches web app 'Fire KOT'

export default function CartScreen({ route, navigation }: any) {
  const { cartItems: initialItems, tableId, tableNumber, orderType: passedOrderType } = route.params;

  const [cartItems, setCartItems] = useState<any[]>(
    (initialItems || []).map((item: any) => ({ ...item, notes: '', is_parcel: false }))
  );
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [fetchingActive, setFetchingActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const orderType = passedOrderType || 'DINE_IN';

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guests, setGuests] = useState('');
  const [tipAmount, setTipAmount] = useState('');

  // More popup
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<View>(null);

  useEffect(() => { fetchActiveOrder(); }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (showMore) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }

    return () => {
      if (Platform.OS === 'web') {
        document.body.style.overflow = 'unset';
      }
    };
  }, [showMore]);

  const fetchActiveOrder = async () => {
    try {
      const res = await api.get('/orders/waiter/active');
      const found = (res.data || []).find((o: any) => o.table_id === tableId);
      if (found) setActiveOrder(found);
    } catch { }
    finally { setFetchingActive(false); }
  };

  const updateQty = (cartItemId: string, delta: number) =>
    setCartItems(prev =>
      prev.map(i => (i.cartItemId || i.id) === cartItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter(i => i.quantity > 0)
    );

  const deleteItem = (cartItemId: string) => setCartItems(prev => prev.filter(i => (i.cartItemId || i.id) !== cartItemId));

  const updateNotes = (cartItemId: string, text: string) =>
    setCartItems(prev => prev.map(i => (i.cartItemId || i.id) === cartItemId ? { ...i, notes: text } : i));

  const toggleParcel = (cartItemId: string) =>
    setCartItems(prev => prev.map(i => (i.cartItemId || i.id) === cartItemId ? { ...i, is_parcel: !i.is_parcel } : i));

  const grandTotal = cartItems.reduce((s, i) => {
    const modTotal = (i.selected_modifiers || []).reduce((ms: number, m: any) => ms + m.price, 0);
    return s + (i.price + modTotal) * i.quantity;
  }, 0);

  const buildCombinedItems = (newItems: any[]) => {
    if (!activeOrder) return newItems;
    const combined: any[] = [];
    (activeOrder.items || []).forEach((ex: any) => {
      combined.push({ menu_item_id: ex.menu_item_id, quantity: ex.quantity, notes: ex.notes || '', is_parcel: ex.is_parcel || false });
    });
    newItems.forEach(ni => {
      const hasMods = ni.selected_modifiers && ni.selected_modifiers.length > 0;
      if (!hasMods) {
        const m = combined.find(c => c.menu_item_id === ni.menu_item_id && c.is_parcel === ni.is_parcel && (!c.selected_modifiers || c.selected_modifiers.length === 0));
        if (m) { m.quantity += ni.quantity; }
        else combined.push(ni);
      } else {
        combined.push(ni);
      }
    });
    return combined;
  };

  const placeOrder = async (action: 'kot' | 'save_bill' | 'save_print' | 'save_print_direct' | 'ebill') => {
    if (cartItems.length === 0) {
      const msg = 'Add items to cart first';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Empty Cart', msg);
      return;
    }
    setLoading(true);
    setShowMore(false);
    try {
      const formattedItems = cartItems.map(i => ({
        menu_item_id: i.id,
        quantity: i.quantity,
        notes: i.notes,
        is_parcel: i.is_parcel,
        selected_modifiers: i.selected_modifiers || []
      }));

      let createdOrder: any;

      if (activeOrder) {
        let ph = customerPhone.trim();
        if (ph) {
          ph = ph.replace(/\D/g, '');
          ph = ph.length === 10 ? '+91' + ph : '+' + ph;
        }
        const res = await api.put(`/orders/${activeOrder.id}/items`, { 
            items: buildCombinedItems(formattedItems),
            status: action === 'save_print_direct' ? 'READY' : undefined,
            customer_name: customerName.trim() || undefined,
            customer_phone: ph || undefined,
            guests_count: guests.trim() ? parseInt(guests) : undefined,
            tip_amount: tipAmount.trim() ? parseFloat(tipAmount) : undefined
        });
        createdOrder = res.data || activeOrder;
      } else {
        const payload: any = {
          table_id: tableId,
          order_type: orderType,
          items: formattedItems,
          source: 'WAITER',
          status: action === 'save_print_direct' ? 'READY' : undefined
        };
        if (customerName.trim()) payload.customer_name = customerName.trim();
        if (customerPhone.trim()) {
          let ph = customerPhone.trim().replace(/\D/g, '');
          payload.customer_phone = ph.length === 10 ? '+91' + ph : '+' + ph;
        }
        if (guests.trim()) payload.guests_count = parseInt(guests);
        if (tipAmount.trim()) payload.tip_amount = parseFloat(tipAmount);
        const res = await api.post('/orders/', payload);
        createdOrder = res.data;
      }

      if (action !== 'ebill') {
        const msg = activeOrder ? 'Items added to kitchen!' : '🔥 Order sent to kitchen!';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('✅ Success', msg);
      }

      // Hardware Printing Logic
      if (action === 'save_print' || action === 'save_print_direct') {
        if (Platform.OS === 'web') {
          const pType = localStorage.getItem('printer_type') || 'bluetooth';
          try {
            let billText = `*BARKAT KOT*\n`;
            billText += `Table: ${tableNumber} | Order: ${createdOrder?.id?.slice(-4) || 'NEW'}\n`;
            billText += `------------------------\n`;
            cartItems.forEach(item => {
              billText += `${item.quantity}x ${item.name}\n`;
            });
            billText += `------------------------\n`;
            
            if (pType === 'bluetooth') {
              if (!printerService.device) await printerService.connectBluetooth();
            } else {
              if (!printerService.device) await printerService.connectUSB();
            }
            await printerService.printReceipt(billText, pType as any);
          } catch (err: any) {
            console.error('Print failed:', err);
            window.alert('Print failed: ' + err.message);
          }
        }
      }

      navigation.reset({ index: 0, routes: [{ name: 'Drawer' }] });
    } catch (err: any) {
      const d = err.response?.data?.detail;
      const msg = Array.isArray(d) ? d[0]?.msg : (typeof d === 'string' ? d : 'Failed to place order');
      Platform.OS === 'web' ? window.alert(`Error: ${msg}`) : Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const orderTypeLabel = orderType === 'DINE_IN' ? 'Dine In' : orderType === 'DELIVERY' ? 'Delivery' : 'Pick Up';

  const renderItem = ({ item }: { item: any }) => {
    const modTotal = (item.selected_modifiers || []).reduce((ms: number, m: any) => ms + m.price, 0);
    const itemKey = item.cartItemId || item.id;
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemTop}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            {item.selected_modifiers && item.selected_modifiers.length > 0 && (
              <View style={{ marginTop: 2 }}>
                {item.selected_modifiers.map((mod: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 11, color: '#64748b' }}>
                    • {mod.name} {mod.price ? `(+₹${mod.price})` : ''}
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.itemPrice}>₹{((item.price + modTotal) * item.quantity).toFixed(2)}</Text>
          </View>
          <View style={styles.itemRight}>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(itemKey, -1)}>
                <Feather name="minus" size={14} color={PRIMARY} />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(itemKey, 1)}>
                <Feather name="plus" size={14} color={PRIMARY} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => deleteItem(itemKey)} style={styles.trashBtn}>
              <Feather name="trash-2" size={15} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.itemBottom}>
          <TextInput
            style={[styles.notesInput, { outlineStyle: 'none' } as any]}
            placeholder="Chef notes..."
            placeholderTextColor="#94a3b8"
            value={item.notes}
            onChangeText={t => updateNotes(itemKey, t)}
          />
          <TouchableOpacity
            style={[styles.parcelBtn, item.is_parcel && styles.parcelBtnActive]}
            onPress={() => toggleParcel(itemKey)}
          >
            <MaterialCommunityIcons name="bag-personal" size={13} color={item.is_parcel ? '#f97316' : '#94a3b8'} />
            <Text style={[styles.parcelTxt, item.is_parcel && { color: '#f97316' }]}>PARCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Table {tableNumber}</Text>
            <Text style={styles.headerSub}>{orderTypeLabel}</Text>
          </View>
        </View>

        {/* Customer Details */}
        {!activeOrder && (
          <View style={styles.customerSection}>
            <View style={styles.custRow}>
              <View style={styles.custInput}>
                <Feather name="user" size={13} color="#94a3b8" />
                <TextInput
                  style={[styles.custTI, { outlineStyle: 'none' } as any]}
                  placeholder="Customer Name"
                  placeholderTextColor="#94a3b8"
                  value={customerName} onChangeText={setCustomerName}
                />
              </View>
              <View style={styles.custInput}>
                <Feather name="phone" size={13} color="#94a3b8" />
                <TextInput
                  style={[styles.custTI, { outlineStyle: 'none' } as any]}
                  placeholder="WhatsApp No."
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={customerPhone} onChangeText={setCustomerPhone}
                />
              </View>
            </View>
            <View style={styles.custRow}>
              <View style={styles.custInput}>
                <Feather name="users" size={13} color="#94a3b8" />
                <TextInput
                  style={[styles.custTI, { outlineStyle: 'none' } as any]}
                  placeholder="Guests"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={guests} onChangeText={setGuests}
                />
              </View>
              <View style={styles.custInput}>
                <Text style={styles.rupeeIcon}>₹</Text>
                <TextInput
                  style={[styles.custTI, { outlineStyle: 'none' } as any]}
                  placeholder="Tip Amount"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={tipAmount} onChangeText={setTipAmount}
                />
              </View>
            </View>
          </View>
        )}

        {/* Items list */}
        <Text style={styles.sectionLbl}>DRAFT ITEMS</Text>
        {fetchingActive ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={item => item.cartItemId || item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 220 }}
            ListEmptyComponent={
              <View style={styles.emptyCart}>
                <Feather name="shopping-cart" size={32} color="#cbd5e1" />
                <Text style={styles.emptyCartTxt}>No items in cart</Text>
              </View>
            }
          />
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLbl}>Grand Total</Text>
          <Text style={styles.totalAmt}>₹{grandTotal.toFixed(0)}</Text>
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.bottomBtn, { backgroundColor: '#f1f5f9', flex: 1, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 3 }]} 
            onPress={() => placeOrder('save_print_direct')} 
            disabled={loading || cartItems.length === 0}
          >
            <Feather name="printer" size={16} color="#334155" />
            <Text style={[styles.bottomBtnTxt, { color: '#334155', fontWeight: '800' }]}>Print KOT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.kotBtn, { flex: 1.5 }, (loading || cartItems.length === 0) && { opacity: 0.6 }]}
            onPress={() => placeOrder('kot')}
            disabled={loading || cartItems.length === 0}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Feather name="send" size={14} color="#fff" />
                  <Text style={styles.kotBtnTxt}>Send to Kitchen</Text>
                </>
            }
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 4,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b' },
  onlineBadge: {
    backgroundColor: '#fff0f0', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#fecdd3',
  },
  onlineBadgeText: { fontSize: 11, fontWeight: '700', color: PRIMARY },
  customerSection: {
    backgroundColor: '#fff', padding: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  custRow: { flexDirection: 'row', gap: 8 },
  custInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 9,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#f8fafc', gap: 6,
  },
  custTI: { flex: 1, fontSize: 13, color: '#334155' },
  rupeeIcon: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  sectionLbl: {
    fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6,
  },
  cartItem: {
    backgroundColor: '#fff', marginHorizontal: 10, marginBottom: 7,
    borderRadius: 12, padding: 11,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemLeft: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  itemPrice: { fontSize: 13, color: PRIMARY, fontWeight: '700', marginTop: 2 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden',
  },
  qtyBtn: { padding: 7, backgroundColor: '#f8fafc' },
  qtyNum: { fontSize: 13, fontWeight: '700', color: '#0f172a', paddingHorizontal: 10, minWidth: 30, textAlign: 'center' },
  trashBtn: { padding: 4 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 7 },
  notesInput: {
    flex: 1, fontSize: 12, color: '#334155',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f8fafc',
  },
  parcelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#f8fafc',
  },
  parcelBtnActive: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  parcelTxt: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  emptyCart: { padding: 48, alignItems: 'center', gap: 10 },
  emptyCartTxt: { color: '#94a3b8', fontSize: 14 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  totalLbl: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  totalAmt: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  bottomBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    paddingHorizontal: 6, paddingVertical: 8, gap: 5,
  },
  bottomBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10, gap: 3,
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  bottomBtnTxt: { fontSize: 10, fontWeight: '700', color: '#334155' },
  kotBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: ORANGE, borderRadius: 10, paddingVertical: 10, gap: 5,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  kotBtnTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  // More popup — positioned above the "More" button (bottom-left)
  moreOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end', paddingBottom: 65, paddingLeft: 8,
  },
  morePopup: {
    backgroundColor: '#fff', borderRadius: 14, width: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 10,
    overflow: 'hidden',
  },
  moreItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 16,
  },
  moreItemTxt: { fontSize: 14, fontWeight: '600', color: '#334155' },
});


