import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT } from '../../constants/theme';
import { OrderItem } from '../../api/types';

interface OrderItemRowProps {
  item: OrderItem;
}

export default function OrderItemRow({ item }: OrderItemRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.qty}>{item.quantity}×</Text>
      <View style={styles.details}>
        <Text style={styles.name}>
          {item.menu_item?.name || 'Unknown Item'}
          {item.is_parcel && <Text style={styles.parcelLabel}> (Parcel)</Text>}
        </Text>
        
        {item.modifiers && item.modifiers.length > 0 && (
          <Text style={styles.modifiers}>
            {item.modifiers.map(m => m.modifier?.name).filter(Boolean).join(', ')}
          </Text>
        )}
        
        {item.notes && (
          <Text style={styles.notes}>Note: {item.notes}</Text>
        )}
      </View>
      <Text style={styles.price}>₹{item.subtotal?.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  qty: {
    width: 24,
    fontSize: 14,
    fontWeight: FONT.bold,
    color: COLORS.primary,
  },
  details: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: FONT.medium,
  },
  parcelLabel: {
    color: COLORS.warning,
    fontSize: 12,
  },
  modifiers: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: FONT.medium,
    color: COLORS.text,
  },
});
