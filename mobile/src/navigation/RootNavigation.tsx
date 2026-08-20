import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { Feather } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import CustomDrawer from './CustomDrawer';
import AddOrderScreen from '../screens/AddOrderScreen';
import CartScreen from '../screens/CartScreen';
import KOTScreen from '../screens/KOTScreen';
import MoreScreen from '../screens/MoreScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import BillingScreen from '../screens/BillingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#121212', borderTopColor: '#333', height: 60, paddingBottom: 8, paddingTop: 8 },
        tabBarActiveTintColor: '#5856d6', // Match the blue/purple from screenshot
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          
          if (route.name === 'Tables') iconName = 'grid';
          else if (route.name === 'KOT') iconName = 'file-text';
          else if (route.name === 'More') iconName = 'more-horizontal';

          return <Feather name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tables" component={HomeScreen} />
      <Tab.Screen name="KOT" component={KOTScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#1a1a1a' },
      }}
    >
      <Drawer.Screen name="Home" component={MainTabs} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export default function RootNavigation() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null; 
  }

  const MyTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0a0a0a',
    },
  };

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              animationTypeForReplace: !token ? 'pop' : 'push',
            }}
          />
        ) : (
          <>
            <Stack.Screen name="MainDrawer" component={MainDrawer} />
            <Stack.Screen name="AddOrder" component={AddOrderScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
