import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';
import PulsingDot from './PulsingDot';

interface StatusBadgeProps {
  status: string; // 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED' | 'customer' | 'running' | 'printed' | 'reserved' | 'free'
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export default function StatusBadge({ status, size = 'small', style }: StatusBadgeProps) {
  const statusKey = status.toLowerCase() as keyof typeof COLORS;
  
  // Try to find the exact style from theme, otherwise default to 'free'
  const config = COLORS[statusKey] || COLORS.free;
  const isPulseRequired = ['pending', 'preparing', 'customer', 'running'].includes(statusKey);
  const label = (config as any).label || status.toUpperCase();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: (config as any).bg,
          borderColor: (config as any).border,
          paddingVertical: size === 'small' ? 4 : 6,
          paddingHorizontal: size === 'small' ? 8 : 12,
        },
        style,
      ]}
    >
      {isPulseRequired && (
        <PulsingDot color={(config as any).dot} size={size === 'small' ? 6 : 8} style={{ marginRight: 6 }} />
      )}
      {!isPulseRequired && (
        <View
          style={{
            width: size === 'small' ? 6 : 8,
            height: size === 'small' ? 6 : 8,
            borderRadius: 4,
            backgroundColor: (config as any).dot,
            marginRight: 6,
          }}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: (config as any).text,
            fontSize: size === 'small' ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontWeight: '700',
  },
});
