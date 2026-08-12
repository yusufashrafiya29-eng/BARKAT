import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, RADIUS, FONT } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  
  const handleConfirm = () => {
    Haptics.impactAsync(isDestructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.selectionAsync();
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmBtn, isDestructive && styles.destructiveBtn]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 18,
    fontWeight: FONT.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontWeight: FONT.semibold,
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  destructiveBtn: {
    backgroundColor: COLORS.danger,
  },
  confirmBtnText: {
    fontWeight: FONT.bold,
    color: COLORS.card,
  },
});
