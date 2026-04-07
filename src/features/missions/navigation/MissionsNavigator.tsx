import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

export type MissionsStackParamList = {
  MissionSelector: undefined;
  ColorMission: { missionId: string };
  MathMission: { missionId: string };
  MemoryMission: { missionId: string };
  PhotoMission: { missionId: string };
  WritingMission: { missionId: string };
};

const Stack = createNativeStackNavigator<MissionsStackParamList>();

// Pantalla temporal hasta que estén listas las reales
function PlaceholderScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Missions - En construcción</Text>
    </View>
  );
}

export default function MissionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MissionSelector" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}