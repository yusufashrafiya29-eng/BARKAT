import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  message: string;
  subMessage?: string;
}

export default function EmptyState({ icon = '🍽️', message, subMessage }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60, // Push down slightly from center
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
    opacity: 0.8,
  },
  message: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subMessage: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  }
});
