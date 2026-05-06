import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../../shared/theme/colors';
import { MathExercisesMission } from '../../missions/Math Exercises/components/MathExercisesMission';
import { OperationType } from '../../missions/Math Exercises/types/mathExercises.types';
import { WordCompletionMission } from '../../missions/wordCompletion/components/WordCompletionMission';
import { cancelAlarmNotificationsByAlarmId } from '../services/alarmScheduler';
import { getAlarmSoundAsset } from '../services/alarmSoundAssets';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import { AlarmMission, Difficulty, MissionType } from '../types/alarm.types';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmRinging'>;

const RANDOM_MISSION_TYPES: MissionType[] = [
  'math',
  'wordCompletion',
];

function formatTime(hour: number, minute: number): string {
  const hh = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${hh.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function toMissionDifficulty(difficulty: Difficulty): 'easy' | 'medium' | 'hard' {
  return difficulty === 'normal' ? 'medium' : difficulty;
}

export default function AlarmRingingScreen({ route, navigation }: Props) {
  const { alarms, updateAlarm } = useAlarmStore();
  const alarm = alarms.find(a => a.id === route.params.alarmId);
  const alarmSoundAsset = getAlarmSoundAsset(alarm?.soundUri ?? null);
  const player = useAudioPlayer(alarmSoundAsset, {
    keepAudioSessionActive: true,
  });
  const [completed, setCompleted] = useState(false);

  const activeMission = useMemo<AlarmMission>(() => {
    if (!alarm) {
      return { type: 'math', difficulty: 'normal' };
    }

    if (alarm.randomMissions || alarm.missions.length === 0) {
      const index = Math.floor(Math.random() * RANDOM_MISSION_TYPES.length);
      return {
        type: RANDOM_MISSION_TYPES[index],
        difficulty: 'normal',
        quantity: 3,
        operationType: 'addition',
      };
    }

    const mission = alarm.missions[0];
    if (!RANDOM_MISSION_TYPES.includes(mission.type)) {
      return {
        type: 'math',
        difficulty: mission.difficulty,
        quantity: mission.quantity,
        operationType: mission.operationType,
      };
    }

    return mission;
  }, [alarm]);

  useEffect(() => {
    if (!alarm || !alarmSoundAsset) return;

    let mounted = true;

    const startSound = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });

        if (!mounted) return;

        player.loop = true;
        player.volume = 1;
        player.play();
      } catch (error) {
        console.log('[AlarmRinging] No se pudo reproducir el sonido:', error);
      }
    };

    void startSound();

    return () => {
      mounted = false;
      try {
        player.pause();
        void player.seekTo(0);
      } catch (error) {
        console.log('[AlarmRinging] No se pudo detener el sonido:', error);
      }
    };
  }, [alarm, alarmSoundAsset, player]);

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, []),
  );

  const stopAlarm = React.useCallback(async () => {
    if (!alarm) {
      navigation.goBack();
      return;
    }

    await cancelAlarmNotificationsByAlarmId(alarm.id);
    player.pause();
    await player.seekTo(0);

    if (alarm.repeatDays.length === 0) {
      updateAlarm(alarm.id, { enabled: false });
    }

    navigation.goBack();
  }, [alarm, navigation, player, updateAlarm]);

  const completeMission = React.useCallback(() => {
    if (completed) return;
    setCompleted(true);
    void stopAlarm();
  }, [completed, stopAlarm]);

  if (!alarm) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.title}>Alarma no encontrada</Text>
          <Text style={styles.subtitle}>Vuelve e intenta de nuevo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (activeMission.type === 'wordCompletion') {
    return (
      <WordCompletionMission
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 3}
        onComplete={completeMission}
        alarmLabel={alarm.label || formatTime(alarm.hour, alarm.minute)}
      />
    );
  }

  return (
    <MathExercisesMission
      difficulty={toMissionDifficulty(activeMission.difficulty)}
      quantity={activeMission.quantity ?? 3}
      operationType={(activeMission.operationType ?? 'addition') as OperationType}
      onComplete={completeMission}
      alarmLabel={alarm.label || formatTime(alarm.hour, alarm.minute)}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#06080E',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  topSection: {
    flex: 1,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#0A0F1A',
    paddingHorizontal: 20,
  },
  missionSection: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  badge: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  time: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 54,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
