import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS, RADIUS, FONT } from '../../constants/theme';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, type, visible, onHide }: ToastProps) {
  const [show, setShow] = useState(visible);
  const translateY = new Animated.Value(-100);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShow(false);
      onHide();
    });
  };

  if (!show) return null;

  let Icon = Info;
  let color = COLORS.info;
  
  if (type === 'success') {
    Icon = CheckCircle2;
    color = COLORS.success;
  } else if (type === 'error') {
    Icon = AlertCircle;
    color = COLORS.danger;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={[styles.content, { borderLeftColor: color }]}>
        <Icon color={color} size={24} style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...SHADOWS.md,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: FONT.medium,
    flex: 1,
  },
});
