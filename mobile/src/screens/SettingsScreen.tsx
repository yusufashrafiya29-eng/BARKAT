import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState({
    homeDelivery: false,
    takeAway: false,
    askCustomerDetails: true,
    voiceSearch: false,
    sortMenu: 'A-Z',
    statusColors: true,
    theme: 'System',
    assignWaiter: false,
    foodReadyAlerts: true,
    requireAuthKOT: false,
    blockScreenshots: false,
  });

  // Fetch initial settings from SecureStore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await SecureStore.getItemAsync('app_settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (e) {
        console.warn('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await SecureStore.setItemAsync('app_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  };

  const renderToggle = (key: string, title: string, desc: string, icon: string, disabled: boolean = false, comingSoon: boolean = false) => (
    <View style={styles.settingItem} key={key}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title} {comingSoon ? <Text style={styles.comingSoon}>(Coming soon)</Text> : null}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <Switch 
        value={(settings as any)[key]} 
        onValueChange={(val) => updateSetting(key, val)}
        disabled={disabled}
        trackColor={{ false: '#333', true: '#3b82f6' }}
        thumbColor={(settings as any)[key] ? '#fff' : '#888'}
      />
    </View>
  );

  const renderChevron = (title: string, desc: string, icon: string, value: string, onPress: () => void) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} key={title}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <Text style={styles.settingValue}>{value}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search settings..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Order Taking</Text>
        {renderToggle('homeDelivery', 'Home Delivery', 'Enable home delivery option in KOT', '🛵')}
        {renderToggle('takeAway', 'Take Away', 'Enable take away option in KOT', '🛍️')}
        {renderToggle('askCustomerDetails', 'Customer Details', 'Ask for customer details first before KOT', '👤')}
        {renderToggle('voiceSearch', 'Voice Search', 'Search menu items using voice commands', '🎤', true, true)}

        <Text style={styles.sectionHeader}>Display & Appearance</Text>
        {renderChevron('Sort Menu Items', 'Choose how items are sorted', '🔤', settings.sortMenu, () => {
          updateSetting('sortMenu', settings.sortMenu === 'A-Z' ? 'Item Rank' : 'A-Z');
        })}
        {renderToggle('statusColors', 'Order Status Colors', 'Show green/amber logic on tables', '🎨')}
        {renderChevron('Theme', 'Light, Dark, or System default', '🌗', settings.theme, () => {
          updateSetting('theme', settings.theme === 'System' ? 'Dark' : 'System');
        })}

        <Text style={styles.sectionHeader}>KOT & Kitchen</Text>
        {renderToggle('assignWaiter', 'Assign Waiter to KOT', 'Force waiter assignment for each order', '👨‍🍳')}
        {renderToggle('foodReadyAlerts', 'Food Ready Alerts', 'Get notified when food is ready', '🔔')}

        <Text style={styles.sectionHeader}>Security & Privacy</Text>
        {renderToggle('requireAuthKOT', 'Require Auth for KOT', 'Ask for PIN before punching order', '🔒')}
        {renderToggle('blockScreenshots', 'Block Screenshots', 'Prevent taking screenshots in app', '🚫')}

        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.settingItem}>
          <Text style={styles.icon}>ℹ️</Text>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>App Version</Text>
            <Text style={styles.settingDesc}>MyRestro Captain v1.0.0</Text>
          </View>
        </View>
        
        <View style={{height: 40}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  menuIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    fontSize: 18,
    color: '#888',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  icon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  comingSoon: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'normal',
  },
  chevronContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    color: '#888',
    fontSize: 14,
    marginRight: 8,
  },
  chevron: {
    color: '#888',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
