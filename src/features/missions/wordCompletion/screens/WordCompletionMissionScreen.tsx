import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { WordCompletionMission } from '../components/WordCompletionMission';
import { PracticeExitButton } from '../../../../shared/components/missions/PracticeExitButton';

type Props = NativeStackScreenProps<MissionsStackParamList, 'WordCompletionMissionScreen'>;


/* Ejecuta una misión de completar palabras*/
export default function WordCompletionMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <WordCompletionMission
        difficulty={difficulty}
        quantity={quantity}
        onComplete={() => navigation.goBack()}
        alarmLabel={alarmLabel}
      />
      {route.params.practice ? (
        <PracticeExitButton onPress={() => navigation.goBack()} />
      ) : null}
    </View>
  );
}

