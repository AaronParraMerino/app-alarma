import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ColoredFiguresMission } from '../components/ColoredFigureMission';
import { PracticeExitButton } from '../../../../shared/components/missions/PracticeExitButton';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ColoredFiguresMissionScreen'
>;

export default function ColoredMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <ColoredFiguresMission
        difficulty={difficulty}
        quantity={quantity}
        alarmLabel={alarmLabel}
        onComplete={() => navigation.goBack()}
      />
      {route.params.practice ? (
        <PracticeExitButton onPress={() => navigation.goBack()} />
      ) : null}
    </View>
  );
}
