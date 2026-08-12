import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantLogo: string | null;
  userRole: string | null;
  userName: string | null;
  login: (token: string, restaurantId: string, restaurantName: string, role: string, name: string, logo?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      restaurantId: null,
      restaurantName: null,
      restaurantLogo: null,
      userRole: null,
      userName: null,

      login: (token, restaurantId, restaurantName, role, name, logo) =>
        set({
          token,
          restaurantId,
          restaurantName,
          userRole: role,
          userName: name,
          restaurantLogo: logo || null,
        }),

      logout: () =>
        set({
          token: null,
          restaurantId: null,
          restaurantName: null,
          userRole: null,
          userName: null,
          restaurantLogo: null,
        }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => AsyncStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
