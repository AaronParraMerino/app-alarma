// src/features/alarm/components/AlarmForm.tsx
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import {
  setAudioModeAsync,
  useAudioPlayer,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../../shared/components/ui/BackButton';
import { Modal as AppModal } from '../../../shared/components/ui/Modal';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

import { DAY_LABELS_SHORT } from '../../missions/constants/missions';
import { RandomMissionConfig } from '../../missions/random/components/RandomMissionConfig';
import { registerAlarmMissionConfigSession } from '../services/alarmMissionConfigSession';
import {
  ALARM_SOUND_OPTIONS,
  DEFAULT_ALARM_SOUND_URI,
} from '../services/alarmService';
import { getAlarmSoundAsset } from '../services/alarmSoundAssets';
import {
  ALARM_VIBRATION_OPTIONS,
  DEFAULT_ALARM_VIBRATION_PATTERN,
  AlarmVibrationOptionId,
  getAlarmVibrationPattern,
  normalizeAlarmVibrationPattern,
} from '../services/alarmVibration';
import AlarmChooseMission from './AlarmChooseMission';
import AlarmSelectMission, {
  AlarmMissionSelection,
} from './AlarmSelectMission';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import {
  AlarmCreate,
  AlarmMission,
  AlarmVibrationPattern,
  Difficulty,
  RepeatDay,
} from '../types/alarm.types';
import {
  ALL_REPEAT_DAYS,
  normalizeRepeatDays,
} from '../utils/repeatSchedule';

interface AlarmFormProps {
  title: string;
  submitLabel: string;
  draftKey: string;
  initialData?: Partial<AlarmCreate>;
  onBack: () => void;
  onSubmit: (data: AlarmCreate) => void;
  onDelete?: () => void;
}

type MissionStep = 'form' | 'select' | 'config';
type RuntimeDifficulty = 'easy' | 'medium' | 'hard';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const DEFAULT_MATH_MISSION: AlarmMission = {
  type: 'math',
  difficulty: 'normal',
  quantity: 3,
  operationType: 'addition',
};

const DEFAULT_WORD_MISSION: AlarmMission = {
  type: 'wordCompletion',
  difficulty: 'normal',
  quantity: 3,
};

const DEFAULT_MOVEMENT_MISSION: AlarmMission = {
  type: 'physical',
  difficulty: 'normal',
  quantity: 3,
};

const DEFAULT_COLOR_MISSION: AlarmMission = {
  type: 'color',
  difficulty: 'normal',
  quantity: 3,
};

const DEFAULT_COLOR_FIND_MISSION: AlarmMission = {
  type: 'colorFind',
  difficulty: 'normal',
  quantity: 3,
};

const DEFAULT_MEMORY_MISSION: AlarmMission = {
  type: 'memory',
  difficulty: 'normal',
  quantity: 3,
};

const DEFAULT_OBJECT_MISSION: AlarmMission = {
  type: 'photo',
  difficulty: 'normal',
  quantity: 2,
};

const DEFAULT_TRIVIA_MISSION: AlarmMission = {
  type: 'trivia',
  difficulty: 'normal',
  triviaCategoryIds: [
    'history',
    'music',
    'math',
  ],
  triviaTargetScore: 20,
};

const DEFAULT_RANDOM_CONFIG: AlarmMission = {
  type: 'random',
  difficulty: 'normal',
  quantity: 3,
};

const HOUR_VALUES = Array.from(
  {
    length: 24,
  },
  (_, index) => index,
);

const MINUTE_VALUES = Array.from(
  {
    length: 60,
  },
  (_, index) => index,
);

const MAX_MISSIONS = 5;

const DAY_LABELS_SHORT_EN = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

type AlarmFormDraft = {
  hour: number;
  minute: number;
  label: string;
  repeatDays: RepeatDay[];
  missionEnabled: boolean;
  randomMissions: boolean;
  configuredMissions: AlarmMission[];
  soundUri: string | null;
  vibrationEnabled: boolean;
  vibrationPattern: AlarmVibrationPattern;
};

const alarmFormDrafts = new Map<string, AlarmFormDraft>();

function padTime(value: number): string {
  return value.toString().padStart(2, '0');
}

function mod(
  value: number,
  length: number,
): number {
  return ((value % length) + length) % length;
}

function toRuntimeDifficulty(
  difficulty: Difficulty,
): RuntimeDifficulty {
  return difficulty === 'normal' ? 'medium' : difficulty;
}

function toAlarmDifficulty(
  difficulty: RuntimeDifficulty,
): Difficulty {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

function buildRandomMissionGroup(
  difficulty: RuntimeDifficulty,
  quantity: number,
  missionCount: number,
): AlarmMission[] {
  return Array.from(
    {
      length: Math.min(
        missionCount,
        MAX_MISSIONS,
      ),
    },
    () => ({
      type: 'random',
      difficulty: toAlarmDifficulty(difficulty),
      quantity,
    }),
  );
}

function applyConfiguredMission(
  missions: AlarmMission[],
  mission: AlarmMission,
  index: number | null,
): AlarmMission[] {
  if (
    index === null ||
    index < 0 ||
    index >= missions.length
  ) {
    if (missions.length >= MAX_MISSIONS) {
      return missions;
    }

    return [
      ...missions,
      mission,
    ];
  }

  return missions.map((item, itemIndex) =>
    itemIndex === index ? mission : item,
  );
}

function getTranslatedTitle(
  title: string,
  isSpanish: boolean,
): string {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('editar')) {
    return isSpanish ? 'Editar alarma' : 'Edit alarm';
  }

  if (normalizedTitle.includes('nueva')) {
    return isSpanish ? 'Nueva alarma' : 'New alarm';
  }

  return title;
}

function getTranslatedSubmitLabel(
  submitLabel: string,
  isSpanish: boolean,
): string {
  const normalizedLabel = submitLabel.toLowerCase();

  if (normalizedLabel.includes('cambios')) {
    return isSpanish ? 'Guardar cambios' : 'Save changes';
  }

  if (normalizedLabel.includes('guardar')) {
    return isSpanish ? 'Guardar alarma' : 'Save alarm';
  }

  return submitLabel;
}

function getSoundIconName(soundId: string): IoniconName {
  switch (soundId) {
    case 'silent':
      return 'volume-mute-outline';
    case 'classic':
    case 'alarm_no3':
      return 'alarm-outline';
    case 'cyber':
      return 'flash-outline';
    case 'biohazard':
    case 'meltdown':
      return 'warning-outline';
    case 'alien':
      return 'radio-outline';
    case 'facility_siren':
    case 'imminent':
    case 'tornado':
      return 'megaphone-outline';
    case 'thunder':
      return 'thunderstorm-outline';
    default:
      return 'musical-notes-outline';
  }
}

type TimeWheelProps = {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  label: string;
};

function TimeWheel({
  values,
  value,
  onChange,
  label,
}: TimeWheelProps) {
  const { colors } = useAppTheme();

  const max = values.length;
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const repeatDelayRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRepeat = () => {
    if (repeatDelayRef.current) {
      clearTimeout(repeatDelayRef.current);
      repeatDelayRef.current = null;
    }

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  const changeBy = (delta: number) => {
    const nextValue = values[
      mod(
        valueRef.current + delta,
        max,
      )
    ];

    valueRef.current = nextValue;
    onChangeRef.current(nextValue);
  };

  const startRepeat = (delta: number) => {
    clearRepeat();
    changeBy(delta);

    repeatDelayRef.current = setTimeout(() => {
      repeatDelayRef.current = null;

      repeatIntervalRef.current = setInterval(() => {
        changeBy(delta);
      }, 72);
    }, 260);
  };

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [
    onChange,
    value,
  ]);

  useEffect(() => clearRepeat, []);

  return (
    <View style={styles.timeStepper}>
      <Text
        style={[
          styles.timeStepperLabel,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <TouchableOpacity
        style={[
          styles.timeStepperButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.bgElevated,
          },
        ]}
        onPressIn={() => startRepeat(1)}
        onPressOut={clearRepeat}
        activeOpacity={0.82}
      >
        <Ionicons
          name="chevron-up"
          size={26}
          color={colors.text}
        />
      </TouchableOpacity>

      <Text
        style={[
          styles.timeStepperValue,
          {
            color: colors.text,
          },
        ]}
      >
        {padTime(value)}
      </Text>

      <TouchableOpacity
        style={[
          styles.timeStepperButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.bgElevated,
          },
        ]}
        onPressIn={() => startRepeat(-1)}
        onPressOut={clearRepeat}
        activeOpacity={0.82}
      >
        <Ionicons
          name="chevron-down"
          size={26}
          color={colors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function AlarmForm({
  title,
  submitLabel,
  draftKey,
  initialData,
  onBack,
  onSubmit,
  onDelete,
}: AlarmFormProps) {
  const { colors } = useAppTheme();
  const { language } = useTranslation();

  const isSpanish = language === 'es';

  const navigation =
    useNavigation<
      NativeStackNavigationProp<AlarmStackParamList>
    >();

  const insets = useSafeAreaInsets();

  const translatedTitle = getTranslatedTitle(
    title,
    isSpanish,
  );

  const translatedSubmitLabel = getTranslatedSubmitLabel(
    submitLabel,
    isSpanish,
  );

  const dayLabels = isSpanish
    ? DAY_LABELS_SHORT
    : DAY_LABELS_SHORT_EN;

  const initialDraftRef =
    useRef<AlarmFormDraft | null>(
      alarmFormDrafts.get(draftKey) ?? null,
    );

  const initialDraft = initialDraftRef.current;
  const isEditingAlarm = Boolean(initialData);

  const initialMissionEnabled =
    initialDraft?.missionEnabled ??
    (
      isEditingAlarm
        ? Boolean(
            initialData?.randomMissions ||
            (initialData?.missions?.length ?? 0) > 0,
          )
        : true
    );

  const initialMissionList = initialDraft
    ?.configuredMissions
    ?.length
    ? initialDraft.configuredMissions.slice(
        0,
        MAX_MISSIONS,
      )
    : initialData?.missions?.length
      ? initialData.missions.slice(
          0,
          MAX_MISSIONS,
        )
      : [];

  const initialMissions = initialMissionEnabled
    ? initialMissionList.map((mission) =>
        (
          initialDraft?.randomMissions ??
          initialData?.randomMissions
        )
          ? {
              ...mission,
              type: 'random' as const,
            }
          : mission,
      )
    : [];

  const [hour, setHour] = useState<number>(
    initialDraft?.hour ??
      initialData?.hour ??
      7,
  );

  const [minute, setMinute] = useState<number>(
    initialDraft?.minute ??
      initialData?.minute ??
      0,
  );

  const [hourText, setHourText] = useState(() =>
    padTime(
      initialDraft?.hour ??
        initialData?.hour ??
        7,
    ),
  );

  const [minuteText, setMinuteText] = useState(() =>
    padTime(
      initialDraft?.minute ??
        initialData?.minute ??
        0,
    ),
  );

  const [label, setLabel] = useState<string>(
    initialDraft?.label ??
      initialData?.label ??
      '',
  );

  const [repeatDays, setRepeatDays] =
    useState<RepeatDay[]>(
      initialDraft?.repeatDays ??
        initialData?.repeatDays ??
        [],
    );

  const [missionEnabled, setMissionEnabled] =
    useState(initialMissionEnabled);

  const [randomMissions, setRandomMissions] =
    useState<boolean>(
      initialDraft?.randomMissions ??
        Boolean(initialData?.randomMissions),
    );

  const [configuredMissions, setConfiguredMissions] =
    useState<AlarmMission[]>(
      initialDraft?.configuredMissions ??
        initialMissions,
    );

  const [draftMission, setDraftMission] =
    useState<AlarmMission | null>(null);

  const [configSelection, setConfigSelection] =
    useState<AlarmMissionSelection | null>(null);

  const [
    editingMissionIndex,
    setEditingMissionIndex,
  ] = useState<number | null>(null);

  const [missionStep, setMissionStep] =
    useState<MissionStep>('form');

  const [
    deleteConfirmVisible,
    setDeleteConfirmVisible,
  ] = useState(false);

  const [
    missionRequiredVisible,
    setMissionRequiredVisible,
  ] = useState(false);

  const [soundPickerOpen, setSoundPickerOpen] =
    useState(false);

  const [vibrationPickerOpen, setVibrationPickerOpen] =
    useState(false);

  const [
    previewSoundUri,
    setPreviewSoundUri,
  ] = useState<string | null>(null);

  const [
    previewRequestId,
    setPreviewRequestId,
  ] = useState(0);

  const [
    previewingSoundUri,
    setPreviewingSoundUri,
  ] = useState<string | null>(null);

  const [
    previewingVibrationId,
    setPreviewingVibrationId,
  ] = useState<AlarmVibrationOptionId | null>(null);

  const [soundUri, setSoundUri] =
    useState<string | null>(
      initialDraft?.soundUri ??
        (
          initialData
            ? initialData.soundUri ?? null
            : DEFAULT_ALARM_SOUND_URI
        ),
    );

  const [vibrationEnabled, setVibrationEnabled] =
    useState<boolean>(
      initialDraft?.vibrationEnabled ??
        initialData?.vibrationEnabled ??
        true,
    );

  const [vibrationPattern, setVibrationPattern] =
    useState<AlarmVibrationPattern>(
      normalizeAlarmVibrationPattern(
        initialDraft?.vibrationPattern ??
          initialData?.vibrationPattern ??
          DEFAULT_ALARM_VIBRATION_PATTERN,
      ),
    );

  const selectedSound =
    ALARM_SOUND_OPTIONS.find(
      (sound) => sound.uri === soundUri,
    ) ?? ALARM_SOUND_OPTIONS[0];

  const selectedVibrationId: AlarmVibrationOptionId =
    vibrationEnabled ? vibrationPattern : 'none';

  const selectedVibration =
    ALARM_VIBRATION_OPTIONS.find(
      (option) => option.id === selectedVibrationId,
    ) ?? ALARM_VIBRATION_OPTIONS[0];

  const previewSoundAsset =
    getAlarmSoundAsset(previewSoundUri);

  const previewPlayer = useAudioPlayer(
    previewSoundAsset,
    {
      keepAudioSessionActive: false,
    },
  );

  const draftClosedRef = useRef(false);

  const draftRef = useRef<AlarmFormDraft>({
    hour,
    minute,
    label,
    repeatDays,
    missionEnabled,
    randomMissions,
    configuredMissions,
    soundUri,
    vibrationEnabled,
    vibrationPattern,
  });

  const vibrationPreviewTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (draftClosedRef.current) {
      return;
    }

    draftRef.current = {
      hour,
      minute,
      label,
      repeatDays,
      missionEnabled,
      randomMissions,
      configuredMissions,
      soundUri,
      vibrationEnabled,
      vibrationPattern,
    };

    alarmFormDrafts.set(
      draftKey,
      draftRef.current,
    );
  }, [
    configuredMissions,
    draftKey,
    hour,
    label,
    minute,
    missionEnabled,
    randomMissions,
    repeatDays,
    soundUri,
    vibrationEnabled,
    vibrationPattern,
  ]);

  useEffect(() => {
    setHourText(padTime(hour));
  }, [
    hour,
  ]);

  useEffect(() => {
    setMinuteText(padTime(minute));
  }, [
    minute,
  ]);

  const stopSoundPreview = React.useCallback(() => {
    try {
      previewPlayer.pause();
      void previewPlayer.seekTo(0);
    } catch (error) {
      console.log(
        '[AlarmForm] No se pudo detener la preescucha:',
        error,
      );
    }

    setPreviewingSoundUri(null);
  }, [
    previewPlayer,
  ]);

  const playSoundPreview = React.useCallback((
    uri: string | null,
  ) => {
    if (!uri) {
      stopSoundPreview();
      return;
    }

    if (previewingSoundUri === uri) {
      stopSoundPreview();
      return;
    }

    setPreviewSoundUri(uri);
    setPreviewRequestId((current) => current + 1);
  }, [
    previewingSoundUri,
    stopSoundPreview,
  ]);

  useEffect(() => {
    if (!previewRequestId || !previewSoundUri || !previewSoundAsset) {
      return undefined;
    }

    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startPreview = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'doNotMix',
        });

        if (!mounted) {
          return;
        }

        previewPlayer.pause();
        await previewPlayer.seekTo(0);
        previewPlayer.volume = 0.85;
        setPreviewingSoundUri(previewSoundUri);
        previewPlayer.play();

        timer = setTimeout(() => {
          if (!mounted) {
            return;
          }

          stopSoundPreview();
        }, 3500);
      } catch (error) {
        setPreviewingSoundUri(null);
        console.log(
          '[AlarmForm] No se pudo reproducir la preescucha:',
          error,
        );
      }
    };

    void startPreview();

    return () => {
      mounted = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    previewPlayer,
    previewRequestId,
    previewSoundAsset,
    previewSoundUri,
    stopSoundPreview,
  ]);

  useEffect(() => {
    return () => {
      stopSoundPreview();
    };
  }, [
    stopSoundPreview,
  ]);

  const stopVibrationPreview = React.useCallback(() => {
    if (vibrationPreviewTimerRef.current) {
      clearTimeout(vibrationPreviewTimerRef.current);
      vibrationPreviewTimerRef.current = null;
    }

    Vibration.cancel();
    setPreviewingVibrationId(null);
  }, []);

  const playVibrationPreview = React.useCallback((
    optionId: AlarmVibrationOptionId,
  ) => {
    if (optionId === 'none') {
      stopVibrationPreview();
      return;
    }

    if (previewingVibrationId === optionId) {
      stopVibrationPreview();
      return;
    }

    stopVibrationPreview();
    setPreviewingVibrationId(optionId);
    Vibration.vibrate(getAlarmVibrationPattern(optionId), false);

    vibrationPreviewTimerRef.current = setTimeout(() => {
      stopVibrationPreview();
    }, 2600);
  }, [
    previewingVibrationId,
    stopVibrationPreview,
  ]);

  useEffect(() => {
    return () => {
      stopVibrationPreview();
    };
  }, [
    stopVibrationPreview,
  ]);

  const persistDraft = (
    overrides: Partial<AlarmFormDraft> = {},
  ) => {
    if (draftClosedRef.current) {
      return draftRef.current;
    }

    const draft: AlarmFormDraft = {
      ...draftRef.current,
      ...overrides,
    };

    draftRef.current = draft;

    alarmFormDrafts.set(
      draftKey,
      draft,
    );

    return draft;
  };

  const clearSavedDraft = () => {
    draftClosedRef.current = true;
    alarmFormDrafts.delete(draftKey);
  };

  const updateHour = (nextHour: number) => {
    setHour(nextHour);

    persistDraft({
      hour: nextHour,
    });
  };

  const updateMinute = (nextMinute: number) => {
    setMinute(nextMinute);

    persistDraft({
      minute: nextMinute,
    });
  };

  const sanitizeTimeText = (text: string) =>
    text
      .replace(/\D/g, '')
      .slice(
        0,
        2,
      );

  const commitHourText = () => {
    const parsedHour = Number.parseInt(
      hourText,
      10,
    );

    if (Number.isNaN(parsedHour)) {
      setHourText(padTime(hour));
      return;
    }

    updateHour(
      Math.max(
        0,
        Math.min(
          23,
          parsedHour,
        ),
      ),
    );
  };

  const commitMinuteText = () => {
    const parsedMinute = Number.parseInt(
      minuteText,
      10,
    );

    if (Number.isNaN(parsedMinute)) {
      setMinuteText(padTime(minute));
      return;
    }

    updateMinute(
      Math.max(
        0,
        Math.min(
          59,
          parsedMinute,
        ),
      ),
    );
  };

  const handleBack = () => {
    clearSavedDraft();
    onBack();
  };

  const handleDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    clearSavedDraft();
    setDeleteConfirmVisible(false);
    onDelete?.();
  };

  const normalizedRepeatDays =
    normalizeRepeatDays(repeatDays);

  const allDaysSelected =
    normalizedRepeatDays.length ===
    ALL_REPEAT_DAYS.length;

  const toggleAllDays = () => {
    setRepeatDays(
      allDaysSelected
        ? []
        : [
            ...ALL_REPEAT_DAYS,
          ],
    );
  };

  const toggleDay = (day: RepeatDay) => {
    setRepeatDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }

      return normalizeRepeatDays([
        ...prev,
        day,
      ]);
    });
  };

  const openMissionSelector = () => {
    setMissionEnabled(true);

    persistDraft({
      missionEnabled: true,
    });

    setEditingMissionIndex(null);
    setMissionStep('select');
  };

  const clearMission = (index?: number) => {
    if (typeof index === 'number') {
      setConfiguredMissions((prev) =>
        prev.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      );

      setRandomMissions(false);
      return;
    }

    setConfiguredMissions([]);
    setDraftMission(null);
    setConfigSelection(null);
    setEditingMissionIndex(null);
    setRandomMissions(false);
  };

  const toggleMissionEnabled = (enabled: boolean) => {
    setMissionEnabled(enabled);

    if (!enabled) {
      clearMission();
    }
  };

  const setConfiguredMissionAtIndex = (
    mission: AlarmMission,
    index: number | null,
  ) => {
    setConfiguredMissions((prev) => {
      const next = applyConfiguredMission(
        prev,
        mission,
        index,
      );

      persistDraft({
        configuredMissions: next,
        missionEnabled: true,
        randomMissions: false,
      });

      return next;
    });
  };

  const editMission = (index: number) => {
    const mission = configuredMissions[index];

    if (!mission) {
      return;
    }

    const selection =
      mission.type === 'random' || randomMissions
        ? 'random'
        : mission.type === 'math'
          ? 'math'
          : mission.type === 'physical'
            ? 'physical'
            : mission.type === 'color'
              ? 'color'
              : mission.type === 'colorFind'
                ? 'colorFind'
                : mission.type === 'memory'
                  ? 'memory'
                  : mission.type === 'photo'
                    ? 'photo'
                    : mission.type === 'trivia'
                      ? 'trivia'
                      : 'wordCompletion';

    setEditingMissionIndex(index);
    setConfigSelection(selection);

    if (selection === 'random') {
      setDraftMission(mission);
      setMissionStep('config');
      return;
    }

    openConcreteMissionConfig(
      selection,
      mission,
      index,
    );
  };

  const selectMission = (
    selection: AlarmMissionSelection,
  ) => {
    setMissionEnabled(true);
    setConfigSelection(selection);

    if (selection === 'random') {
      const currentMission =
        editingMissionIndex !== null
          ? configuredMissions[editingMissionIndex]
          : null;

      setDraftMission(
        currentMission?.type === 'random'
          ? currentMission
          : DEFAULT_RANDOM_CONFIG,
      );

      setMissionStep('config');
      return;
    }

    const defaultMission =
      selection === 'math'
        ? DEFAULT_MATH_MISSION
        : selection === 'physical'
          ? DEFAULT_MOVEMENT_MISSION
            : selection === 'color'
              ? DEFAULT_COLOR_MISSION
              : selection === 'colorFind'
                ? DEFAULT_COLOR_FIND_MISSION
                : selection === 'memory'
                  ? DEFAULT_MEMORY_MISSION
                  : selection === 'photo'
                    ? DEFAULT_OBJECT_MISSION
                    : selection === 'trivia'
                      ? DEFAULT_TRIVIA_MISSION
                      : DEFAULT_WORD_MISSION;

    const existingMission =
      editingMissionIndex !== null
        ? configuredMissions[editingMissionIndex] ??
          defaultMission
        : defaultMission;

    persistDraft({
      missionEnabled: true,
    });

    openConcreteMissionConfig(
      selection,
      existingMission,
      editingMissionIndex,
    );
  };

  const closeMissionConfig = () => {
    setDraftMission(null);
    setConfigSelection(null);
    setEditingMissionIndex(null);
    setMissionStep('select');
  };

  const openConcreteMissionConfig = (
    selection: Exclude<
      AlarmMissionSelection,
      'random'
    >,
    mission: AlarmMission,
    index: number | null,
  ) => {
    const sessionId =
      registerAlarmMissionConfigSession((nextMission) => {
        setConfiguredMissionAtIndex(
          nextMission,
          index,
        );

        setMissionEnabled(true);
        setRandomMissions(false);
        setDraftMission(null);
        setConfigSelection(null);
        setEditingMissionIndex(null);
        setMissionStep('form');
      });

    if (selection === 'math') {
      persistDraft();

      navigation.navigate('AlarmConfigMathMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 3,
        operationType: mission.operationType ?? 'addition',
        alarmConfigSessionId: sessionId,
      });

      return;
    }

    if (selection === 'physical') {
      persistDraft();

      navigation.navigate('AlarmConfigMovementMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 3,
        alarmConfigSessionId: sessionId,
      });

      return;
    }

    if (selection === 'color') {
      persistDraft();

      navigation.navigate(
        'AlarmConfigColoredFiguresMission',
        {
          difficulty: toRuntimeDifficulty(
            mission.difficulty,
          ),
          quantity: mission.quantity ?? 3,
          alarmConfigSessionId: sessionId,
        },
      );

      return;
    }

    if (selection === 'photo') {
      persistDraft();

      navigation.navigate(
        'AlarmConfigObjectRecognitionMission',
        {
          difficulty: toRuntimeDifficulty(
            mission.difficulty,
          ),
          quantity: mission.quantity ?? 2,
          targetObjectIds: mission.targetObjectIds,
          alarmConfigSessionId: sessionId,
        },
      );

      return;
    }

    if (selection === 'trivia') {
      persistDraft();

      navigation.navigate(
        'AlarmConfigTriviaMission',
        {
          difficulty: toRuntimeDifficulty(
            mission.difficulty,
          ),
          categoryIds:
            mission.triviaCategoryIds,
          targetScore:
            mission.triviaTargetScore,
          alarmConfigSessionId: sessionId,
        },
      );

      return;
    }

    if (selection === 'colorFind') {
      persistDraft();

      navigation.navigate('AlarmConfigColorFindMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 5,
        alarmConfigSessionId: sessionId,
      });

      return;
    }

    if (selection === 'memory') {
      persistDraft();

      navigation.navigate('AlarmConfigParesMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 3,
        alarmConfigSessionId: sessionId,
      });

      return;
    }

    persistDraft();

    navigation.navigate('AlarmConfigWordCompletionMission', {
      difficulty: toRuntimeDifficulty(mission.difficulty),
      quantity: mission.quantity ?? 3,
      alarmConfigSessionId: sessionId,
    });
  };

  const getRandomMissionConfigLimit = () => {
    const randomCount = configuredMissions.filter(
      (mission) => mission.type === 'random',
    ).length;

    const editingMission =
      editingMissionIndex !== null
        ? configuredMissions[editingMissionIndex]
        : null;

    if (editingMission?.type === 'random') {
      return Math.max(
        1,
        MAX_MISSIONS -
          (configuredMissions.length - randomCount),
      );
    }

    if (editingMissionIndex !== null) {
      return Math.max(
        1,
        MAX_MISSIONS - configuredMissions.length + 1,
      );
    }

    return Math.max(
      1,
      MAX_MISSIONS - configuredMissions.length,
    );
  };

  const getInitialRandomMissionCount = () => {
    const editingMission =
      editingMissionIndex !== null
        ? configuredMissions[editingMissionIndex]
        : null;

    if (editingMission?.type === 'random') {
      return Math.max(
        1,
        configuredMissions.filter(
          (mission) => mission.type === 'random',
        ).length,
      );
    }

    return 1;
  };

  const saveRandomMissionConfig = (config: {
    difficulty: RuntimeDifficulty;
    quantity: number;
    missionCount: number;
  }) => {
    const randomMissionGroup = buildRandomMissionGroup(
      config.difficulty,
      config.quantity,
      config.missionCount,
    );

    setConfiguredMissions((prev) => {
      const editingMission =
        editingMissionIndex !== null
          ? prev[editingMissionIndex]
          : null;

      let next: AlarmMission[];

      if (editingMission?.type === 'random') {
        let inserted = false;

        next = prev.flatMap((mission) => {
          if (mission.type !== 'random') {
            return [
              mission,
            ];
          }

          if (inserted) {
            return [];
          }

          inserted = true;

          return randomMissionGroup;
        });

        next = next.slice(
          0,
          MAX_MISSIONS,
        );
      } else if (
        editingMissionIndex !== null &&
        editingMissionIndex >= 0 &&
        editingMissionIndex < prev.length
      ) {
        next = prev
          .flatMap((mission, index) =>
            index === editingMissionIndex
              ? randomMissionGroup
              : [
                  mission,
                ],
          )
          .slice(
            0,
            MAX_MISSIONS,
          );
      } else {
        next = [
          ...prev,
          ...randomMissionGroup,
        ].slice(
          0,
          MAX_MISSIONS,
        );
      }

      persistDraft({
        configuredMissions: next,
        missionEnabled: true,
        randomMissions: false,
      });

      return next;
    });

    setRandomMissions(false);
    setDraftMission(null);
    setConfigSelection(null);
    setEditingMissionIndex(null);
    setMissionStep('form');
  };

  const saveAlarm = () => {
    const hasConfiguredMissions =
      missionEnabled &&
      configuredMissions.length > 0;

    if (missionEnabled && !hasConfiguredMissions) {
      setMissionRequiredVisible(true);
      return;
    }

    const normalizedRepeatDays =
      normalizeRepeatDays(repeatDays);

    clearSavedDraft();

    onSubmit({
      hour,
      minute,
      label: label.trim(),
      enabled: true,
      repeatDays: normalizedRepeatDays,
      missions: hasConfiguredMissions
        ? configuredMissions
        : [],
      randomMissions: false,
      soundUri,
      vibrationEnabled,
      vibrationPattern,
    });
  };

  if (missionStep === 'select') {
    return (
      <AlarmSelectMission
        onBack={() => setMissionStep('form')}
        onSelectMission={selectMission}
      />
    );
  }

  if (
    missionStep === 'config' &&
    configSelection === 'random' &&
    draftMission
  ) {
    return (
      <RandomMissionConfig
        initialDifficulty={toRuntimeDifficulty(
          draftMission.difficulty,
        )}
        initialQuantity={draftMission.quantity ?? 3}
        initialMissionCount={getInitialRandomMissionCount()}
        maxMissionCount={getRandomMissionConfigLimit()}
        onBack={closeMissionConfig}
        saveLabel={
          isSpanish ? 'Guardar misión' : 'Save mission'
        }
        onSave={saveRandomMissionConfig}
      />
    );
  }

  return (
    <>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.bg,
          },
        ]}
      >
        <BackButton
          onPress={handleBack}
          style={styles.backBtn}
        />

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {translatedTitle}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={{
          backgroundColor: colors.bg,
        }}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: onDelete
              ? 132 + insets.bottom
              : 104 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish ? 'Hora' : 'Time'}
          </Text>

          <View
            style={[
              styles.timePickerPanel,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
          >
            <TimeWheel
              label={isSpanish ? 'Hora' : 'Hour'}
              values={HOUR_VALUES}
              value={hour}
              onChange={updateHour}
            />

            <Text
              style={[
                styles.timeSeparator,
                {
                  color: colors.text,
                },
              ]}
            >
              :
            </Text>

            <TimeWheel
              label={isSpanish ? 'Min' : 'Min'}
              values={MINUTE_VALUES}
              value={minute}
              onChange={updateMinute}
            />
          </View>

          <View
            style={[
              styles.directTimeRow,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.directTimeLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isSpanish ? 'Hora exacta' : 'Exact time'}
            </Text>

            <View style={styles.directTimeInputs}>
              <TextInput
                style={[
                  styles.directTimeInput,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={hourText}
                onChangeText={(text) =>
                  setHourText(sanitizeTimeText(text))
                }
                onBlur={commitHourText}
                onSubmitEditing={commitHourText}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                returnKeyType="done"
              />

              <Text
                style={[
                  styles.directTimeSeparator,
                  {
                    color: colors.text,
                  },
                ]}
              >
                :
              </Text>

              <TextInput
                style={[
                  styles.directTimeInput,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={minuteText}
                onChangeText={(text) =>
                  setMinuteText(sanitizeTimeText(text))
                }
                onBlur={commitMinuteText}
                onSubmitEditing={commitMinuteText}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish
              ? 'Nombre (opcional)'
              : 'Name (optional)'}
          </Text>

          <TextInput
            placeholder={
              isSpanish
                ? 'Ej. Clase de programación'
                : 'Ex. Programming class'
            }
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={label}
            onChangeText={setLabel}
            maxLength={40}
          />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish ? 'Repetición' : 'Repeat'}
          </Text>

          <TouchableOpacity
            style={[
              styles.allDaysToggle,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleAllDays}
            activeOpacity={0.85}
          >
            <Ionicons
              name={
                allDaysSelected
                  ? 'checkbox'
                  : 'square-outline'
              }
              size={22}
              color={
                allDaysSelected
                  ? colors.primary
                  : colors.textSecondary
              }
            />

            <Text
              style={[
                styles.allDaysText,
                {
                  color: allDaysSelected
                    ? colors.text
                    : colors.textSecondary,
                },
              ]}
            >
              {isSpanish ? 'Todos los días' : 'Every day'}
            </Text>
          </TouchableOpacity>

          <View style={styles.daysRow}>
            {dayLabels.map((day, index) => {
              const dayValue = index as RepeatDay;
              const active = repeatDays.includes(dayValue);

              return (
                <TouchableOpacity
                  key={`${day}-${index}`}
                  style={[
                    styles.dayBtn,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.bgElevated,
                      borderColor: active
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => toggleDay(dayValue)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: active
                          ? colors.white
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {isSpanish ? 'Alerta' : 'Alert'}
          </Text>

          <TouchableOpacity
            style={[
              styles.alertSummary,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSoundPickerOpen((current) => !current)}
            activeOpacity={0.86}
          >
            <View
              style={[
                styles.alertSummaryIcon,
                {
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '44',
                },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.alertSummaryText}>
              <Text
                style={[
                  styles.alertSummaryTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {isSpanish
                  ? 'Seleccionar sonido'
                  : 'Select sound'}
              </Text>
              <Text
                style={[
                  styles.alertSummarySubtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {selectedSound?.label ??
                  (isSpanish
                    ? 'Sonido personalizado'
                    : 'Custom sound')}
              </Text>
            </View>

            <Ionicons
              name={
                soundPickerOpen
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.selectedSoundText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {isSpanish
              ? `Sonido escogido: ${selectedSound?.label ?? 'Personalizado'}`
              : `Selected sound: ${selectedSound?.label ?? 'Custom'}`}
          </Text>

          {soundPickerOpen ? (
            <View
              style={[
                styles.soundList,
                {
                  borderColor: colors.border,
                },
              ]}
            >
              {ALARM_SOUND_OPTIONS.map((sound, index) => {
                const active = soundUri === sound.uri;

                return (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundRow,
                      {
                        backgroundColor: active
                          ? colors.primary + '16'
                          : colors.bgCard,
                        borderBottomColor: colors.border,
                        borderBottomWidth:
                          index === ALARM_SOUND_OPTIONS.length - 1
                            ? 0
                            : StyleSheet.hairlineWidth,
                      },
                    ]}
                    onPress={() => {
                      setSoundUri(sound.uri);
                    }}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.soundIconWrap,
                        {
                          backgroundColor: active
                            ? colors.primary + '22'
                            : colors.bgElevated,
                          borderColor: active
                            ? colors.primary + '55'
                            : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getSoundIconName(sound.id)}
                        size={18}
                        color={
                          active
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.soundText,
                        {
                          color: active
                            ? colors.text
                            : colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {sound.label}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.soundPreviewButton,
                        {
                          backgroundColor:
                            previewingSoundUri === sound.uri
                              ? colors.primary + '20'
                              : colors.bgElevated,
                          borderColor:
                            previewingSoundUri === sound.uri
                              ? colors.primary + '66'
                              : colors.border,
                        },
                        !sound.uri && styles.soundPreviewButtonDisabled,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        playSoundPreview(sound.uri);
                      }}
                      activeOpacity={sound.uri ? 0.82 : 1}
                      disabled={!sound.uri}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isSpanish
                          ? `Preescuchar ${sound.label}`
                          : `Preview ${sound.label}`
                      }
                    >
                      <Ionicons
                        name={
                          !sound.uri
                            ? 'volume-mute-outline'
                            : previewingSoundUri === sound.uri
                              ? 'stop-circle-outline'
                              : 'play-circle-outline'
                        }
                        size={20}
                        color={
                          !sound.uri
                            ? colors.textMuted
                            : previewingSoundUri === sound.uri
                              ? colors.primary
                              : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>

                    <Ionicons
                      name={
                        active
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        active
                          ? colors.primary
                          : colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.alertSectionHeader}>
            <Text
              style={[
                styles.alertSectionTitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isSpanish ? 'Respuesta de alarma' : 'Alarm response'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.alertSummary,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setVibrationPickerOpen((current) => !current)}
            activeOpacity={0.86}
          >
            <View
              style={[
                styles.alertSummaryIcon,
                {
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '44',
                },
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.alertSummaryText}>
              <Text
                style={[
                  styles.alertSummaryTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {isSpanish
                  ? 'Seleccionar vibracion'
                  : 'Select vibration'}
              </Text>
              <Text
                style={[
                  styles.alertSummarySubtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {isSpanish
                  ? selectedVibration.labelEs
                  : selectedVibration.labelEn}
              </Text>
            </View>

            <Ionicons
              name={
                vibrationPickerOpen
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.selectedSoundText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {isSpanish
              ? `Vibracion escogida: ${selectedVibration.labelEs}`
              : `Selected vibration: ${selectedVibration.labelEn}`}
          </Text>

          {vibrationPickerOpen ? (
            <View
              style={[
                styles.soundList,
                {
                  borderColor: colors.border,
                },
              ]}
            >
              {ALARM_VIBRATION_OPTIONS.map((option, index) => {
                const active = selectedVibrationId === option.id;
                const canPreview = option.pattern !== null;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.soundRow,
                      {
                        backgroundColor: active
                          ? colors.primary + '16'
                          : colors.bgCard,
                        borderBottomColor: colors.border,
                        borderBottomWidth:
                          index === ALARM_VIBRATION_OPTIONS.length - 1
                            ? 0
                            : StyleSheet.hairlineWidth,
                      },
                    ]}
                    onPress={() => {
                      if (option.id === 'none') {
                        setVibrationEnabled(false);
                        return;
                      }

                      setVibrationEnabled(true);
                      setVibrationPattern(option.id);
                    }}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.soundIconWrap,
                        {
                          backgroundColor: active
                            ? colors.primary + '22'
                            : colors.bgElevated,
                          borderColor: active
                            ? colors.primary + '55'
                            : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as IoniconName}
                        size={18}
                        color={
                          active
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </View>

                    <View style={styles.soundTextWrap}>
                      <Text
                        style={[
                          styles.soundText,
                          {
                            color: active
                              ? colors.text
                              : colors.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {isSpanish ? option.labelEs : option.labelEn}
                      </Text>

                      <Text
                        style={[
                          styles.vibrationDescriptionText,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {isSpanish
                          ? option.descriptionEs
                          : option.descriptionEn}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.soundPreviewButton,
                        {
                          backgroundColor:
                            previewingVibrationId === option.id
                              ? colors.primary + '20'
                              : colors.bgElevated,
                          borderColor:
                            previewingVibrationId === option.id
                              ? colors.primary + '66'
                              : colors.border,
                        },
                        !canPreview && styles.soundPreviewButtonDisabled,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        playVibrationPreview(option.id);
                      }}
                      activeOpacity={canPreview ? 0.82 : 1}
                      disabled={!canPreview}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isSpanish
                          ? `Probar ${option.labelEs}`
                          : `Preview ${option.labelEn}`
                      }
                    >
                      <Ionicons
                        name={
                          !canPreview
                            ? 'remove-circle-outline'
                            : previewingVibrationId === option.id
                              ? 'stop-circle-outline'
                              : 'play-circle-outline'
                        }
                        size={20}
                        color={
                          !canPreview
                            ? colors.textMuted
                            : previewingVibrationId === option.id
                              ? colors.primary
                              : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>

                    <Ionicons
                      name={
                        active
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        active
                          ? colors.primary
                          : colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

        <AlarmChooseMission
          missions={configuredMissions}
          missionEnabled={missionEnabled}
          randomMissions={randomMissions}
          onToggleMissionEnabled={toggleMissionEnabled}
          onOpenSelect={openMissionSelector}
          onEditMission={editMission}
          onClearMission={clearMission}
        />
      </ScrollView>

      <View
        style={[
          styles.actionShell,
          {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            paddingBottom: Math.max(
              insets.bottom,
              10,
            ),
          },
        ]}
      >
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDeep,
              },
              onDelete && styles.saveBtnWithDelete,
            ]}
            onPress={saveAlarm}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.saveBtnText,
                {
                  color: colors.white,
                },
              ]}
            >
              {translatedSubmitLabel}
            </Text>
          </TouchableOpacity>

          {onDelete ? (
            <TouchableOpacity
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: colors.dangerDim,
                  borderColor: colors.danger,
                },
              ]}
              onPress={handleDelete}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.deleteBtnText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                {isSpanish ? 'Eliminar' : 'Delete'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <AppModal
        visible={deleteConfirmVisible}
        type="warning"
        title={
          isSpanish
            ? 'Eliminar alarma'
            : 'Delete alarm'
        }
        message={
          isSpanish
            ? 'Esta acción no se puede deshacer.'
            : 'This action cannot be undone.'
        }
        closeOnBackdropPress
        onClose={() => setDeleteConfirmVisible(false)}
        cancelAction={{
          label: isSpanish ? 'Cancelar' : 'Cancel',
          onPress: () => setDeleteConfirmVisible(false),
        }}
        confirmAction={{
          label: isSpanish ? 'Eliminar' : 'Delete',
          onPress: confirmDelete,
        }}
      />

      <AppModal
        visible={missionRequiredVisible}
        type="warning"
        title={
          isSpanish
            ? 'Configura una mision'
            : 'Configure a mission'
        }
        message={
          isSpanish
            ? 'Tienes las misiones activadas. Selecciona al menos una mision o desactiva el checkbox para guardar una alarma normal.'
            : 'Missions are enabled. Select at least one mission or disable the checkbox to save a normal alarm.'
        }
        closeOnBackdropPress
        onClose={() => setMissionRequiredVisible(false)}
        cancelAction={{
          label: isSpanish
            ? 'Desactivar misiones'
            : 'Disable missions',
          onPress: () => {
            setMissionRequiredVisible(false);
            toggleMissionEnabled(false);
          },
        }}
        confirmAction={{
          label: isSpanish
            ? 'Seleccionar mision'
            : 'Select mission',
          onPress: () => {
            setMissionRequiredVisible(false);
            openMissionSelector();
          },
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    minWidth: 76,
  },

  headerSpacer: {
    width: 76,
  },

  title: {
    fontSize: 20,
    fontWeight: Typography.title.fontWeight,
  },

  content: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 28,
    gap: 12,
  },

  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },

  sectionTitle: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
  },

  timePickerPanel: {
    minHeight: 154,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  timeStepper: {
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
    gap: 7,
  },

  timeStepperLabel: {
    fontSize: 12,
    fontWeight: '800',
  },

  timeStepperButton: {
    width: '100%',
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeStepperValue: {
    width: '100%',
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '900',
    textAlign: 'center',
  },

  timeSeparator: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900',
    marginTop: 18,
  },

  directTimeRow: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  directTimeLabel: {
    fontSize: 13,
    fontWeight: '800',
  },

  directTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  directTimeInput: {
    width: 48,
    minHeight: 36,
    borderRadius: 9,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  directTimeSeparator: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },

  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  allDaysToggle: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },

  allDaysText: {
    fontSize: 14,
    fontWeight: '800',
  },

  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },

  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  dayText: {
    fontWeight: '600',
  },

  alertSummary: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  alertSummaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  alertSummaryText: {
    flex: 1,
    gap: 2,
  },

  alertSummaryTitle: {
    fontSize: 15,
    fontWeight: '900',
  },

  alertSummarySubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  selectedSoundText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: -4,
    paddingHorizontal: 2,
  },

  alertSectionHeader: {
    marginTop: 2,
  },

  alertSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  soundList: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },

  soundRow: {
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  soundIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  soundTextWrap: {
    flex: 1,
    gap: 2,
  },

  soundText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },

  vibrationDescriptionText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },

  soundPreviewButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  soundPreviewButtonDisabled: {
    opacity: 0.58,
  },

  settingToggle: {
    minHeight: 66,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingTextWrap: {
    flex: 1,
    gap: 2,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: '900',
  },

  settingDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
  },

  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  saveBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  saveBtnWithDelete: {
    flex: 1.35,
  },

  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  deleteBtn: {
    minWidth: 104,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  actionShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: Layout.screenPadding,
  },

  actionBar: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    minHeight: 52,
    flexDirection: 'row',
    gap: 10,
  },
});
