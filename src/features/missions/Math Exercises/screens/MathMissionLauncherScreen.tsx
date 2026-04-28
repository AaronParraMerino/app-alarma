import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { useMathExercisesStore } from '../store/mathExercisesStore';

type Props = NativeStackScreenProps<MissionsStackParamList, 'MathMissionLauncher'>;

export default function MathMissionLauncherScreen({ navigation }: Props) {
  const { config } = useMathExercisesStore();

  React.useEffect(() => {
    navigation.replace('MathMissionScreen', {
      difficulty: config.difficulty,
      quantity: config.quantity,
      alarmLabel: 'Misión Matemáticas',
    });
  }, []);

  return null;
}