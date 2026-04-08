import { useColorScheme } from "react-native";
import { useAuthStore } from "../stores/authStore";

const BRAND = {
  primary: "#1E3A8A",
  primaryLight: "#3B82F6",
  primaryDark: "#1E40AF",
  secondary: "#10B981",
  secondaryLight: "#34D399",
  accent: "#F59E0B",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  accessibleRoute: "#8B5CF6",
  crowdLow: "#10B981",
  crowdMedium: "#F59E0B",
  crowdHigh: "#EF4444",
  textOnPrimary: "#FFFFFF",
};

export const LIGHT_COLORS = {
  ...BRAND,
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceVariant: "#F1F5F9",
  text: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
};

export const DARK_COLORS = {
  ...BRAND,
  background: "#0F172A",
  surface: "#1E293B",
  surfaceVariant: "#263548",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  border: "#334155",
  borderLight: "#263548",
};

// Static fallback (light) — used outside React components
export const COLORS = LIGHT_COLORS;

export type AppColors = typeof LIGHT_COLORS;

export function useColors(): AppColors {
  const theme = useAuthStore((s) => s.settings.theme);
  const system = useColorScheme();
  const isDark = theme === "dark" || (theme === "system" && system === "dark");
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const FONT_WEIGHT = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
