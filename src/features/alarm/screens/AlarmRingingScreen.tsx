// src/features/alarm/screens/AlarmRingingScreen.tsx
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AppState,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Layout } from '../../../shared/theme/layout';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { getAlarmsLocal } from '../../../shared/services/storage/localDB.service';

import { MathExercisesMission } from '../../missions/Math Exercises/components/MathExercisesMission';
import { OperationType } from '../../missions/Math Exercises/types/mathExercises.types';
import { WordCompletionMission } from '../../missions/wordCompletion/components/WordCompletionMission';
import { MovementMissionScreen } from '../../missions/MovementMission/screens/MovementMissionScreen';
import { ColoredFiguresMission } from '../../missions/ColoredFigures/components/ColoredFigureMission';
import { ColorFindMission } from '../../missions/ColorFind/components/ColorFindMission';
import { ObjectRecognitionMissionContent } from '../../missions/ObjectRecognition/screens/ObjectRecognitionMissionScreen';
import { TriviaMission } from '../../missions/Trivia/screens/TriviaMissionScreen';
import { ParesMissionScreen } from '../../missions/ParesMission/screens/ParesMissionScreen';
import { useAuth } from '../../auth/store/authStore';
import {
  recordCompletedAlarmStreak,
  recordMissedOrFrozenAlarm,
} from '../../streak/services/streak';

import {
  closeNativeAlarmScreen,
  dismissRingingAlarmByAlarmId,
  isNativeAndroidAlarmAvailable,
  shouldOpenRingingAlarmId,
} from '../services/alarmScheduler';
import { getAlarmSoundAsset } from '../services/alarmSoundAssets';
import { getAlarmVibrationPattern } from '../services/alarmVibration';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import {
  AlarmMission,
  Difficulty,
  MissionType,
} from '../types/alarm.types';
import { shouldDisableAfterAlarmResolution } from '../utils/repeatSchedule';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmRinging'>;

const RANDOM_MISSION_TYPES: MissionType[] = [
  'math',
  'wordCompletion',
  'physical',
  'memory',
  'color',
  'colorFind',
  'photo',
  'trivia',
];

const EMERGENCY_ERROR_LIMIT = 15;

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

function toMissionDifficulty(
  difficulty: Difficulty,
): 'easy' | 'medium' | 'hard' {
  return difficulty === 'normal' ? 'medium' : difficulty;
}

function getAlarmDisplayLabel(alarm: {
  hour: number;
  minute: number;
  label?: string;
}): string {
  const time = formatTime(alarm.hour, alarm.minute);
  const label = alarm.label?.trim();

  return label ? `${time} - ${label}` : time;
}

