import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { getAlarmsLocal } from '../../../shared/services/storage/localDB.service';
import { MathExercisesMission } from '../../missions/Math Exercises/components/MathExercisesMission';
import { OperationType } from '../../missions/Math Exercises/types/mathExercises.types';
import { WordCompletionMission } from '../../missions/wordCompletion/components/WordCompletionMission';
import { MovementMissionScreen } from '../../missions/MovementMission/screens/MovementMissionScreen';
import {
  dismissRingingAlarmByAlarmId,
  isNativeAndroidAlarmAvailable,
} from '../services/alarmScheduler';
import { getAlarmSoundAsset } from '../services/alarmSoundAssets';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import { AlarmMission, Difficulty, MissionType } from '../types/alarm.types';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmRinging'>;

const RANDOM_MISSION_TYPES: MissionType[] = [
  'math',
  'wordCompletion',
];

function resolveRandomMission(config: AlarmMission): AlarmMission {
  const index = Math.floor(Math.random() * RANDOM_MISSION_TYPES.length);
  return {
    type: RANDOM_MISSION_TYPES[index],
    difficulty: config.difficulty,
    quantity: config.quantity ?? 3,
    operationType: config.operationType ?? 'addition',
  };
}

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
  const alarmId = route.params.alarmId;
  const alarm = useMemo(
    () => alarms.find(a => a.id === alarmId) ?? getAlarmsLocal().find(a => a.id === alarmId),
    [alarms, alarmId],
  );
  const alarmSoundAsset = getAlarmSoundAsset(alarm?.soundUri ?? null);
  const shouldUseJsAudio = !isNativeAndroidAlarmAvailable();
  const player = useAudioPlayer(alarmSoundAsset, {
    keepAudioSessionActive: true,
  });
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);

  const missionSequence = useMemo<AlarmMission[]>(() => {
    if (!alarm) {
      return [];
    }

    if (alarm.randomMissions) {
      const randomConfigs = alarm.missions.length > 0
        ? alarm.missions
        : [{ type: 'math', difficulty: 'normal', quantity: 3 } as AlarmMission];

      return randomConfigs.map(resolveRandomMission);
    }

    if (alarm.missions.length === 0) {
      return [];
    }

    return alarm.missions.map(mission => {
      if (mission.type === 'random') {
        return resolveRandomMission(mission);
      }

      if (mission.type === 'physical') {
        return mission;
      }

      if (!RANDOM_MISSION_TYPES.includes(mission.type)) {
        return {
          type: 'math',
          difficulty: mission.difficulty,
          quantity: mission.quantity,
          operationType: mission.operationType,
        };
      }

      return mission;
    });
  }, [alarm]);

  const activeMission = missionSequence[currentMissionIndex] ?? null;

  useEffect(() => {
    setCurrentMissionIndex(0);
  }, [alarm?.id]);

  useEffect(() => {
    if (!alarm || !alarmSoundAsset || !shouldUseJsAudio) return;

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
  }, [alarm, alarmSoundAsset, player, shouldUseJsAudio]);

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

    await dismissRingingAlarmByAlarmId(alarm.id);
    player.pause();
    await player.seekTo(0);

    if (alarm.repeatDays.length === 0) {
      updateAlarm(alarm.id, { enabled: false });
    }

    navigation.goBack();
  }, [alarm, navigation, player, updateAlarm]);

  const completeMission = React.useCallback(() => {
    const nextMissionIndex = currentMissionIndex + 1;
    if (nextMissionIndex < missionSequence.length) {
      setCurrentMissionIndex(nextMissionIndex);
      return;
    }

    void stopAlarm();
  }, [currentMissionIndex, missionSequence.length, stopAlarm]);

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

  if (!activeMission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topSection}>
          <Text style={styles.badge}>ALARMA</Text>
          <Text style={styles.time}>{formatTime(alarm.hour, alarm.minute)}</Text>
          {alarm.label ? <Text style={styles.label}>{alarm.label}</Text> : null}
        </View>
        <View style={styles.normalAlarmSection}>
          <Text style={styles.title}>Alarma activa</Text>
          <Text style={styles.subtitle}>No hay misiones configuradas.</Text>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => void stopAlarm()}
            activeOpacity={0.88}
          >
            <Text style={styles.stopButtonText}>Detener alarma</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (activeMission.type === 'wordCompletion') {
    return (
      <WordCompletionMission
        key={`word-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 3}
        onComplete={completeMission}
        alarmLabel={alarm.label || formatTime(alarm.hour, alarm.minute)}
      />
    );
  }

  if (activeMission.type === 'physical') {
    return (
      <MovementMissionScreen
        key={`movement-${currentMissionIndex}`}
        userConfig={{
          difficulty: toMissionDifficulty(activeMission.difficulty),
          quantity: activeMission.quantity ?? 3,
        }}
        onSuccess={completeMission}
        alarmLabel={alarm.label || formatTime(alarm.hour, alarm.minute)}
      />
    );
  }

  return (
    <MathExercisesMission
      key={`math-${currentMissionIndex}`}
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
    backgroundColor: Colors.bg,
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
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 20,
  },
  missionSection: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  normalAlarmSection: {
    flex: 5,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingWide,
    paddingVertical: 24,
    gap: 10,
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
  stopButton: {
    marginTop: 18,
    minWidth: 210,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  stopButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
