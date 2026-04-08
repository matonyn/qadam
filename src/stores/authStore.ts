import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { mockUser, mockUserSettings } from "../data/mockData";
import { User, UserSettings } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  settings: UserSettings;
  _hasHydrated: boolean;

  // Actions
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
}

const secureStorage = createJSONStorage(() => ({
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      settings: mockUserSettings,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (email && password) {
          set({
            user: { ...mockUser, email },
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      register: async (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        studentId: string,
      ) => {
        set({ isLoading: true });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (email && password && firstName && lastName && studentId) {
          const newUser: User = {
            id: `user-${Date.now()}`,
            email,
            firstName,
            lastName,
            studentId,
            createdAt: new Date().toISOString(),
          };

          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          settings: mockUserSettings,
        });
      },

      updateProfile: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      updateSettings: (updates: Partial<UserSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
    }),
    {
      name: "qadam-auth",
      storage: secureStorage,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
