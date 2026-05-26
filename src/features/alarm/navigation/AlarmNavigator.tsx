// src/features/alarm/navigation/AlarmNavigator.tsx
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AlarmCreateScreen from '../screens/AlarmCreateScreen';
import AlarmEditScreen from '../screens/AlarmEditScreen';
import AlarmRingingScreen from '../screens/AlarmRingingScreen';
import { Colors } from '../../../shared/theme/colors';
import { MathMissionConfigScreen } from '../../missions/Math Exercises/screens/MathMissionConfigScreen';
import { WordCompletionConfigScreen } from '../../missions/wordCompletion/screens/WordCompletionConfigScreen';
import { MovementMissionConfigScreen } from '../../missions/MovementMission/screens/MovementMissionConfigScreen';
import { ColoredMissionConfigScreen } from '../../missions/ColoredFigures/screens/ColoredMissionConfigScreen';
import { ColorFindConfigScreen } from '../../missions/ColorFind/screens/ColorFindConfigScreen';
import { ObjectRecognitionConfigScreen } from '../../missions/ObjectRecognition/screens/ObjectRecognitionConfigScreen';
import { TriviaConfigScreen } from '../../missions/Trivia/screens/TriviaConfigScreen';
import { TriviaCategory, TriviaTimeLimits } from '../../missions/Trivia/types/trivia.types';
import { completeAlarmMissionConfigSession } from '../services/alarmMissionConfigSession';

export type AlarmStackParamList = {
  Home: undefined;
  AlarmCreate: undefined;
  AlarmEdit: { alarmId: string };
  AlarmRinging: { alarmId: string };
  AlarmConfigMathMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
    alarmConfigSessionId: string;
  };
  AlarmConfigWordCompletionMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId: string;
  };
  AlarmConfigMovementMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId: string;
  };
  AlarmConfigColoredFiguresMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId: string;
  };
  AlarmConfigColorFindMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    alarmConfigSessionId: string;
  };
  AlarmConfigObjectRecognitionMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    quantity?: number;
    targetObjectIds?: string[];
    alarmConfigSessionId: string;
  };
  AlarmConfigTriviaMission: {
    difficulty?: 'easy' | 'medium' | 'hard';
    categoryIds?: TriviaCategory[];
    timeLimits?: TriviaTimeLimits;
    targetScore?: number;
    alarmConfigSessionId: string;
  };
};

const Stack = createNativeStackNavigator<AlarmStackParamList>();

type AlarmConfigMovementMissionProps = NativeStackScreenProps<
  AlarmStackParamList,
  'AlarmConfigMovementMission'
>;

function toAlarmDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

function AlarmConfigMovementMissionScreen({
  navigation,
  route,
}: AlarmConfigMovementMissionProps) {
  return (
    <MovementMissionConfigScreen
      initialDifficulty={route.params?.difficulty}
      initialQuantity={route.params?.quantity}
      onBack={() => navigation.goBack()}
      onConfirm={(config) => {
        completeAlarmMissionConfigSession(route.params.alarmConfigSessionId, {
          type: 'physical',
          difficulty: toAlarmDifficulty(config.difficulty),
          quantity: config.quantity,
        });

        navigation.goBack();
      }}
    />
  );
}

export default function AlarmNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AlarmCreate" component={AlarmCreateScreen} />
      <Stack.Screen name="AlarmEdit" component={AlarmEditScreen} />
      <Stack.Screen name="AlarmConfigMathMission" component={MathMissionConfigScreen as any} />
      <Stack.Screen
        name="AlarmConfigWordCompletionMission"
        component={WordCompletionConfigScreen as any}
      />
      <Stack.Screen
        name="AlarmConfigMovementMission"
        component={AlarmConfigMovementMissionScreen}
      />
      <Stack.Screen
        name="AlarmConfigColoredFiguresMission"
        component={ColoredMissionConfigScreen as any}
      />
      <Stack.Screen
        name="AlarmConfigColorFindMission"
        component={ColorFindConfigScreen as any}
      />
      <Stack.Screen
        name="AlarmConfigObjectRecognitionMission"
        component={ObjectRecognitionConfigScreen as any}
      />
      <Stack.Screen
        name="AlarmConfigTriviaMission"
        component={TriviaConfigScreen as any}
      />
      <Stack.Screen
        name="AlarmRinging"
        component={AlarmRingingScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
