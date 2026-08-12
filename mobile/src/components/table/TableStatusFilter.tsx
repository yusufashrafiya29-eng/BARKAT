import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT } from '../../constants/theme';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'running', label: '🔥 Running' },
  { id: 'customer', label: '⚡ New Order' },
  { id: 'printed', label: '🖨️ Bill Printed' },
  { id: 'reserved', label: 'Reserved' },
];

interface Props {
  activeFilter: string;
  onSelect: (id: string) => void;
}

export default function TableStatusFilter({ activeFilter, onSelect }: Props) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.chip,
              isActive && styles.activeChip
            ]}
            onPress={() => onSelect(filter.id)}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 50,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  text: {
    fontSize: 14,
    fontWeight: FONT.medium,
    color: COLORS.textMuted,
  },
  activeText: {
    color: COLORS.card,
    fontWeight: FONT.bold,
  },
});
