import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface PulsingDotProps {
  color: string;
  size?: number;
  style?: ViewStyle;
}

export default function PulsingDot({ color, size = 8, style }: PulsingDotProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
        },
        style,
      ]}
    />
  );
}
