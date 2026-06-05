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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { OBJECT_BANK_SEED } from '../../missions/ObjectRecognition/constants/objectBank';
import { TriviaMission } from '../../missions/Trivia/screens/TriviaMissionScreen';
import { TRIVIA_CATEGORIES } from '../../missions/Trivia/constants/trivia.config';
import { TriviaCategory } from '../../missions/Trivia/types/trivia.types';
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
const RANDOM_MISSION_SEQUENCE_STORAGE_PREFIX =
  'neuro-wake-random-mission-sequence-v1';

type AlarmForMissionSequence = {
  id: string;
  updatedAt?: number;
  randomMissions: boolean;
  missions: AlarmMission[];
};

type StoredRandomMissionSequence = {
  signature: string;
  missions: AlarmMission[];
  createdAt: number;
};

const RANDOM_OPERATION_TYPES: OperationType[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

const RANDOM_OBJECT_QUANTITY_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
};

const RANDOM_OBJECT_POOL_SIZE_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 3,
  normal: 4,
  hard: 6,
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickRandom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function pickRandomObjectIds(difficulty: Difficulty): string[] {
  const enabledObjects = OBJECT_BANK_SEED.filter(
    (object) => object.enabled !== false,
  );

  const objectIds = enabledObjects.length > 0
    ? enabledObjects.map((object) => object.id)
    : ['bottle', 'book', 'cup'];

  return shuffle(objectIds).slice(
    0,
    Math.min(
      RANDOM_OBJECT_POOL_SIZE_BY_DIFFICULTY[difficulty],
      objectIds.length,
    ),
  );
}

function pickRandomTriviaCategories(difficulty: Difficulty): TriviaCategory[] {
  const categoryIds = TRIVIA_CATEGORIES
    .map((category) => category.id)
    .filter((categoryId) => categoryId !== 'custom');
  const targetCount =
    difficulty === 'easy'
      ? 2
      : difficulty === 'normal'
        ? 3
        : 4;

  return shuffle(categoryIds).slice(
    0,
    Math.min(targetCount, categoryIds.length),
  );
}

function resolveRandomMission(
  config: AlarmMission,
  selectedType: MissionType,
): AlarmMission {
  const difficulty = config.difficulty;
  const quantity = config.quantity ?? 3;

  if (selectedType === 'math') {
    return {
      type: selectedType,
      difficulty,
      quantity,
      operationType: pickRandom(RANDOM_OPERATION_TYPES),
    };
  }

  if (selectedType === 'photo') {
    return {
      type: selectedType,
      difficulty,
      quantity: RANDOM_OBJECT_QUANTITY_BY_DIFFICULTY[difficulty],
      targetObjectIds: pickRandomObjectIds(difficulty),
    };
  }

  if (selectedType === 'trivia') {
    return {
      type: selectedType,
      difficulty,
      triviaCategoryIds: pickRandomTriviaCategories(difficulty),
      triviaTargetScore: 20,
    };
  }

  return {
    type: selectedType,
    difficulty,
    quantity,
  };
}

function resolveRandomMissionGroup(configs: AlarmMission[]): AlarmMission[] {
  const missionTypePool = shuffle(RANDOM_MISSION_TYPES);

  return configs.map((config, index) =>
    resolveRandomMission(
      config,
      missionTypePool[index % missionTypePool.length],
    ),
  );
}

function hasRandomMission(alarm: AlarmForMissionSequence): boolean {
  return (
    alarm.randomMissions ||
    alarm.missions.some((mission) => mission.type === 'random')
  );
}

function getRandomMissionSequenceStorageKey(alarmId: string): string {
  return `${RANDOM_MISSION_SEQUENCE_STORAGE_PREFIX}:${alarmId}`;
}

function getRandomMissionSequenceSignature(
  alarm: AlarmForMissionSequence,
): string {
  return JSON.stringify({
    alarmId: alarm.id,
    updatedAt: alarm.updatedAt ?? null,
    randomMissions: alarm.randomMissions,
    missions: alarm.missions,
  });
}

function buildMissionSequence(alarm: AlarmForMissionSequence): AlarmMission[] {
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

    return resolveRandomMissionGroup(randomConfigs);
  }

  if (alarm.missions.length === 0) {
    return [];
  }

  const randomMissionTypes = shuffle(RANDOM_MISSION_TYPES);
  let randomMissionIndex = 0;

  return alarm.missions.map((mission) => {
    if (mission.type === 'random') {
      const selectedType =
        randomMissionTypes[randomMissionIndex % randomMissionTypes.length];
      randomMissionIndex += 1;

      return resolveRandomMission(mission, selectedType);
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
}

async function getStableMissionSequence(
  alarm: AlarmForMissionSequence,
): Promise<AlarmMission[]> {
  if (!hasRandomMission(alarm)) {
    return buildMissionSequence(alarm);
  }

  const storageKey = getRandomMissionSequenceStorageKey(alarm.id);
  const signature = getRandomMissionSequenceSignature(alarm);

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const stored = raw
      ? (JSON.parse(raw) as StoredRandomMissionSequence)
      : null;

    if (
      stored?.signature === signature &&
      Array.isArray(stored.missions)
    ) {
      return stored.missions;
    }
  } catch (error) {
    console.log(
      '[AlarmRinging] No se pudo leer la secuencia random:',
      error,
    );
  }

  const missions = buildMissionSequence(alarm);

  try {
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({
        signature,
        missions,
        createdAt: Date.now(),
      } satisfies StoredRandomMissionSequence),
    );
  } catch (error) {
    console.log(
      '[AlarmRinging] No se pudo guardar la secuencia random:',
      error,
    );
  }

  return missions;
}

