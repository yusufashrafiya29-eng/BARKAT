import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, RADIUS, FONT } from '../../constants/theme';
import { MenuItem } from '../../api/types';
import { Minus, Plus } from 'lucide-react-native';
import { haptic } from '../../constants/haptics';

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onUpdateQty: (delta: number) => void;
  onLongPress?: () => void;
}

export default React.memo(function MenuItemCard({ item, quantity, onAdd, onUpdateQty, onLongPress }: Props) {
  
  const handleAdd = () => {
    haptic.light();
    onAdd();
  };

  const handleUpdate = (delta: number) => {
    haptic.select();
    onUpdateQty(delta);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, !item.is_available && styles.disabledCard]}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      disabled={!item.is_available}
    >
      <View style={styles.leftContent}>
        <View style={styles.titleRow}>
          <View style={[
            styles.vegDotContainer,
            { borderColor: item.is_veg ? COLORS.veg : COLORS.nonVeg }
          ]}>
            <View style={[
              styles.vegDot,
              { backgroundColor: item.is_veg ? COLORS.veg : COLORS.nonVeg }
            ]} />
          </View>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        </View>
        
        {item.description && (
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        
        {!item.is_available && (
          <Text style={styles.unavailableText}>Unavailable</Text>
        )}
      </View>

      <View style={styles.rightContent}>
        <Text style={styles.price}>₹{item.price}</Text>
        
        {item.is_available && (
          quantity > 0 ? (
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlBtn} onPress={() => handleUpdate(-1)}>
                <Minus size={16} color={COLORS.primary} />
              </TouchableOpacity>
              
              <Text style={styles.qtyText}>{quantity}</Text>
              
              <TouchableOpacity style={styles.controlBtn} onPress={() => handleUpdate(1)}>
                <Plus size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Plus size={20} color={COLORS.card} />
            </TouchableOpacity>
          )
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  disabledCard: {
    opacity: 0.6,
    backgroundColor: COLORS.background,
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegDotContainer: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: COLORS.text,
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 22, // align with text
  },
  unavailableText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: FONT.semibold,
    marginLeft: 22,
    marginTop: 4,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: FONT.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  controlBtn: {
    padding: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  qtyText: {
    fontWeight: FONT.bold,
    fontSize: 16,
    color: COLORS.primaryDark,
    paddingHorizontal: 8,
  },
});
