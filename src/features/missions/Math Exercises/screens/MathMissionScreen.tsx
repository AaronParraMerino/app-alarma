import React from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { MathExercisesMission } from '../components/MathExercisesMission';

type Props = NativeStackScreenProps<MissionsStackParamList, 'MathMissionScreen'>;

export default function MathMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <MathExercisesMission
      difficulty={difficulty}
      quantity={quantity}
      onComplete={() => navigation.goBack()}
      alarmLabel={alarmLabel}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
});
