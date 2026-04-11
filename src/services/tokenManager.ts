import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'qadam_access_token';
const REFRESH_KEY = 'qadam_refresh_token';

let _access: string | null = null;
let _refresh: string | null = null;

export const tokenManager = {
  getAccessToken: () => _access,
  getRefreshToken: () => _refresh,

  setTokens: (access: string, refresh: string) => {
    _access = access;
    _refresh = refresh;
    SecureStore.setItemAsync(ACCESS_KEY, access).catch(() => {});
    SecureStore.setItemAsync(REFRESH_KEY, refresh).catch(() => {});
  },

  clearTokens: () => {
    _access = null;
    _refresh = null;
    SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {});
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
  },

  /** Call once on app start to restore tokens from secure storage. */
  loadTokens: async () => {
    _access = await SecureStore.getItemAsync(ACCESS_KEY);
    _refresh = await SecureStore.getItemAsync(REFRESH_KEY);
  },
};
