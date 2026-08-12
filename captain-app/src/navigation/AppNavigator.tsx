import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';

import TablesScreen from '../screens/TablesScreen';
import TableMenuScreen from '../screens/TableMenuScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import KOTScreen from '../screens/KOTScreen';
import MoreScreen from '../screens/MoreScreen';
import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const PRIMARY = '#6366f1';

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 0,
          backgroundColor: '#ffffff',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Tables') return <MaterialCommunityIcons name="table-chair" size={size} color={color} />;
          if (route.name === 'Orders') return <Feather name="clock" size={size} color={color} />;
          if (route.name === 'KOT') return <MaterialCommunityIcons name="receipt" size={size} color={color} />;
          if (route.name === 'More') return <Feather name="more-horizontal" size={size} color={color} />;
          return <Feather name="circle" size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Tables" component={TablesScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="KOT" component={KOTScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function MainAppDrawer() {
  const { restaurantName, logout } = useContext(AuthContext);

  const CustomDrawerContent = (props: any) => {
    return (
      <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
            {restaurantName || 'Captain App'}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Waiter Panel</Text>
        </View>
        <View style={{ flex: 1 }}>
          <DrawerItemList {...props} />
        </View>
        <DrawerItem
          label="Log Out"
          onPress={() => logout()}
          labelStyle={{ color: '#ef4444', fontWeight: 'bold' }}
          icon={() => <Feather name="log-out" size={18} color="#ef4444" />}
        />
      </DrawerContentScrollView>
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName="HomeTabs"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: PRIMARY,
        drawerActiveBackgroundColor: '#fff1f2',
        drawerLabelStyle: { fontWeight: '600' },
      }}
    >
      <Drawer.Screen
        name="HomeTabs"
        component={BottomTabs}
        options={{
          title: restaurantName || 'Captain Panel',
          headerTintColor: PRIMARY,
          drawerLabel: 'Tables',
          drawerIcon: ({ color }) => <MaterialCommunityIcons name="table-chair" size={20} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={MainAppDrawer} />
      <Stack.Screen name="TableMenu" component={TableMenuScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


