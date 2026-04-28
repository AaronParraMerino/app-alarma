import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MissionSelectorScreen from '../screens/MissionSelectorScreen';
import WordCompletionMissionScreen from '../wordCompletion/screens/WordCompletionMissionScreen';
import { WordCompletionConfigScreen } from '../wordCompletion/screens/WordCompletionConfigScreen';
import { WordCompletionProvider } from '../wordCompletion/store/wordCompletionStore';
import MathMissionScreen from '../Math Exercises/screens/MathMissionScreen';
import { MathMissionConfigScreen } from '../Math Exercises/screens/MathMissionConfigScreen';
import { MathExercisesProvider } from '../Math Exercises/store/mathExercisesStore';
import MathMissionLauncherScreen from '../Math Exercises/screens/MathMissionLauncherScreen';

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
  ConfigMathMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
  };
  MathMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
  };
  MathMissionLauncher: undefined;  // ← nuevo
};

const Stack = createNativeStackNavigator<MissionsStackParamList>();

export default function MissionsNavigator() {
  return (
    <WordCompletionProvider>
      <MathExercisesProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MissionSelector" component={MissionSelectorScreen} />
          <Stack.Screen name="ConfigWordCompletionMission" component={WordCompletionConfigScreen} />
          <Stack.Screen name="WordCompletionMissionScreen" component={WordCompletionMissionScreen} />
          <Stack.Screen name="ConfigMathMission" component={MathMissionConfigScreen} />
          <Stack.Screen name="MathMissionScreen" component={MathMissionScreen} />
          <Stack.Screen name="MathMissionLauncher" component={MathMissionLauncherScreen} />
        </Stack.Navigator>
      </MathExercisesProvider>
    </WordCompletionProvider>
  );
}
