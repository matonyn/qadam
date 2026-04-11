import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authApi, settingsApi } from '../services/api';
import { tokenManager } from '../services/tokenManager';
import { User, UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  notifications: { events: true, discounts: true, classReminders: true, campusAlerts: true },
  accessibility: { preferAccessibleRoutes: false, highContrast: false, largeText: false },
  privacy: { shareLocation: true, anonymousMode: false },
  language: 'en',
  theme: 'light',
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  settings: UserSettings;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    studentId: string,
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  syncSettings: () => Promise<void>;
}

const secureStorage = createJSONStorage(() => ({
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      settings: DEFAULT_SETTINGS,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          const { accessToken, refreshToken, user } = res.data;

          tokenManager.setTokens(accessToken, refreshToken);

          const mappedUser: User = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            studentId: user.studentId,
            avatar: user.avatar ?? undefined,
            createdAt: user.createdAt,
          };

          set({ user: mappedUser, isAuthenticated: true, isLoading: false });

          // Load settings from backend in background
          get().syncSettings();
          return true;
        } catch (e) {
          set({ isLoading: false });
          return false;
        }
      },

      register: async (email, password, firstName, lastName, studentId) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register({ email, password, firstName, lastName, studentId });
          const { accessToken, refreshToken, user } = res.data;

          tokenManager.setTokens(accessToken, refreshToken);

          const mappedUser: User = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            studentId: user.studentId,
            avatar: user.avatar ?? undefined,
            createdAt: user.createdAt,
          };

          set({ user: mappedUser, isAuthenticated: true, isLoading: false });

          get().syncSettings();
          return true;
        } catch (e) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          authApi.logout(refreshToken).catch(() => {});
        }
        tokenManager.clearTokens();
        set({ user: null, isAuthenticated: false, settings: DEFAULT_SETTINGS });
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
        // Persist to backend
        authApi.updateProfile(updates as any).catch(() => {});
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
        // Persist to backend
        settingsApi.updateSettings(updates as any).catch(() => {});
      },

      syncSettings: async () => {
        try {
          const res = await settingsApi.getSettings();
          if (res?.data) {
            set({ settings: res.data });
          }
        } catch {
          // fall back to defaults already in state
        }
      },
    }),
    {
      name: 'qadam-auth',
      storage: secureStorage,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Restore tokens from secure storage on app start
        tokenManager.loadTokens();
      },
    },
  ),
);