export default function AlarmRingingScreen({
  route,
  navigation,
}: Props) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();
  const {
    language,
  } = useTranslation();
  const isSpanish = language === 'es';

  const {
    user,
    isAuthenticated,
  } = useAuth();

  const {
    alarms,
    updateAlarm,
  } = useAlarmStore();

  const alarmId = route.params.alarmId;

  const alarm = useMemo(
    () =>
      alarms.find((a) => a.id === alarmId) ??
      getAlarmsLocal().find((a) => a.id === alarmId),
    [
      alarms,
      alarmId,
    ],
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
  const [isGivingUp, setIsGivingUp] = useState(false);
  const [emergencyErrorCount, setEmergencyErrorCount] = useState(0);

  const stoppingAlarmRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const streakCompletedRecordedRef = React.useRef(false);
  const streakFailedRecordedRef = React.useRef(false);

  const missionSequence = useMemo<AlarmMission[]>(() => {
    if (!alarm) {
      return [];
    }

    if (alarm.randomMissions) {
      const randomConfigs =
        alarm.missions.length > 0
          ? alarm.missions
          : [
              {
                type: 'math',
                difficulty: 'normal',
                quantity: 3,
              } as AlarmMission,
            ];

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
        mission.type === 'memory' ||
        mission.type === 'photo' ||
        mission.type === 'trivia'
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
  const alarmDisplayLabel = alarm
    ? getAlarmDisplayLabel(alarm)
    : '';

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
    setIsGivingUp(false);
    setEmergencyErrorCount(0);
    stoppingAlarmRef.current = false;
    streakCompletedRecordedRef.current = false;
    streakFailedRecordedRef.current = false;
  }, [
    alarm?.id,
    alarmId,
  ]);

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
  }, [
    alarm,
    alarmSoundAsset,
    player,
    shouldUseJsAudio,
  ]);

  useEffect(() => {
    if (
      !alarm ||
      !shouldUseJsAudio ||
      alarm.vibrationEnabled === false
    ) {
      return;
    }

    Vibration.vibrate(
      getAlarmVibrationPattern(alarm.vibrationPattern),
      true,
    );

    return () => {
      Vibration.cancel();
    };
  }, [
    alarm,
    shouldUseJsAudio,
  ]);

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
      routes: [
        {
          name: 'Home',
        },
      ],
    });
  }, [navigation]);

  const validateAlarmStillActive = React.useCallback(async () => {
    if (!mountedRef.current) return false;

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
  }, [
    alarmId,
    resetToHome,
  ]);

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
      }
    });

    return () => subscription.remove();
  }, [validateAlarmStillActive]);

  const recordCompletedStreak = React.useCallback(async () => {
    if (streakCompletedRecordedRef.current || streakFailedRecordedRef.current) {
      return;
    }

    if (!isAuthenticated || !user?.id || !alarm) {
      return;
    }

    streakCompletedRecordedRef.current = true;

    try {
      await recordCompletedAlarmStreak({
        userId: user.id,
        alarmId: alarm.id,
        alarmTime: formatTime(alarm.hour, alarm.minute),
      });
    } catch (error) {
      streakCompletedRecordedRef.current = false;

      console.log(
        '[AlarmRinging] No se pudo registrar racha completada:',
        error,
      );
    }
  }, [
    alarm,
    isAuthenticated,
    user?.id,
  ]);

  const recordFailedStreak = React.useCallback(async () => {
    if (streakCompletedRecordedRef.current || streakFailedRecordedRef.current) {
      return;
    }

    if (!isAuthenticated || !user?.id || !alarm) {
      return;
    }

    streakFailedRecordedRef.current = true;

    try {
      await recordMissedOrFrozenAlarm({
        userId: user.id,
        alarmId: alarm.id,
        alarmTime: formatTime(alarm.hour, alarm.minute),
      });
    } catch (error) {
      streakFailedRecordedRef.current = false;

      console.log(
        '[AlarmRinging] No se pudo registrar racha incompleta:',
        error,
      );
    }
  }, [
    alarm,
    isAuthenticated,
    user?.id,
  ]);

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
      updateAlarm(alarm.id, {
        enabled: shouldRemainEnabled,
      });
    }

    await closeNativeAlarmScreen();
    resetToHome();
  }, [
    alarm,
    alarmId,
    player,
    resetToHome,
    shouldUseJsAudio,
    updateAlarm,
  ]);

  const completeMission = React.useCallback(() => {
    const nextMissionIndex = currentMissionIndex + 1;

    if (nextMissionIndex < missionSequence.length) {
      setCurrentMissionIndex(nextMissionIndex);
      return;
    }

    void (async () => {
      await recordCompletedStreak();
      await stopAlarm();
    })();
  }, [
    currentMissionIndex,
    missionSequence.length,
    recordCompletedStreak,
    stopAlarm,
  ]);

  const completeNormalAlarm = React.useCallback(() => {
    void (async () => {
      await recordCompletedStreak();
      await stopAlarm();
    })();
  }, [
    recordCompletedStreak,
    stopAlarm,
  ]);

  const registerMissionMistake = React.useCallback(() => {
    setEmergencyErrorCount((current) =>
      Math.min(
        EMERGENCY_ERROR_LIMIT,
        current + 1,
      ),
    );
  }, []);

  const giveUpAlarm = React.useCallback(() => {
    if (
      isGivingUp ||
      isStoppingAlarm ||
      emergencyErrorCount < EMERGENCY_ERROR_LIMIT
    ) {
      return;
    }

    setIsGivingUp(true);

    void (async () => {
      await recordFailedStreak();
      await stopAlarm();
    })();
  }, [
    emergencyErrorCount,
    isGivingUp,
    isStoppingAlarm,
    recordFailedStreak,
    stopAlarm,
  ]);

  const renderGiveUpButton = () => {
    if (
      isStoppingAlarm ||
      isGivingUp ||
      emergencyErrorCount < EMERGENCY_ERROR_LIMIT
    ) {
      return null;
    }

    return (
      <TouchableOpacity
        style={[
          styles.giveUpButton,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.danger + '66',
          },
        ]}
        onPress={giveUpAlarm}
        activeOpacity={0.88}
      >
        <Text
          style={[
            styles.giveUpButtonText,
            {
              color: colors.danger,
            },
          ]}
        >
          {isGivingUp ? 'Cerrando...' : 'No pude resolver'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMissionWithGiveUp = (missionNode: React.ReactNode) => {
    return (
      <View style={styles.missionWrapper}>
        {missionNode}
        {renderGiveUpButton()}
      </View>
    );
  };

  if (isStoppingAlarm || !canRenderAlarm) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.bg,
          },
        ]}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <StatusBar
          backgroundColor={colors.bg}
          barStyle={statusBarStyle}
        />
      </SafeAreaView>
    );
  }

  if (!alarm) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.bg,
          },
        ]}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <StatusBar
          backgroundColor={colors.bg}
          barStyle={statusBarStyle}
        />

        <View style={styles.centered}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish ? 'Alarma no encontrada' : 'Alarm not found'}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {isSpanish
              ? 'Vuelve e intenta de nuevo.'
              : 'Go back and try again.'}
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
            <Text
              style={[
                styles.stopButtonText,
                {
                  color: colors.white,
                },
              ]}
            >
              {isSpanish ? 'Cerrar alarma' : 'Close alarm'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeMission) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.bg,
          },
        ]}
        edges={[
          'top',
          'left',
          'right',
        ]}
      >
        <StatusBar
          backgroundColor={colors.bg}
          barStyle={statusBarStyle}
        />

        <View
          style={[
            styles.topSection,
            {
              backgroundColor: colors.bgCard,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.badge,
              {
                color: colors.warning,
              },
            ]}
          >
            {isSpanish ? 'ALARMA' : 'ALARM'}
          </Text>

          <Text
            style={[
              styles.time,
              {
                color: colors.text,
              },
            ]}
          >
            {formatTime(alarm.hour, alarm.minute)}
          </Text>

          {alarm.label ? (
            <Text
              style={[
                styles.label,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {alarm.label}
            </Text>
          ) : null}
        </View>

        <View style={styles.normalAlarmSection}>
          <View
            style={[
              styles.normalAlarmIconWrap,
              {
                backgroundColor: colors.accentGlow,
                borderColor: colors.primary + '55',
              },
            ]}
          >
            <Ionicons
              name="alarm-outline"
              size={38}
              color={colors.primary}
            />
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish ? 'Alarma activa' : 'Alarm active'}
          </Text>

          <Text
            style={[
              styles.normalAlarmSubtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {isSpanish
              ? 'Esta alarma no tiene una mision configurada. Puedes detenerla directamente para finalizar este aviso.'
              : 'This alarm has no mission configured. You can stop it directly to finish this alert.'}
          </Text>

          <View
            style={[
              styles.normalAlarmInfo,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={colors.success}
            />

            <Text
              style={[
                styles.normalAlarmInfoText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isSpanish
                ? 'No necesitas resolver pasos adicionales.'
                : 'No extra steps need to be solved.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.stopButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDeep,
              },
            ]}
            onPress={completeNormalAlarm}
            activeOpacity={0.88}
          >
            <Text
              style={[
                styles.stopButtonText,
                {
                  color: colors.white,
                },
              ]}
            >
              {isSpanish ? 'Detener alarma' : 'Stop alarm'}
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    );
  }

  if (activeMission.type === 'wordCompletion') {
    return renderMissionWithGiveUp(
      <WordCompletionMission
        key={`word-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 3}
        onComplete={completeMission}
        onMistake={registerMissionMistake}
        alarmLabel={alarmDisplayLabel}
      />,
    );
  }

  if (activeMission.type === 'physical') {
    return renderMissionWithGiveUp(
      <MovementMissionScreen
        key={`movement-${currentMissionIndex}`}
        userConfig={{
          difficulty: toMissionDifficulty(activeMission.difficulty),
          quantity: activeMission.quantity ?? 3,
        }}
        onSuccess={completeMission}
        onMistake={registerMissionMistake}
        alarmLabel={alarmDisplayLabel}
      />,
    );
  }

  if (activeMission.type === 'color') {
    return renderMissionWithGiveUp(
      <ColoredFiguresMission
        key={`color-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 3}
        onComplete={completeMission}
        onMistake={registerMissionMistake}
        alarmLabel={alarmDisplayLabel}
      />,
    );
  }

  if (activeMission.type === 'colorFind') {
    return renderMissionWithGiveUp(
      <ColorFindMission
        key={`color-find-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 5}
        onComplete={completeMission}
        onMistake={registerMissionMistake}
        alarmLabel={alarmDisplayLabel}
      />,
    );
  }

  if (activeMission.type === 'memory') {
    return renderMissionWithGiveUp(
      <ParesMissionScreen
        key={`memory-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        quantity={activeMission.quantity ?? 3}
        onComplete={completeMission}
        onMistake={registerMissionMistake}
        alarmLabel={alarmDisplayLabel}
      />,
    );
  }

  if (activeMission.type === 'photo') {
    return renderMissionWithGiveUp(
      <ObjectRecognitionMissionContent
        key={`object-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        targetObjectIds={activeMission.targetObjectIds}
        alarmLabel={alarmDisplayLabel}
        onComplete={completeMission}
        onMistake={registerMissionMistake}
      />,
    );
  }

  if (activeMission.type === 'trivia') {
    return renderMissionWithGiveUp(
      <TriviaMission
        key={`trivia-${currentMissionIndex}`}
        difficulty={toMissionDifficulty(activeMission.difficulty)}
        categoryIds={activeMission.triviaCategoryIds}
        targetScore={activeMission.triviaTargetScore}
        alarmLabel={alarmDisplayLabel}
        onComplete={completeMission}
        onMistake={registerMissionMistake}
      />,
    );
  }

  return renderMissionWithGiveUp(
    <MathExercisesMission
      key={`math-${currentMissionIndex}`}
      difficulty={toMissionDifficulty(activeMission.difficulty)}
      quantity={activeMission.quantity ?? 3}
      operationType={(activeMission.operationType ?? 'addition') as OperationType}
      onComplete={completeMission}
      onMistake={registerMissionMistake}
      alarmLabel={alarmDisplayLabel}
    />,
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  missionWrapper: {
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

  normalAlarmIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  normalAlarmSubtitle: {
    maxWidth: 310,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  normalAlarmInfo: {
    width: '100%',
    maxWidth: 340,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  normalAlarmInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
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

  giveUpButton: {
    position: 'absolute',
    right: 16,
    bottom: 22,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 999,
    elevation: 8,
  },

  giveUpButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },

});
