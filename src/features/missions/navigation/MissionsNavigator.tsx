import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import MissionSelectorScreen from '../screens/MissionSelectorScreen';

import WordCompletionMissionScreen from '../wordCompletion/screens/WordCompletionMissionScreen';
import { WordCompletionConfigScreen } from '../wordCompletion/screens/WordCompletionConfigScreen';
import { WordCompletionProvider } from '../wordCompletion/store/wordCompletionStore';

import MathMissionScreen from '../Math Exercises/screens/MathMissionScreen';
import { MathMissionConfigScreen } from '../Math Exercises/screens/MathMissionConfigScreen';
import { MathExercisesProvider } from '../Math Exercises/store/mathExercisesStore';

import { MovementMissionConfigScreen } from '../MovementMission/screens/MovementMissionConfigScreen';
import { MovementMissionScreen } from '../MovementMission/screens/MovementMissionScreen';
import {
  MovementMissionProvider,
  useMovementMissionStore,
} from '../MovementMission/store/movementMissionStore';

import { ColoredMissionConfigScreen } from '../ColoredFigures/screens/ColoredMissionConfigScreen';
import ColoredMissionScreen from '../ColoredFigures/screens/ColoredMissionScreen';
import { ColoredFiguresProvider } from '../ColoredFigures/store/ColoredFiguresStore';
import { ObjectRecognitionConfigScreen } from '../ObjectRecognition/screens/ObjectRecognitionConfigScreen';
import ObjectRecognitionMissionScreen from '../ObjectRecognition/screens/ObjectRecognitionMissionScreen';
import { ObjectRecognitionProvider } from '../ObjectRecognition/store/objectRecognitionStore';

export type MissionsStackParamList = {
  MissionSelector: undefined;

  ColorMission: {
    missionId: string;
  };

  MathMission: {
    missionId: string;
  };

  MemoryMission: {
    missionId: string;
  };

  PhotoMission: {
    missionId: string;
  };

  WritingMission: {
    missionId: string;
  };

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

  ConfigMovementMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
  } | undefined;

  MovementMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
  };

  ConfigColoredFiguresMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId?: string;
  };

  ColoredFiguresMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
  };

  ConfigObjectRecognitionMission: undefined;

  ObjectRecognitionMissionScreen: {
    targetObjectId?: string;
    alarmLabel?: string;
  } | undefined;
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

function ConfigMovementMissionRoute({ navigation, route }: ConfigMovementMissionProps) {
  const { setUserConfig } = useMovementMissionStore();

  return (
    <MovementMissionConfigScreen
      initialDifficulty={route.params?.difficulty}
      initialQuantity={route.params?.quantity}
      onBack={() => navigation.goBack()}
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
        <MovementMissionProvider>
          <ColoredFiguresProvider>
            <ObjectRecognitionProvider>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="MissionSelector"
                  component={MissionSelectorScreen}
                />

                <Stack.Screen
                  name="ConfigWordCompletionMission"
                  component={WordCompletionConfigScreen}
                />

                <Stack.Screen
                  name="WordCompletionMissionScreen"
                  component={WordCompletionMissionScreen}
                />

                <Stack.Screen
                  name="ConfigMathMission"
                  component={MathMissionConfigScreen}
                />

                <Stack.Screen
                  name="MathMissionScreen"
                  component={MathMissionScreen}
                />

                <Stack.Screen
                  name="ConfigMovementMission"
                  component={ConfigMovementMissionRoute}
                />

                <Stack.Screen
                  name="MovementMissionScreen"
                  component={MovementMissionRoute}
                />

                <Stack.Screen
                  name="ConfigColoredFiguresMission"
                  component={ColoredMissionConfigScreen}
                />

                <Stack.Screen
                  name="ColoredFiguresMissionScreen"
                  component={ColoredMissionScreen}
                />

                <Stack.Screen
                  name="ConfigObjectRecognitionMission"
                  component={ObjectRecognitionConfigScreen}
                />

                <Stack.Screen
                  name="ObjectRecognitionMissionScreen"
                  component={ObjectRecognitionMissionScreen}
                />
              </Stack.Navigator>
            </ObjectRecognitionProvider>
          </ColoredFiguresProvider>
        </MovementMissionProvider>
      </MathExercisesProvider>
    </WordCompletionProvider>
  );
}
