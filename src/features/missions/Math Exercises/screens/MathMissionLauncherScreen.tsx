import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';

type Props = NativeStackScreenProps<MissionsStackParamList, 'MathMissionLauncher'>;

export default function MathMissionLauncherScreen({ navigation, route }: Props) {
  React.useEffect(() => {
    const { difficulty, quantity, operationType, alarmLabel } = route.params;
    navigation.replace('MathMissionScreen', {
      difficulty,
      quantity,
      operationType,
      alarmLabel,
    });
  }, [navigation, route.params]);

  return null;
}