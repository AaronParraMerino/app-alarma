// src/features/missions/Math Exercises/screens/MathMissionScreen.tsx
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { MathExercisesMission } from '../components/MathExercisesMission';

type Props = NativeStackScreenProps<MissionsStackParamList, 'MathMissionScreen'>;

export default function MathMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel, operationType } = route.params;

  return (
    <MathExercisesMission
      difficulty={difficulty}
      quantity={quantity}
      operationType={operationType}
      alarmLabel={alarmLabel}
      onComplete={() => navigation.goBack()}
    />
  );
}

