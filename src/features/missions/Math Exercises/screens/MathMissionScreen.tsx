// src/features/missions/Math Exercises/screens/MathMissionScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { MathExercisesMission } from '../components/MathExercisesMission';
import { PracticeExitButton } from '../../../../shared/components/missions/PracticeExitButton';

type Props = NativeStackScreenProps<MissionsStackParamList, 'MathMissionScreen'>;

export default function MathMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel, operationType } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <MathExercisesMission
        difficulty={difficulty}
        quantity={quantity}
        operationType={operationType}
        alarmLabel={alarmLabel}
        onComplete={() => navigation.goBack()}
      />
      {route.params.practice ? (
        <PracticeExitButton onPress={() => navigation.goBack()} />
      ) : null}
    </View>
  );
}

