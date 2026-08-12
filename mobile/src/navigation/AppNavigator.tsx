import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, PlusCircle, FileText, User } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { COLORS, SHADOWS } from '../constants/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import TablesScreen from '../screens/TablesScreen';
import NewOrderScreen from '../screens/NewOrderScreen';
import ActiveOrdersScreen from '../screens/ActiveOrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Each tab gets its own stack so navigation within a tab works correctly
function TablesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TablesHome" component={TablesScreen} />
      <Stack.Screen name="NewOrder" component={NewOrderScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActiveOrdersHome" component={ActiveOrdersScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="TablesTab"
        component={TablesStack}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="NewOrderTab"
        component={NewOrderScreen}
        options={{
          tabBarLabel: 'New Order',
          tabBarIcon: ({ color, size }) => <PlusCircle color={COLORS.primary} size={size + 4} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const token = useAuthStore(state => state.token);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    height: 65,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingBottom: 8,
    paddingTop: 8,
    ...SHADOWS.sm,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
