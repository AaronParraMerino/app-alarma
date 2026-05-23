// src/features/alarm/screens/AlarmRingingScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Layout } from '../../../shared/theme/layout';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { getAlarmsLocal } from '../../../shared/services/storage/localDB.service';

import { MathExercisesMission } from '../../missions/Math Exercises/components/MathExercisesMission';
import { OperationType } from '../../missions/Math Exercises/types/mathExercises.types';
import { WordCompletionMission } from '../../missions/wordCompletion/components/WordCompletionMission';
import { MovementMissionScreen } from '../../missions/MovementMission/screens/MovementMissionScreen';
import { ColoredFiguresMission } from '../../missions/ColoredFigures/components/ColoredFigureMission';
import { ColorFindMission } from '../../missions/ColorFind/components/ColorFindMission';
import { ObjectRecognitionMissionContent } from '../../missions/ObjectRecognition/screens/ObjectRecognitionMissionScreen';

import {
  closeNativeAlarmScreen,
  dismissRingingAlarmByAlarmId,
  isNativeAndroidAlarmAvailable,
  shouldOpenRingingAlarmId,
} from '../services/alarmScheduler';
import { getAlarmSoundAsset } from '../services/alarmSoundAssets';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import { AlarmMission, Difficulty, MissionType } from '../types/alarm.types';
import { shouldDisableAfterAlarmResolution } from '../utils/repeatSchedule';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmRinging'>;

const RANDOM_MISSION_TYPES: MissionType[] = [
  'math',
  'wordCompletion',
  'color',
  'colorFind',
  'photo',
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
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
}

function toMissionDifficulty(difficulty: Difficulty): 'easy' | 'medium' | 'hard' {
  return difficulty === 'normal' ? 'medium' : difficulty;
}

