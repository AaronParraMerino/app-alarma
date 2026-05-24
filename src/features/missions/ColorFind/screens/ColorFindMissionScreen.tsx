import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ColorFindMission } from '../components/ColorFindMission';
import { PracticeExitButton } from '../../../../shared/components/missions/PracticeExitButton';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ColorFindMissionScreen'
>;

export default function ColorFindMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <ColorFindMission
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
