import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ColorFindMission } from '../components/ColorFindMission';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ColorFindMissionScreen'
>;

export default function ColorFindMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <ColorFindMission
      difficulty={difficulty}
      quantity={quantity}
      alarmLabel={alarmLabel}
      onComplete={() => navigation.goBack()}
    />
  );
}
