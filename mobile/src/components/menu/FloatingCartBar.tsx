import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, RADIUS, FONT } from '../../constants/theme';
import { ShoppingBag, ArrowRight } from 'lucide-react-native';
import { haptic } from '../../constants/haptics';

interface Props {
  itemCount: number;
  totalAmount: number;
  onViewCart: () => void;
}

export default function FloatingCartBar({ itemCount, totalAmount, onViewCart }: Props) {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (itemCount > 0) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [itemCount]);

  if (itemCount === 0 && (translateY as any)._value === 100) {
    return null;
  }

  const handlePress = () => {
    haptic.light();
    onViewCart();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.left}>
            <ShoppingBag color={COLORS.card} size={20} style={styles.icon} />
            <Text style={styles.summaryText}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.right}>
            <Text style={styles.actionText}>Place KOT</Text>
            <ArrowRight color={COLORS.card} size={18} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    ...SHADOWS.lg,
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 20,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  summaryText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: FONT.bold,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: FONT.bold,
    marginRight: 8,
  },
});
