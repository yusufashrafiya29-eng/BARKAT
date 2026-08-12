import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, FONT, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';
import Header from '../components/layout/Header';
import { LogOut, User, Key, HelpCircle } from 'lucide-react-native';

export default function ProfileScreen() {
  const { userName, userRole, restaurantName, logout } = useAuthStore();

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'MR';
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userName || '')}</Text>
          </View>
          
          <Text style={styles.name}>{userName || 'Staff Member'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userRole}</Text>
          </View>
          <Text style={styles.restaurant}>{restaurantName}</Text>
        </View>

        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem}>
            <User color={COLORS.textSecondary} size={20} />
            <Text style={styles.menuText}>Personal Details</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.menuItem}>
            <Key color={COLORS.textSecondary} size={20} />
            <Text style={styles.menuText}>Change Password</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.menuItem}>
            <HelpCircle color={COLORS.textSecondary} size={20} />
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut color={COLORS.danger} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout Securely</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.primaryDark,
  },
  name: {
    fontSize: 24,
    fontWeight: FONT.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  roleText: {
    color: COLORS.card,
    fontSize: 12,
    fontWeight: FONT.bold,
  },
  restaurant: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  menuGroup: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 8,
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: FONT.medium,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.danger + '1A', // transparent red
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger + '33',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: FONT.bold,
  },
});
