import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapScreen } from '../screens/main/MapScreen';
import { BuildingDetailScreen } from '../screens/main/BuildingDetailScreen';

export type NavigateStackParamList = {
  Map: { startRouteToBuildingId?: string } | undefined;
  BuildingDetail: { buildingId: string };
};

const Stack = createNativeStackNavigator<NavigateStackParamList>();

export function NavigateNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="BuildingDetail" component={BuildingDetailScreen} />
    </Stack.Navigator>
  );
}
