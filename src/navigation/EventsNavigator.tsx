import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventsScreen } from '../screens/main/EventsScreen';
import { EventDetailScreen } from '../screens/main/EventDetailScreen';

export type EventsStackParamList = {
  Events: undefined;
  EventDetail: { eventId: string };
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

export function EventsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}
