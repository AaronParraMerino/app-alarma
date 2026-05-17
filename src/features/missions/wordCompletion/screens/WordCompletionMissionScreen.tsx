import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { WordCompletionMission } from '../components/WordCompletionMission';

type Props = NativeStackScreenProps<MissionsStackParamList, 'WordCompletionMissionScreen'>;

export default function WordCompletionMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <WordCompletionMission
      difficulty={difficulty}
      quantity={quantity}
      onComplete={() => navigation.goBack()}
      alarmLabel={alarmLabel}
    />
  );
}

