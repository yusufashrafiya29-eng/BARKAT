import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

const PRIMARY = '#6366f1';

interface CustomizationModalProps {
  visible: boolean;
  item: any;
  onClose: () => void;
  onAddToCart: (item: any, selectedModifiers: any[], quantity: number, notes: string) => void;
}

export default function CustomizationModal({ visible, item, onClose, onAddToCart }: CustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedMods, setSelectedMods] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setNotes('');
      setSelectedMods({});
    }

    if (Platform.OS === 'web') {
      if (visible) {
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
  }, [visible]);

  if (!item) return null;

  const handleToggleModifier = (group: any, mod: any) => {
    const currentSelected = selectedMods[group.id] || [];
    const isSelected = currentSelected.some(m => m.id === mod.id);

    if (isSelected) {
      setSelectedMods({
        ...selectedMods,
        [group.id]: currentSelected.filter(m => m.id !== mod.id)
      });
    } else {
      if (group.max_selections === 1) {
        setSelectedMods({
          ...selectedMods,
          [group.id]: [mod]
        });
      } else {
        if (currentSelected.length >= group.max_selections) {
          const msg = `You can only select up to ${group.max_selections} options for ${group.name}`;
          Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Limit Reached', msg);
          return;
        }
        setSelectedMods({
          ...selectedMods,
          [group.id]: [...currentSelected, mod]
        });
      }
    }
  };

  const calculateTotal = () => {
    let modTotal = 0;
    let basePrice = item.price;
    Object.keys(selectedMods).forEach(groupId => {
      const group = item.modifier_groups?.find((g: any) => g.id === groupId);
      const mods = selectedMods[groupId] || [];
      mods.forEach(m => {
        if (group?.price_replaces_base) {
          basePrice = m.price;
        } else {
          modTotal += m.price;
        }
      });
    });
    return (basePrice + modTotal) * quantity;
  };

  const handleAdd = () => {
    for (const group of (item.modifier_groups || [])) {
      const selected = selectedMods[group.id] || [];
      if (group.is_required && selected.length === 0) {
        const msg = `Please select an option for ${group.name}`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Required', msg);
        return;
      }
      if (selected.length < group.min_selections) {
        const msg = `Please select at least ${group.min_selections} options for ${group.name}`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Required', msg);
        return;
      }
    }

    const flatModifiers = Object.values(selectedMods).flat();
    onAddToCart(item, flatModifiers, quantity, notes);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>Customize your item</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
            {(item.modifier_groups || []).map((group: any) => (
              <View key={group.id} style={styles.groupContainer}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {group.is_required ? 'Required' : 'Optional'}
                      {group.max_selections > 1 && ` (Max ${group.max_selections})`}
                    </Text>
                  </View>
                </View>

                {group.modifiers?.map((mod: any) => {
                  const isSelected = (selectedMods[group.id] || []).some(m => m.id === mod.id);
                  return (
                    <TouchableOpacity
                      key={mod.id}
                      style={[styles.modRow, isSelected && styles.modRowSelected]}
                      onPress={() => handleToggleModifier(group, mod)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.modLeft}>
                        <View style={[
                          group.max_selections === 1 ? styles.radio : styles.checkbox,
                          isSelected && styles.checked
                        ]}>
                          {isSelected && group.max_selections === 1 && <View style={styles.radioInner} />}
                          {isSelected && group.max_selections > 1 && <Feather name="check" size={12} color="#fff" />}
                        </View>
                        <Text style={[styles.modName, isSelected && styles.modNameSelected]}>{mod.name}</Text>
                      </View>
                      {mod.price > 0 && <Text style={styles.modPrice}>+₹{mod.price}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={styles.notesContainer}>
              <Text style={styles.groupTitle}>Special Instructions</Text>
              <TextInput
                style={[styles.notesInput, { outlineStyle: 'none' } as any]}
                placeholder="e.g. less spicy..."
                placeholderTextColor="#94a3b8"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                <Feather name="minus" size={20} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                <Feather name="plus" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.9}>
              <Text style={styles.addBtnText}>Add Item</Text>
              <Text style={styles.addBtnPrice}>₹{calculateTotal().toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { padding: 20 },
  groupContainer: { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  modRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  modRowSelected: { borderColor: PRIMARY, backgroundColor: '#eef2ff' },
  modLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checked: { borderColor: PRIMARY, backgroundColor: PRIMARY },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  modName: { fontSize: 14, fontWeight: '500', color: '#334155' },
  modNameSelected: { color: PRIMARY, fontWeight: '600' },
  modPrice: { fontSize: 14, color: '#64748b' },
  notesContainer: { marginBottom: 20 },
  notesInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', minHeight: 80, textAlignVertical: 'top' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginVertical: 10 },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  qtyText: { fontSize: 20, fontWeight: '800', color: '#0f172a', width: 30, textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  addBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  addBtnPrice: { fontSize: 16, fontWeight: '800', color: '#fff' }
});
