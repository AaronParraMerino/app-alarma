import React from 'react';
import { View } from 'react-native';
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
import { ColorFindConfigScreen } from '../ColorFind/screens/ColorFindConfigScreen';
import ColorFindMissionScreen from '../ColorFind/screens/ColorFindMissionScreen';
import { ColorFindProvider } from '../ColorFind/store/colorFindStore';
import { ObjectRecognitionConfigScreen } from '../ObjectRecognition/screens/ObjectRecognitionConfigScreen';
import ObjectRecognitionMissionScreen from '../ObjectRecognition/screens/ObjectRecognitionMissionScreen';
import { ParesMissionConfigScreen } from '../ParesMission/screens/ParesMissionConfigScreen';
import ParesMissionRouteScreen from '../ParesMission/screens/ParesMissionRouteScreen';
import { PairsMissionProvider } from '../ParesMission/store/paresMissionStore';
import { TriviaConfigScreen } from '../Trivia/screens/TriviaConfigScreen';
import TriviaMissionScreen from '../Trivia/screens/TriviaMissionScreen';
import { TriviaProvider } from '../Trivia/store/triviaStore';
import { TriviaCategory, TriviaTimeLimits } from '../Trivia/types/trivia.types';
import { PracticeExitButton } from '../../../shared/components/missions/PracticeExitButton';
import { useTranslation } from '../../../shared/i18n/useTranslation';

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
    practice?: boolean;
  };

  WordCompletionMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
    practice?: boolean;
  };

  ConfigParesMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId?: string;
    practice?: boolean;
  };

  ParesMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
    practice?: boolean;
  };

  ConfigMathMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
    alarmConfigSessionId?: string;
    practice?: boolean;
  };

  MathMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
    practice?: boolean;
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
    practice?: boolean;
  } | undefined;

  MovementMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
    practice?: boolean;
  };

  ConfigColoredFiguresMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId?: string;
    practice?: boolean;
  };

  ColoredFiguresMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
    practice?: boolean;
  };

  ConfigColorFindMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId?: string;
    practice?: boolean;
  };

  ColorFindMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    quantity: number;
    alarmLabel?: string;
    practice?: boolean;
  };

  ConfigObjectRecognitionMission: {
    alarmConfigSessionId?: string;
    practice?: boolean;
  } | undefined;

  ObjectRecognitionMissionScreen: {
    difficulty?: 'easy' | 'medium' | 'hard';
    targetObjectIds?: string[];
    alarmLabel?: string;
    practice?: boolean;
  } | undefined;

  ConfigTriviaMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    categoryIds?: TriviaCategory[];
    timeLimits?: TriviaTimeLimits;
    targetScore?: number;
    alarmConfigSessionId?: string;
    practice?: boolean;
  } | undefined;

  TriviaMissionScreen: {
    difficulty: 'easy' | 'medium' | 'hard';
    categoryIds?: TriviaCategory[];
    timeLimits?: TriviaTimeLimits;
    targetScore?: number;
    alarmLabel?: string;
    practice?: boolean;
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

function ConfigMovementMissionRoute({ navigation, route }: ConfigMovementMissionProps) {
  const { setUserConfig } = useMovementMissionStore();
  const { language } = useTranslation();
  const practice = route.params?.practice;

  return (
    <MovementMissionConfigScreen
      initialDifficulty={route.params?.difficulty}
      initialQuantity={route.params?.quantity}
      onBack={() => navigation.goBack()}
      confirmLabel={practice ? (language === 'es' ? 'Probar' : 'Try') : undefined}
      onConfirm={(config) => {
        setUserConfig(config);

        if (practice) {
          navigation.navigate('MovementMissionScreen', {
            difficulty: config.difficulty,
            quantity: config.quantity,
            practice: true,
          });
          return;
        }

        // Solo vuelve al selector. NO ejecuta la misión.
        navigation.navigate('MissionSelector');
      }}
    />
  );
}

function MovementMissionRoute({ navigation, route }: MovementMissionProps) {
  return (
    <View style={{ flex: 1 }}>
      <MovementMissionScreen
        userConfig={{
          difficulty: route.params.difficulty,
          quantity: route.params.quantity,
        }}
        alarmLabel={route.params.alarmLabel}
        onSuccess={() => {
          if (route.params.practice) {
            navigation.goBack();
            return;
          }

          navigation.navigate('MissionSelector');
        }}
      />
      {route.params.practice ? (
        <PracticeExitButton onPress={() => navigation.goBack()} />
      ) : null}
    </View>
  );
}

export default function MissionsNavigator() {
  return (
    <WordCompletionProvider>
      <MathExercisesProvider>
        <MovementMissionProvider>
          <ColoredFiguresProvider>
            <ColorFindProvider>
             <PairsMissionProvider>
              <TriviaProvider>
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
                  name="ConfigParesMission"
                  component={ParesMissionConfigScreen}
                />

                <Stack.Screen
                  name="ParesMissionScreen"
                  component={ParesMissionRouteScreen}
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
                    name="ConfigColorFindMission"
                    component={ColorFindConfigScreen}
                  />

                  <Stack.Screen
                    name="ColorFindMissionScreen"
                    component={ColorFindMissionScreen}
                  />

                  <Stack.Screen
                    name="ConfigObjectRecognitionMission"
                    component={ObjectRecognitionConfigScreen}
                  />

                  <Stack.Screen
                    name="ObjectRecognitionMissionScreen"
                    component={ObjectRecognitionMissionScreen}
                  />

                  <Stack.Screen
                    name="ConfigTriviaMission"
                    component={TriviaConfigScreen}
                  />

                  <Stack.Screen
                    name="TriviaMissionScreen"
                    component={TriviaMissionScreen}
                  />
                </Stack.Navigator>
              </TriviaProvider>
              </PairsMissionProvider>
            </ColorFindProvider>
          </ColoredFiguresProvider>
        </MovementMissionProvider>
      </MathExercisesProvider>
    </WordCompletionProvider>
  );
}
