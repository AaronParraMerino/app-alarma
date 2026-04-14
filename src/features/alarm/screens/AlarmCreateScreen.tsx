import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../../shared/theme/colors';
import AlarmForm from '../components/AlarmForm';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmCreate'>;

export default function AlarmCreateScreen({ navigation }: Props) {
  const { addAlarm } = useAlarmStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AlarmForm
        title="Nueva alarma"
        submitLabel="Guardar alarma"
        onBack={() => navigation.goBack()}
        onSubmit={data => {
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
    backgroundColor: Colors.bg,
  },
});
