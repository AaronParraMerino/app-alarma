// src/features/alarm/screens/AlarmCreateScreen.tsx
import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppTheme } from '../../../shared/theme/useAppTheme';
import AlarmForm from '../components/AlarmForm';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmCreate'>;

export default function AlarmCreateScreen({ navigation }: Props) {
  const { colors, statusBarStyle } = useAppTheme();
  const { addAlarm } = useAlarmStore();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <AlarmForm
        title="Nueva alarma"
        submitLabel="Guardar alarma"
        draftKey="alarm-create"
        onBack={() => navigation.goBack()}
        onSubmit={(data) => {
          addAlarm(data);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
