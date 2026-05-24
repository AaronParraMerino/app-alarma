import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ParesMissionScreen } from './ParesMissionScreen';
import { PracticeExitButton } from '../../../../shared/components/missions/PracticeExitButton';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ParesMissionScreen'>;

export default function ParesMissionRouteScreen({ navigation, route }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <ParesMissionScreen
        difficulty={route.params.difficulty}
        quantity={route.params.quantity}
        alarmLabel={route.params.alarmLabel}
        onComplete={() => navigation.goBack()}
      />
      {route.params.practice ? (
        <PracticeExitButton onPress={() => navigation.goBack()} />
      ) : null}
    </View>
  );
}