export default function AlarmRingingScreen({ route, navigation }: Props) {
  const { colors, statusBarStyle } = useAppTheme();

  const { alarms, updateAlarm } = useAlarmStore();

  const alarmId = route.params.alarmId;

  const alarm = useMemo(
    () =>
      alarms.find((a) => a.id === alarmId) ??
      getAlarmsLocal().find((a) => a.id === alarmId),
    [alarms, alarmId],
  );

  const shouldUseJsAudio = !isNativeAndroidAlarmAvailable();

  const alarmSoundAsset = shouldUseJsAudio
    ? getAlarmSoundAsset(alarm?.soundUri ?? null)
    : null;

  const player = useAudioPlayer(alarmSoundAsset, {
    keepAudioSessionActive: shouldUseJsAudio,
  });

  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const [canRenderAlarm, setCanRenderAlarm] = useState(false);
  const [isStoppingAlarm, setIsStoppingAlarm] = useState(false);

  const stoppingAlarmRef = React.useRef(false);
  const mountedRef = React.useRef(true);

  const missionSequence = useMemo<AlarmMission[]>(() => {
    if (!alarm) {
      return [];
    }

    if (alarm.randomMissions) {
      const randomConfigs =
        alarm.missions.length > 0
          ? alarm.missions
          : [{ type: 'math', difficulty: 'normal', quantity: 3 } as AlarmMission];

      return randomConfigs.map(resolveRandomMission);
    }

    if (alarm.missions.length === 0) {
      return [];
    }

    return alarm.missions.map((mission) => {
      if (mission.type === 'random') {
        return resolveRandomMission(mission);
      }

      if (
        mission.type === 'physical' ||
        mission.type === 'color' ||
        mission.type === 'colorFind' ||
        mission.type === 'photo'
      ) {
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
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCurrentMissionIndex(0);
    setCanRenderAlarm(false);
    setIsStoppingAlarm(false);
    stoppingAlarmRef.current = false;
  }, [alarm?.id, alarmId]);

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
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );

      return () => subscription.remove();
    }, []),
  );

  const resetToHome = React.useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);

  const validateAlarmStillActive = React.useCallback(async () => {
    if (!mountedRef.current) return false;

    setCanRenderAlarm(false);

    const shouldOpen = await shouldOpenRingingAlarmId(alarmId);

    if (!mountedRef.current) return false;

    if (!shouldOpen) {
      setCanRenderAlarm(false);
      resetToHome();
      void closeNativeAlarmScreen();
      return false;
    }

    setCanRenderAlarm(true);
    return true;
  }, [alarmId, resetToHome]);

  useFocusEffect(
    React.useCallback(() => {
      void validateAlarmStillActive();

      return undefined;
    }, [validateAlarmStillActive]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void validateAlarmStillActive();
        return;
      }

      setCanRenderAlarm(false);
    });

    return () => subscription.remove();
  }, [validateAlarmStillActive]);

  const stopAlarm = React.useCallback(async () => {
    if (stoppingAlarmRef.current) return;

    stoppingAlarmRef.current = true;
    setIsStoppingAlarm(true);
    setCanRenderAlarm(false);

    const targetAlarmId = alarm?.id ?? alarmId;

    await dismissRingingAlarmByAlarmId(targetAlarmId);

    if (!alarm) {
      await closeNativeAlarmScreen();
      resetToHome();
      return;
    }

    if (shouldUseJsAudio) {
      player.pause();
      await player.seekTo(0);
    }

    const shouldRemainEnabled = !shouldDisableAfterAlarmResolution(alarm);

    if (alarm.enabled !== shouldRemainEnabled) {
      updateAlarm(alarm.id, { enabled: shouldRemainEnabled });
    }

    await closeNativeAlarmScreen();
    resetToHome();
  }, [alarm, alarmId, player, resetToHome, shouldUseJsAudio, updateAlarm]);

  const completeMission = React.useCallback(() => {
    const nextMissionIndex = currentMissionIndex + 1;

    if (nextMissionIndex < missionSequence.length) {
      setCurrentMissionIndex(nextMissionIndex);
      return;
    }

    void stopAlarm();
  }, [currentMissionIndex, missionSequence.length, stopAlarm]);

  if (isStoppingAlarm || !canRenderAlarm) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />
      </SafeAreaView>
    );
  }

  if (!alarm) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

        <View style={styles.centered}>
          <Text style={[styles.title, { color: colors.text }]}>
            Alarma no encontrada
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Vuelve e intenta de nuevo.
          </Text>

          <TouchableOpacity
            style={[
              styles.stopButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDeep,
              },
            ]}
            onPress={() => void stopAlarm()}
            activeOpacity={0.88}
          >
            <Text style={[styles.stopButtonText, { color: colors.white }]}>
              Cerrar alarma
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeMission) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

        <View
          style={[
            styles.topSection,
            {
              backgroundColor: colors.bgCard,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.badge, { color: colors.warning }]}>ALARMA</Text>

          <Text style={[styles.time, { color: colors.text }]}>
            {formatTime(alarm.hour, alarm.minute)}
          </Text>

          {alarm.label ? (
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {alarm.label}
            </Text>
          ) : null}
        </View>

        <View style={styles.normalAlarmSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Alarma activa
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            No hay misiones configuradas.
          </Text>

          <TouchableOpacity
            style={[
              styles.stopButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDeep,
              },
            ]}
            onPress={() => void stopAlarm()}
            activeOpacity={0.88}
          >
            <Text style={[styles.stopButtonText, { color: colors.white }]}>
              Detener alarma
            </Text>
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

  if (activeMission.type === 'color') {
    return (
      <ColoredFiguresMission
        key={`color-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 3}
        onComplete={completeMission}
        alarmLabel={alarm.label || formatTime(alarm.hour, alarm.minute)}
      />
    );
  }

  if (activeMission.type === 'colorFind') {
    return (
      <ColorFindMission
        key={`color-find-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 5}
        onComplete={completeMission}
        alarmLabel={alarm.label || formatTime(alarm.hour, alarm.minute)}
      />
    );
  }

  if (activeMission.type === 'photo') {
    return (
      <ObjectRecognitionMissionContent
        key={`object-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        targetObjectIds={activeMission.targetObjectIds}
        onComplete={completeMission}
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },

  time: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 54,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 14,
  },

  label: {
    fontSize: 14,
    marginTop: 4,
  },

  stopButton: {
    marginTop: 18,
    minWidth: 210,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  stopButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});