async function clearStableMissionSequence(alarmId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      getRandomMissionSequenceStorageKey(alarmId),
    );
  } catch (error) {
    console.log(
      '[AlarmRinging] No se pudo limpiar la secuencia random:',
      error,
    );
  }
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
  const alarmUserId = isAuthenticated ? user?.id ?? null : null;

  const {
    alarms,
    updateAlarm,
  } = useAlarmStore();

  const alarmId = route.params.alarmId;

  const alarm = useMemo(
    () =>
      alarms.find((a) => a.id === alarmId) ??
      getAlarmsLocal(alarmUserId).find((a) => a.id === alarmId),
    [
      alarms,
      alarmId,
      alarmUserId,
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
  const [missionSequence, setMissionSequence] = useState<AlarmMission[]>([]);
  const [missionSequenceReady, setMissionSequenceReady] = useState(false);
  const [canRenderAlarm, setCanRenderAlarm] = useState(false);
  const [isStoppingAlarm, setIsStoppingAlarm] = useState(false);
  const [isGivingUp, setIsGivingUp] = useState(false);
  const [emergencyErrorCount, setEmergencyErrorCount] = useState(0);

  const stoppingAlarmRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const streakCompletedRecordedRef = React.useRef(false);
  const streakFailedRecordedRef = React.useRef(false);
  const missionSequenceSignatureRef = React.useRef<string | null>(null);

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
    setMissionSequence([]);
    setMissionSequenceReady(false);
    setCanRenderAlarm(false);
    setIsStoppingAlarm(false);
    setIsGivingUp(false);
    setEmergencyErrorCount(0);
    stoppingAlarmRef.current = false;
    streakCompletedRecordedRef.current = false;
    streakFailedRecordedRef.current = false;
    missionSequenceSignatureRef.current = null;
  }, [
    alarm?.id,
    alarmId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadMissionSequence = async () => {
      if (!alarm) {
        setMissionSequence([]);
        missionSequenceSignatureRef.current = null;
        setMissionSequenceReady(true);
        return;
      }

      const signature = getRandomMissionSequenceSignature(alarm);

      if (
        missionSequenceReady &&
        missionSequenceSignatureRef.current === signature
      ) {
        return;
      }

      setMissionSequenceReady(false);

      const sequence = await getStableMissionSequence(alarm);

      if (cancelled || !mountedRef.current) {
        return;
      }

      setMissionSequence(sequence);
      setCurrentMissionIndex(0);
      missionSequenceSignatureRef.current = signature;
      setMissionSequenceReady(true);
    };

    void loadMissionSequence();

    return () => {
      cancelled = true;
    };
  }, [
    alarm,
    missionSequenceReady,
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
        player.volume = Math.max(
          0,
          Math.min(
            1,
            (alarm.minVolumePercent ?? 100) / 100,
          ),
        );
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
    alarm?.minVolumePercent,
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

    await clearStableMissionSequence(targetAlarmId);
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
            backgroundColor: colors.danger,
            borderColor: colors.danger + 'AA',
          },
        ]}
        onPress={giveUpAlarm}
        activeOpacity={0.88}
      >
        <Ionicons
          name="warning-outline"
          size={17}
          color={colors.white}
        />

        <View style={styles.giveUpTextWrap}>
          <Text
            style={[
              styles.giveUpButtonText,
              {
                color: colors.white,
              },
            ]}
          >
            {isGivingUp
              ? isSpanish ? 'Cerrando...' : 'Closing...'
              : isSpanish ? 'No pude resolver' : 'I could not solve it'}
          </Text>

          <Text
            style={[
              styles.giveUpButtonHint,
              {
                color: colors.white,
              },
            ]}
          >
            {isSpanish ? 'Reinicia tu racha' : 'Resets your streak'}
          </Text>
        </View>
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

  if (!missionSequenceReady) {
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
          <Ionicons
            name="shuffle-outline"
            size={42}
            color={colors.primary}
          />

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish ? 'Preparando misión' : 'Preparing mission'}
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
              ? 'Estamos fijando la misión aleatoria de esta alarma.'
              : 'We are locking this alarm random mission.'}
          </Text>
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
    top: 72,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },

  giveUpTextWrap: {
    gap: 1,
  },

  giveUpButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },

  giveUpButtonHint: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.85,
  },

});
