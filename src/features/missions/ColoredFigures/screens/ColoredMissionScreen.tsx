import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ColoredFiguresMission } from '../components/ColoredFigureMission';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ColoredFigureMissionScreen'
>;

export default function ColoredMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <ColoredFiguresMission
      difficulty={difficulty}
      quantity={quantity}
      alarmLabel={alarmLabel}
      onComplete={() => navigation.goBack()}
    />
  );
}