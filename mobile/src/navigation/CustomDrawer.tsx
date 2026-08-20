import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';

// We will use standard emojis as icons for now, since we don't have vector-icons installed yet
const Icons = {
  Person: '👤',
  Store: '🏪',
  NewKot: '📝',
  FailedKot: '⚠️',
  Sync: '🔄',
  Menu: '📋',
  Settings: '⚙️',
  Logout: '🚪',
};

export default function CustomDrawer(props: any) {
  const { logout, role, restaurantId } = useAuth();
  // Using a mock name since we don't have the user's name in AuthContext yet
  // You could update AuthContext later to store the user's name
  const waiterName = 'Waiter / Captain'; 

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      {/* Header Block */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>M R</Text>
          </View>
          <View>
            <Text style={styles.wordmark}>MyRestro</Text>
            <Text style={styles.subtitle}>CAPTAIN</Text>
          </View>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.versionText}>V 1.0.0</Text>
          <View style={styles.userRow}>
            <Text style={styles.iconText}>{Icons.Person}</Text>
            <Text style={styles.userName}>{waiterName}</Text>
          </View>
        </View>
        
        <View style={styles.restaurantRow}>
          <Text style={styles.iconText}>{Icons.Store}</Text>
          <Text style={styles.restaurantName}>Restaurant {restaurantId || 'Demo'}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView {...props} style={styles.drawerScroll}>
        <DrawerItem
          label="New KOT"
          labelStyle={styles.drawerLabel}
          icon={() => <Text>{Icons.NewKot}</Text>}
          onPress={() => props.navigation.navigate('Home', { screen: 'Tables' })}
        />
        <DrawerItem
          label="Unsuccessful KOT"
          labelStyle={styles.drawerLabel}
          icon={() => <Text>{Icons.FailedKot}</Text>}
          onPress={() => {}}
        />
        <DrawerItem
          label="Sync Data"
          labelStyle={styles.drawerLabel}
          icon={() => <Text>{Icons.Sync}</Text>}
          onPress={() => {}}
        />
        <DrawerItem
          label="Update Menu"
          labelStyle={styles.drawerLabel}
          icon={() => <Text>{Icons.Menu}</Text>}
          onPress={() => {}}
        />
        <DrawerItem
          label="Settings"
          labelStyle={styles.drawerLabel}
          icon={() => <Text>{Icons.Settings}</Text>}
          onPress={() => props.navigation.navigate('Settings')}
        />
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Device Connected</Text>
          <Text style={styles.statusText}>Target: Cloud DB</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>{Icons.Logout}</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 50, // SafeArea substitute
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#262626',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  wordmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  versionText: {
    color: '#888',
    fontSize: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    marginRight: 6,
  },
  userName: {
    color: '#ccc',
    fontSize: 14,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  drawerScroll: {
    paddingTop: 10,
  },
  drawerLabel: {
    color: '#ddd',
    fontSize: 15,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  statusRow: {
    marginBottom: 16,
  },
  statusText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
