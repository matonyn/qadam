import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';
import { DiscountsScreen } from '../screens/main/DiscountsScreen';
import { StudyRoomsScreen } from '../screens/main/StudyRoomsScreen';
import { ReviewsScreen } from '../screens/main/ReviewsScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  Notifications: undefined;
  Discounts: undefined;
  StudyRooms: undefined;
  Reviews: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Discounts" component={DiscountsScreen} />
      <Stack.Screen name="StudyRooms" component={StudyRoomsScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
    </Stack.Navigator>
  );
}
