/**
 * API Service Layer — real HTTP calls to the Qadam backend.
 *
 * Set EXPO_PUBLIC_API_URL in a root `.env` (no secrets here), then restart Expo:
 *   EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000
 * (omit /api/v1 — it is appended automatically)
 *
 * Physical phone checklist:
 *   - Phone + computer on same Wi‑Fi
 *   - Use the computer's LAN IP (not localhost / 127.0.0.1)
 *   - Run: uvicorn app.main:app --host 0.0.0.0 --port 8000
 *
 * Refs: iOS Simulator / web → http://localhost:8000
 *       Android Emulator → http://10.0.2.2:8000
 *
 * Supabase (see root `.env.example`):
 *   EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */

import { Platform } from 'react-native';

import type {
  ApiResponse,
  EventRegistrationInfo,
  EventRegistrationStatus,
  RegisteredCampusEvent,
} from '../types';
import { tokenManager } from './tokenManager';

/** When EXPO_PUBLIC_API_URL is unset: simulators/emulators can reach the host; real devices cannot — set .env. */
function defaultDevApiOrigin(): string {
  if (Platform.OS === 'android') {
    // Android emulator → host machine (not localhost inside the VM)
    return 'http://10.0.2.2:8000';
  }
  // iOS Simulator, web, and dev clients that tunnel host (often localhost works for iOS sim)
  return 'http://localhost:8000';
}

function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  const origin = raw
    ? raw.replace(/\/+$/, '')
    : `${defaultDevApiOrigin().replace(/\/+$/, '')}`;
  return origin;
}

export const API_BASE_URL = resolveApiBaseUrl();

if (__DEV__) {
  console.log('[api] API_BASE_URL =', API_BASE_URL);
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = tokenManager.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const hint =
      Platform.OS !== 'web' && !process.env.EXPO_PUBLIC_API_URL?.trim()
        ? ' On a physical phone, create root `.env` with EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000 (find IP: Mac `ipconfig getifaddr en0`), same Wi‑Fi, `npx expo start -c`.'
        : '';
    throw new Error(
      `Network error (${reason}). Base URL: ${API_BASE_URL}.${hint} Run backend: uvicorn app.main:app --host 0.0.0.0 --port 8000. See README (Network error).`,
    );
  }

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    const refreshed = await _tryRefresh();
    if (refreshed) return request<T>(endpoint, options, false);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`);
  return body as T;
}

async function _tryRefresh(): Promise<boolean> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const body = await res.json();
    const newAccess: string = body?.data?.accessToken;
    if (newAccess) {
      tokenManager.setTokens(newAccess, refreshToken);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    studentId: string;
  }) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    request<any>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  getProfile: () => request<any>('/auth/profile'),

  updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) =>
    request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ── Maps ─────────────────────────────────────────────────────────────────────

export const mapsApi = {
  getBuildings: () => request<any>('/maps/buildings'),

  getBuilding: (id: string) => request<any>(`/maps/buildings/${id}`),

  getRoomsByBuilding: (buildingId: string) =>
    request<any>(`/maps/buildings/${buildingId}/rooms`),

  search: (q: string) =>
    request<any>(`/maps/search?q=${encodeURIComponent(q)}`),

  getNearby: (lat: number, lng: number, radius = 500) =>
    request<any>(`/maps/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};

// ── Routing ──────────────────────────────────────────────────────────────────

export const routingApi = {
  calculateRoute: (data: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    preference: 'shortest' | 'accessible' | 'least_crowded';
    startBuildingId?: string;
    endBuildingId?: string;
  }) =>
    request<any>('/routing/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSavedRoutes: () => request<any>('/routing/saved'),

  saveRoute: (routeId: string) =>
    request<any>('/routing/saved', {
      method: 'POST',
      body: JSON.stringify({ routeId }),
    }),

  reroute: (routeId: string, currentLat: number, currentLng: number) =>
    request<any>('/routing/reroute', {
      method: 'POST',
      body: JSON.stringify({ routeId, currentLat, currentLng }),
    }),
};

// ── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  getEvents: (params?: { category?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v != null) as [string, string][],
      ),
    ).toString();
    return request<any>(`/events${q ? '?' + q : ''}`);
  },

  getEvent: (id: string) => request<any>(`/events/${id}`),

  getMyEventRegistration: (eventId: string) =>
    request<ApiResponse<EventRegistrationStatus>>(`/events/${eventId}/registration`),

  registerForEvent: (eventId: string) =>
    request<ApiResponse<EventRegistrationInfo>>(`/events/${eventId}/register`, { method: 'POST' }),

  unregisterFromEvent: (eventId: string) =>
    request<ApiResponse<null>>(`/events/${eventId}/register`, { method: 'DELETE' }),

  getRegisteredEvents: (params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v != null) as [string, string][],
      ),
    ).toString();
    return request<ApiResponse<RegisteredCampusEvent[]>>(`/events/registered${q ? '?' + q : ''}`);
  },
};

// ── Discounts ────────────────────────────────────────────────────────────────

export const discountsApi = {
  getDiscounts: (params?: { category?: string }) => {
    const q = params?.category ? `?category=${params.category}` : '';
    return request<any>(`/discounts${q}`);
  },

  getDiscount: (id: string) => request<any>(`/discounts/${id}`),

  verifyEligibility: (discountId: string, studentId: string) =>
    request<any>(`/discounts/${discountId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
};

// ── Reviews ──────────────────────────────────────────────────────────────────

export const reviewsApi = {
  getReviews: (params?: { targetId?: string; targetType?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v != null) as [string, string][],
      ),
    ).toString();
    return request<any>(`/reviews${q ? '?' + q : ''}`);
  },

  createReview: (data: {
    targetId: string;
    targetType: string;
    targetName: string;
    rating: number;
    comment?: string;
  }) =>
    request<any>('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  markHelpful: (reviewId: string) =>
    request<any>(`/reviews/${reviewId}/helpful`, { method: 'POST' }),

  reportReview: (reviewId: string, reason: string) =>
    request<any>(`/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ── Academic ─────────────────────────────────────────────────────────────────

export const academicApi = {
  getCourses: (params?: { semester?: string }) => {
    const q = params?.semester ? `?semester=${encodeURIComponent(params.semester)}` : '';
    return request<any>(`/academic/courses${q}`);
  },

  getAcademicPlan: () => request<any>('/academic/plan'),

  getSchedule: (date?: string) =>
    request<any>(`/academic/schedule${date ? `?date=${date}` : ''}`),
};

// ── Planner ──────────────────────────────────────────────────────────────────

export const plannerApi = {
  getEvents: (params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v != null) as [string, string][],
      ),
    ).toString();
    return request<any>(`/planner/events${q ? '?' + q : ''}`);
  },

  createEvent: (data: Record<string, unknown>) =>
    request<any>('/planner/events', { method: 'POST', body: JSON.stringify(data) }),

  updateEvent: (id: string, data: Record<string, unknown>) =>
    request<any>(`/planner/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteEvent: (id: string) =>
    request<any>(`/planner/events/${id}`, { method: 'DELETE' }),
};

// ── Study Rooms ──────────────────────────────────────────────────────────────

export const studyRoomsApi = {
  getStudyRooms: (params?: { buildingId?: string; available?: boolean }) => {
    const parts: string[] = [];
    if (params?.buildingId) parts.push(`buildingId=${params.buildingId}`);
    if (params?.available != null) parts.push(`available=${params.available}`);
    return request<any>(`/study-rooms${parts.length ? '?' + parts.join('&') : ''}`);
  },

  getRoomAvailability: (roomId: string, date: string) =>
    request<any>(`/study-rooms/${roomId}/availability?date=${date}`),

  bookRoom: (roomId: string, data: { date: string; startTime: string; endTime: string }) =>
    request<any>(`/study-rooms/${roomId}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelBooking: (bookingId: string) =>
    request<any>(`/study-rooms/bookings/${bookingId}`, { method: 'DELETE' }),

  getUserBookings: () => request<any>('/study-rooms/bookings'),
};

// ── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  getSettings: () => request<any>('/settings'),

  updateSettings: (data: Record<string, unknown>) =>
    request<any>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  getNotifications: () => request<any>('/notifications'),

  markAllRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),

  markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// ── Barrel export ─────────────────────────────────────────────────────────────

export const api = {
  auth: authApi,
  maps: mapsApi,
  routing: routingApi,
  events: eventsApi,
  discounts: discountsApi,
  reviews: reviewsApi,
  academic: academicApi,
  planner: plannerApi,
  studyRooms: studyRoomsApi,
  settings: settingsApi,
  notifications: notificationsApi,
};

export default api;
