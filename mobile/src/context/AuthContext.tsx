import React, { createContext, useState, useEffect, useContext } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  token: string | null;
  role: string | null;
  restaurantId: string | null;
  canSettleOrders: boolean;
  runnerAllowedCategories: string[];
  login: (token: string, role: string, restaurantId: string, canSettleOrders?: boolean, runnerCategories?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  restaurantId: null,
  canSettleOrders: true,
  runnerAllowedCategories: [],
  login: async () => {},
  logout: async () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [canSettleOrders, setCanSettleOrders] = useState<boolean>(true);
  const [runnerAllowedCategories, setRunnerAllowedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedRole = await SecureStore.getItemAsync('user_role');
        const storedRestaurant = await SecureStore.getItemAsync('restaurant_id');
        const storedCanSettle = await SecureStore.getItemAsync('can_settle_orders');
        const storedRunnerCategories = await SecureStore.getItemAsync('runner_allowed_categories');
        
        if (storedToken) setToken(storedToken);
        if (storedRole) setRole(storedRole);
        if (storedRestaurant) setRestaurantId(storedRestaurant);
        if (storedCanSettle) setCanSettleOrders(storedCanSettle === 'true');
        if (storedRunnerCategories) setRunnerAllowedCategories(JSON.parse(storedRunnerCategories));
      } catch (error) {
        console.error('Error loading auth state', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('force_logout', () => {
      logout();
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const login = async (newToken: string, newRole: string, newRestaurantId: string, canSettle: boolean = true, runnerCategories: string[] = []) => {
    await SecureStore.setItemAsync('auth_token', newToken);
    await SecureStore.setItemAsync('user_role', newRole);
    await SecureStore.setItemAsync('restaurant_id', newRestaurantId);
    await SecureStore.setItemAsync('can_settle_orders', String(canSettle));
    await SecureStore.setItemAsync('runner_allowed_categories', JSON.stringify(runnerCategories));
    
    setToken(newToken);
    setRole(newRole);
    setRestaurantId(newRestaurantId);
    setCanSettleOrders(canSettle);
    setRunnerAllowedCategories(runnerCategories);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_role');
    await SecureStore.deleteItemAsync('restaurant_id');
    await SecureStore.deleteItemAsync('can_settle_orders');
    await SecureStore.deleteItemAsync('runner_allowed_categories');
    
    setToken(null);
    setRole(null);
    setRestaurantId(null);
    setCanSettleOrders(true);
    setRunnerAllowedCategories([]);
  };

  return (
    <AuthContext.Provider value={{ token, role, restaurantId, canSettleOrders, runnerAllowedCategories, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
