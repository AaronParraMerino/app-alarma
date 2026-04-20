import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import MissionSelectorScreen from '../screens/MissionSelectorScreen';
import WordCompletionMissionScreen from '../wordCompletion/screens/WordCompletionMissionScreen';
import { WordCompletionConfigScreen } from '../wordCompletion/screens/WordCompletionConfigScreen';
import { WordCompletionProvider } from '../wordCompletion/store/wordCompletionStore';


export type MissionsStackParamList = {
  MissionSelector: undefined;
  ColorMission: { missionId: string };
  MathMission: { missionId: string };
  MemoryMission: { missionId: string };
  PhotoMission: { missionId: string };
  WritingMission: { missionId: string };
  ConfigWordCompletionMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  WordCompletionMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
  };
};

const Stack = createNativeStackNavigator<MissionsStackParamList>();

export default function MissionsNavigator() {
  return (
    <WordCompletionProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MissionSelector" component={MissionSelectorScreen} />
        <Stack.Screen name="ConfigWordCompletionMission" component={WordCompletionConfigScreen} />
        <Stack.Screen name="WordCompletionMissionScreen" component={WordCompletionMissionScreen} />
      </Stack.Navigator>
    </WordCompletionProvider>
  );
}

