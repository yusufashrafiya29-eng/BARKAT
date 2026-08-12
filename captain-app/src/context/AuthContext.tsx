import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('Captain Panel');

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const storedName = await AsyncStorage.getItem('restaurantName');
      setUserToken(token);
      if (storedName) {
        setRestaurantName(storedName);
      }
    } catch (e) {
      console.log('Failed to fetch token');
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const token = response.data?.data?.access_token || response.data?.access_token;
      const restName = response.data?.data?.restaurant_name || 'Captain Panel';
      
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('restaurantName', restName);
        setUserToken(token);
        setRestaurantName(restName);
        return true;
      }
      return false;
    } catch (e) {
      console.log('Login error:', e);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('restaurantName');
    setUserToken(null);
    setRestaurantName('Captain Panel');
  };

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, restaurantName }}>
      {children}
    </AuthContext.Provider>
  );
};


