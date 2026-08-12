import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT } from '../../constants/theme';

interface Props {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export default function CategoryPill({ label, isActive, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        isActive && styles.activePill
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, isActive && styles.activeText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  activePill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: FONT.medium,
    color: COLORS.textSecondary,
  },
  activeText: {
    color: COLORS.card,
    fontWeight: FONT.bold,
  },
});
