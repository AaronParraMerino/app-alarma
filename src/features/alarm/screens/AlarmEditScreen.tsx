// src/features/alarm/screens/AlarmEditScreen.tsx
import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '../../../shared/components/ui/BackButton';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import AlarmForm from '../components/AlarmForm';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmEdit'>;

export default function AlarmEditScreen({ navigation, route }: Props) {
  const { colors, statusBarStyle } = useAppTheme();

  const { alarms, updateAlarm, deleteAlarm } = useAlarmStore();
  const alarm = alarms.find((item) => item.id === route.params.alarmId);

  if (!alarm) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Alarma no encontrada
          </Text>

          <BackButton onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <AlarmForm
        title="Editar alarma"
        submitLabel="Guardar cambios"
        draftKey={`alarm-edit-${alarm.id}`}
        initialData={alarm}
        onBack={() => navigation.goBack()}
        onSubmit={(data) => {
          updateAlarm(alarm.id, data);
          navigation.goBack();
        }}
        onDelete={() => {
          deleteAlarm(alarm.id);
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

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
