import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MissionSelectorScreen from '../screens/MissionSelectorScreen';
import WordCompletionMissionScreen from '../wordCompletion/screens/WordCompletionMissionScreen';
import { WordCompletionConfigScreen } from '../wordCompletion/screens/WordCompletionConfigScreen';
import { WordCompletionProvider } from '../wordCompletion/store/wordCompletionStore';
import MathMissionScreen from '../Math Exercises/screens/MathMissionScreen';
import { MathMissionConfigScreen } from '../Math Exercises/screens/MathMissionConfigScreen';
import { MathExercisesProvider } from '../Math Exercises/store/mathExercisesStore';

export type MissionsStackParamList = {
  MissionSelector: undefined;
  ColorMission: { missionId: string };
  MathMission: { missionId: string };
  MemoryMission: { missionId: string };
  PhotoMission: { missionId: string };
  WritingMission: { missionId: string };
  ConfigWordCompletionMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId?: string;
  };
  WordCompletionMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
  };
  ConfigMathMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
    alarmConfigSessionId?: string;
  };
  MathMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
  };
  MathMissionLauncher: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
    alarmLabel?: string;
  };
};

const Stack = createNativeStackNavigator<MissionsStackParamList>();
type ConfigMovementMissionProps = NativeStackScreenProps<
  MissionsStackParamList,
  'ConfigMovementMission'
>;

type MovementMissionProps = NativeStackScreenProps<
  MissionsStackParamList,
  'MovementMissionScreen'
>;

function ConfigMovementMissionRoute({ navigation }: ConfigMovementMissionProps) {
  const { setUserConfig } = useMovementMissionStore();

  return (
    <MovementMissionConfigScreen
      onConfirm={(config) => {
        setUserConfig(config);

        // Solo vuelve al selector. NO ejecuta la misión.
        navigation.navigate('MissionSelector');
      }}
    />
  );
}

function MovementMissionRoute({ navigation, route }: MovementMissionProps) {
  return (
    <MovementMissionScreen
      userConfig={{
        difficulty: route.params.difficulty,
        quantity: route.params.quantity,
      }}
      alarmLabel={route.params.alarmLabel}
      onSuccess={() => {
        navigation.navigate('MissionSelector');
      }}
    />
  );
}
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
        </Stack.Navigator>
      </MathExercisesProvider>
    </WordCompletionProvider>
  );
}
