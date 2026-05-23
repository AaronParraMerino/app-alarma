import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ParesMissionScreen } from './ParesMissionScreen';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ParesMissionScreen'>;

export default function ParesMissionRouteScreen({ navigation, route }: Props) {
  return (
    <ParesMissionScreen
      difficulty={route.params.difficulty}
      quantity={route.params.quantity}
      alarmLabel={route.params.alarmLabel}
      onComplete={() => navigation.goBack()}
    />
  );
}
