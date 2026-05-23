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
  View,
} from 'react-native';
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
import AlarmChooseMission from './AlarmChooseMission';
import AlarmSelectMission, {
  AlarmMissionSelection,
} from './AlarmSelectMission';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import {
  AlarmCreate,
  AlarmMission,
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

const DEFAULT_OBJECT_MISSION: AlarmMission = {
  type: 'photo',
  difficulty: 'normal',
  quantity: 2,
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

  const initialMissionEnabled = Boolean(
    initialDraft?.missionEnabled ??
      (
        initialData?.randomMissions ||
        (initialData?.missions?.length ?? 0) > 0
      ),
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
      : [
          DEFAULT_RANDOM_CONFIG,
        ];

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

  const [soundUri, setSoundUri] =
    useState<string | null>(
      initialDraft?.soundUri ??
        (
          initialData
            ? initialData.soundUri ?? null
            : DEFAULT_ALARM_SOUND_URI
        ),
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
  });

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
                : mission.type === 'photo'
                  ? 'photo'
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
              : selection === 'photo'
                ? DEFAULT_OBJECT_MISSION
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

    if (selection === 'colorFind') {
      persistDraft();

      navigation.navigate('AlarmConfigColorFindMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 5,
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
            {isSpanish ? 'Sonido' : 'Sound'}
          </Text>

          <View style={styles.soundWrap}>
            {ALARM_SOUND_OPTIONS.map((sound) => {
              const active = soundUri === sound.uri;

              return (
                <TouchableOpacity
                  key={sound.id}
                  style={[
                    styles.soundBtn,
                    {
                      backgroundColor: active
                        ? colors.primary + '22'
                        : colors.bgElevated,
                      borderColor: active
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => setSoundUri(sound.uri)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.soundEmoji}>
                    {sound.emoji}
                  </Text>

                  <Text
                    style={[
                      styles.soundText,
                      {
                        color: active
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {sound.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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

  soundWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  soundBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  soundEmoji: {
    fontSize: 12,
  },

  soundText: {
    fontSize: 12,
    fontWeight: '500',
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
