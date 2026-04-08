import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColors, FONT_SIZE } from '../constants/theme';
import { HomeNavigator } from './HomeNavigator';
import { NavigateNavigator } from './NavigateNavigator';
import { EventsNavigator } from './EventsNavigator';
import { AcademicScreen } from '../screens/main/AcademicScreen';
import { ProfileNavigator } from './ProfileNavigator';
import { useTranslation } from '../i18n';

export type MainTabParamList = {
  Home: undefined;
  Navigate: undefined;
  Events: undefined;
  Academic: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, [string, string]> = {
  Home: ['home', 'home-outline'],
  Navigate: ['navigate', 'navigate-outline'],
  Events: ['calendar', 'calendar-outline'],
  Academic: ['school', 'school-outline'],
  Profile: ['person', 'person-outline'],
};

export function MainNavigator() {
  const t = useTranslation();
  const COLORS = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? ['circle', 'circle-outline'];
          return (
            <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} options={{ title: t.tabs.home }} />
      <Tab.Screen name="Navigate" component={NavigateNavigator} options={{ title: t.tabs.navigate }} />
      <Tab.Screen name="Events" component={EventsNavigator} options={{ title: t.tabs.events }} />
      <Tab.Screen name="Academic" component={AcademicScreen} options={{ title: t.tabs.academic }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{ title: t.tabs.profile }} />
    </Tab.Navigator>
  );
}
