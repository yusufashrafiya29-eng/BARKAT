import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, RADIUS, FONT } from '../../constants/theme';
import StatusBadge from '../ui/StatusBadge';
import { Table } from '../../api/types';

interface TableCardProps {
  table: Table;
  onPress: () => void;
}

export default function TableCard({ table, onPress }: TableCardProps) {
  const statusConfig = (COLORS as any)[table.status || 'free'];
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { borderColor: statusConfig.border, backgroundColor: statusConfig.bg }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.tableNumber, { color: statusConfig.text }]}>
          T-{table.table_number}
        </Text>
        {table.status === 'customer' && (
          <View style={styles.acceptBadge}>
            <Text style={styles.acceptText}>ACCEPT</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <StatusBadge status={table.status || 'free'} size="small" />
        <Text style={styles.capacity}>👤 {table.capacity}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 100,
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tableNumber: {
    fontSize: 24,
    fontWeight: FONT.black,
  },
  acceptBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  acceptText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: FONT.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacity: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
});
