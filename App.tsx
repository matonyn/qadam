import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/stores/authStore";
import { LIGHT_COLORS, DARK_COLORS } from "./src/constants/theme";

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const theme = useAuthStore((state) => state.settings.theme);
  const system = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && system === 'dark');
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator isAuthenticated={isAuthenticated} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
