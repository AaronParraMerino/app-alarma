import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { Colors } from '../../../shared/theme/colors';
import AlarmForm from '../components/AlarmForm';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmEdit'>;

export default function AlarmEditScreen({ navigation, route }: Props) {
  const { alarms, updateAlarm, deleteAlarm } = useAlarmStore();
  const alarm = alarms.find(item => item.id === route.params.alarmId);

  if (!alarm) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Alarma no encontrada</Text>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AlarmForm
        title="Editar alarma"
        submitLabel="Guardar cambios"
        draftKey={`alarm-edit-${alarm.id}`}
        initialData={alarm}
        onBack={() => navigation.goBack()}
        onSubmit={data => {
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
    backgroundColor: Colors.bg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
