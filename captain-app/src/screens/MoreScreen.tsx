import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Alert, Platform, Linking, ScrollView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const PRIMARY = '#6366f1';

const MENU_ITEMS = [
  { icon: 'file-text', label: 'Quick Bill', sub: 'Create walk-in bill instantly', action: 'quick_bill' },
  { icon: 'list', label: 'Billing', sub: 'All orders and billing history', action: 'billing' },
  { icon: 'settings', label: 'Management', sub: 'Settings and configuration', action: 'management' },
  { icon: 'bar-chart-2', label: 'Reports', sub: 'Sales and revenue reports', action: 'reports' },
  { icon: 'moon', label: 'Day End', sub: 'End of day summary & close', action: 'day_end' },
];

export default function MoreScreen({ navigation }: any) {
  const { restaurantName, logout } = useContext(AuthContext);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout }
      ]);
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'billing':
        navigation.navigate('Orders');
        break;
      case 'quick_bill':
        // Navigate to TableMenu with no table (walk-in)
        navigation.navigate('TableMenu', { tableId: null, tableNumber: 'Walk-In', orderType: 'DINE_IN' });
        break;
      case 'management':
      case 'reports':
      case 'day_end':
        const msg = `${action === 'management' ? 'Management' : action === 'reports' ? 'Reports' : 'Day End'} feature is available on the web dashboard.`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Info', msg);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>
              {(restaurantName || 'R').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.restaurantName} numberOfLines={1}>{restaurantName || 'Restaurant'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Waiter Panel</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuRow, idx < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f8fafc' }]}
              onPress={() => handleMenuAction(item.action)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Feather name={item.icon as any} size={20} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK NAVIGATION</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: 'table-chair', label: 'Tables', tab: 'Tables' },
              { icon: 'clock-outline', label: 'Orders', tab: 'Orders' },
              { icon: 'receipt', label: 'KOT', tab: 'KOT' },
            ].map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickBtn}
                onPress={() => navigation.navigate(q.tab)}
              >
                <MaterialCommunityIcons name={q.icon as any} size={24} color={PRIMARY} />
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HELP?</Text>
          <TouchableOpacity
            style={styles.helpRow}
            onPress={() => {
              const url = 'tel:07969223344';
              Platform.OS === 'web'
                ? window.open(url)
                : Linking.openURL(url);
            }}
          >
            <Feather name="phone" size={16} color="#64748b" />
            <Text style={styles.helpText}>07969 223344</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.helpRow}
            onPress={() => {
              const url = 'mailto:support@barkat.app';
              Platform.OS === 'web'
                ? window.open(url)
                : Linking.openURL(url);
            }}
          >
            <Feather name="mail" size={16} color="#64748b" />
            <Text style={styles.helpText}>support@barkat.app</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>Biller: Waiter Panel · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 14, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  brandIcon: {
    width: 54, height: 54, borderRadius: 14, backgroundColor: PRIMARY,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  brandLetter: { fontSize: 26, fontWeight: '900', color: '#fff' },
  restaurantName: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  rolePill: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: '#fff0f0', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#fecdd3',
  },
  rolePillText: { fontSize: 11, fontWeight: '700', color: PRIMARY },
  section: {
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 14, marginBottom: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: '#94a3b8',
    letterSpacing: 1, marginBottom: 14,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
  },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#fff0f0',
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  menuSub: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    backgroundColor: '#fff0f0', borderRadius: 12, gap: 6,
    borderWidth: 1, borderColor: '#fecdd3',
  },
  quickLabel: { fontSize: 12, fontWeight: '700', color: PRIMARY },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  helpText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff1f2', borderRadius: 14, paddingVertical: 16, gap: 10,
    borderWidth: 1, borderColor: '#fecdd3',
    marginHorizontal: 14, marginBottom: 12,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  footer: {
    fontSize: 11, color: '#94a3b8', textAlign: 'center',
    paddingBottom: 8, marginTop: 4,
  },
});


