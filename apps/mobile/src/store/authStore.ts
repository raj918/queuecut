import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { MobileNotificationService } from '../services/notifications';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user: User, accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem('@queuecut_access_token', accessToken);
    await AsyncStorage.setItem('@queuecut_refresh_token', refreshToken);
    await AsyncStorage.setItem('@queuecut_user', JSON.stringify(user));

    set({
      user,
      role: user.role,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });

    // Register FCM push notifications
    MobileNotificationService.registerDeviceWithBackend().catch(console.warn);
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore network errors on logout
    }

    await AsyncStorage.multiRemove([
      '@queuecut_access_token',
      '@queuecut_refresh_token',
      '@queuecut_user',
    ]);

    set({
      user: null,
      role: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadSession: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem('@queuecut_access_token'),
        AsyncStorage.getItem('@queuecut_user'),
      ]);

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({
          user,
          role: user.role,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });

        // Refresh user profile in background
        api
          .get('/auth/me')
          .then((res: any) => {
            if (res?.data) {
              set({ user: res.data, role: res.data.role });
              AsyncStorage.setItem('@queuecut_user', JSON.stringify(res.data));
            }
          })
          .catch(() => {});
        return;
      }
    } catch (e) {
      // Storage read error
    }

    set({ isLoading: false, isAuthenticated: false });
  },
}));
