import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventsCalendarScreen } from '../screens/main/EventsCalendarScreen';
import { EventsScreen } from '../screens/main/EventsScreen';
import { EventDetailScreen } from '../screens/main/EventDetailScreen';

export type EventsStackParamList = {
  Calendar: undefined;
  EventsList: undefined;
  EventDetail: { eventId: string; openRegister?: boolean };
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

export function EventsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Calendar" component={EventsCalendarScreen} />
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}
