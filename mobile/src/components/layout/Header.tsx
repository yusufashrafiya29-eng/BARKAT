import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, FONT } from '../../constants/theme';
import { ArrowLeft, Bell, Search } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: 'search' | 'notification' | 'none';
  onRightPress?: () => void;
  badgeCount?: number;
}

export default function Header({ 
  title, 
  subtitle, 
  showBack = false, 
  onBack, 
  rightAction = 'none', 
  onRightPress,
  badgeCount = 0
}: HeaderProps) {
  
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      {rightAction !== 'none' && (
        <TouchableOpacity style={styles.iconBtn} onPress={onRightPress}>
          {rightAction === 'search' ? (
            <Search color={COLORS.text} size={24} />
          ) : (
            <View>
              <Bell color={COLORS.text} size={24} />
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  titleContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: FONT.bold,
  },
});
