import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { DAY_LABELS_SHORT } from '../../missions/constants/missions';
import { RandomMissionConfig } from '../../missions/random/components/RandomMissionConfig';
import { registerAlarmMissionConfigSession } from '../services/alarmMissionConfigSession';
import { ALARM_SOUND_OPTIONS, DEFAULT_ALARM_SOUND_URI } from '../services/alarmService';
import AlarmChooseMission from './AlarmChooseMission';
import AlarmSelectMission, { AlarmMissionSelection } from './AlarmSelectMission';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import { AlarmCreate, AlarmMission, Difficulty, RepeatDay } from '../types/alarm.types';

interface AlarmFormProps {
  title: string;
  submitLabel: string;
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

const DEFAULT_RANDOM_CONFIG: AlarmMission = {
  type: 'random',
  difficulty: 'normal',
  quantity: 3,
};

const HOUR_VALUES = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_VALUES = Array.from({ length: 60 }, (_, index) => index);
const MAX_MISSIONS = 5;
const WHEEL_ITEM_HEIGHT = 68;
const WHEEL_VISIBLE_ITEMS = 3;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS;
const WHEEL_PADDING = WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ITEMS / 2);

function padTime(value: number): string {
  return value.toString().padStart(2, '0');
}

function toRuntimeDifficulty(difficulty: Difficulty): RuntimeDifficulty {
  return difficulty === 'normal' ? 'medium' : difficulty;
}

function toAlarmDifficulty(difficulty: RuntimeDifficulty): Difficulty {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

function buildRandomMissionGroup(
  difficulty: RuntimeDifficulty,
  quantity: number,
  missionCount: number,
): AlarmMission[] {
  return Array.from({ length: Math.min(missionCount, MAX_MISSIONS) }, () => ({
    type: 'random',
    difficulty: toAlarmDifficulty(difficulty),
    quantity,
  }));
}

export default function AlarmForm({
  title,
  submitLabel,
  initialData,
  onBack,
  onSubmit,
  onDelete,
}: AlarmFormProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AlarmStackParamList>>();
  const initialMissionEnabled = Boolean(
    initialData?.randomMissions || (initialData?.missions?.length ?? 0) > 0,
  );
  const initialMissionList = initialData?.missions?.length
    ? initialData.missions.slice(0, MAX_MISSIONS)
    : [DEFAULT_RANDOM_CONFIG];
  const initialMissions = initialMissionEnabled
    ? initialMissionList.map(mission =>
        initialData?.randomMissions ? { ...mission, type: 'random' as const } : mission,
      )
    : [];

  const [hour, setHour] = useState<number>(initialData?.hour ?? 7);
  const [minute, setMinute] = useState<number>(initialData?.minute ?? 0);
  const [label, setLabel] = useState<string>(initialData?.label ?? '');
  const [repeatDays, setRepeatDays] = useState<RepeatDay[]>(initialData?.repeatDays ?? []);
  const [missionEnabled, setMissionEnabled] = useState(initialMissionEnabled);
  const [randomMissions, setRandomMissions] = useState<boolean>(false);
  const [configuredMissions, setConfiguredMissions] = useState<AlarmMission[]>(
    initialMissions,
  );
  const [draftMission, setDraftMission] = useState<AlarmMission | null>(null);
  const [configSelection, setConfigSelection] = useState<AlarmMissionSelection | null>(null);
  const [editingMissionIndex, setEditingMissionIndex] = useState<number | null>(null);
  const [missionStep, setMissionStep] = useState<MissionStep>('form');
  const [soundUri, setSoundUri] = useState<string | null>(
    initialData ? initialData.soundUri ?? null : DEFAULT_ALARM_SOUND_URI,
  );
  const hourWheelRef = useRef<ScrollView>(null);
  const minuteWheelRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      hourWheelRef.current?.scrollTo({
        y: hour * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
      minuteWheelRef.current?.scrollTo({
        y: minute * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  const selectWheelValue = (
    ref: React.RefObject<ScrollView | null>,
    value: number,
    type: 'hour' | 'minute',
  ) => {
    if (type === 'hour') {
      setHour(value);
    } else {
      setMinute(value);
    }

    ref.current?.scrollTo({
      y: value * WHEEL_ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleWheelEnd = (
    type: 'hour' | 'minute',
    values: number[],
  ) => (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
    const index = Math.max(0, Math.min(values.length - 1, rawIndex));
    const value = values[index];

    if (type === 'hour') {
      setHour(value);
      return;
    }

    setMinute(value);
  };

  const toggleDay = (day: RepeatDay) => {
    setRepeatDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      }

      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const openMissionSelector = () => {
    setMissionEnabled(true);
    setEditingMissionIndex(null);
    setMissionStep('select');
  };

  const clearMission = (index?: number) => {
    if (typeof index === 'number') {
      setConfiguredMissions(prev => prev.filter((_, itemIndex) => itemIndex !== index));
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

  const setConfiguredMissionAtIndex = (mission: AlarmMission, index: number | null) => {
    setConfiguredMissions(prev => {
      if (index === null || index < 0 || index >= prev.length) {
        if (prev.length >= MAX_MISSIONS) return prev;
        return [...prev, mission];
      }

      return prev.map((item, itemIndex) => (itemIndex === index ? mission : item));
    });
  };

  const editMission = (index: number) => {
    const mission = configuredMissions[index];
    if (!mission) return;

    const selection = mission.type === 'random' || randomMissions
      ? 'random'
      : mission.type === 'math'
        ? 'math'
        : mission.type === 'physical'
          ? 'physical'
          : mission.type === 'color'
            ? 'color'
            : 'wordCompletion';

    setEditingMissionIndex(index);
    setConfigSelection(selection);

    if (selection === 'random') {
      setDraftMission(mission);
      setMissionStep('config');
      return;
    }

    openConcreteMissionConfig(selection, mission, index);
  };

  const selectMission = (selection: AlarmMissionSelection) => {
    setMissionEnabled(true);
    setConfigSelection(selection);

    if (selection === 'random') {
      const currentMission = editingMissionIndex !== null
        ? configuredMissions[editingMissionIndex]
        : null;
      setDraftMission(currentMission?.type === 'random' ? currentMission : DEFAULT_RANDOM_CONFIG);
      setMissionStep('config');
      return;
    }

    const defaultMission = selection === 'math'
      ? DEFAULT_MATH_MISSION
      : selection === 'physical'
        ? DEFAULT_MOVEMENT_MISSION
        : selection === 'color'
          ? DEFAULT_COLOR_MISSION
          : DEFAULT_WORD_MISSION;
    const existingMission = editingMissionIndex !== null
      ? configuredMissions[editingMissionIndex] ?? defaultMission
      : defaultMission;

    openConcreteMissionConfig(selection, existingMission, editingMissionIndex);
  };

  const closeMissionConfig = () => {
    setDraftMission(null);
    setConfigSelection(null);
    setEditingMissionIndex(null);
    setMissionStep('select');
  };

  const openConcreteMissionConfig = (
    selection: Exclude<AlarmMissionSelection, 'random'>,
    mission: AlarmMission,
    index: number | null,
  ) => {
    const sessionId = registerAlarmMissionConfigSession(nextMission => {
      setConfiguredMissionAtIndex(nextMission, index);
      setMissionEnabled(true);
      setRandomMissions(false);
      setDraftMission(null);
      setConfigSelection(null);
      setEditingMissionIndex(null);
      setMissionStep('form');
    });

    if (selection === 'math') {
      navigation.navigate('AlarmConfigMathMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 3,
        operationType: mission.operationType ?? 'addition',
        alarmConfigSessionId: sessionId,
      });
      return;
    }

    if (selection === 'physical') {
      navigation.navigate('AlarmConfigMovementMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 3,
        alarmConfigSessionId: sessionId,
      });
      return;
    }

    if (selection === 'color') {
      navigation.navigate('AlarmConfigColoredFiguresMission', {
        difficulty: toRuntimeDifficulty(mission.difficulty),
        quantity: mission.quantity ?? 3,
        alarmConfigSessionId: sessionId,
      });
      return;
    }

    navigation.navigate('AlarmConfigWordCompletionMission', {
      difficulty: toRuntimeDifficulty(mission.difficulty),
      quantity: mission.quantity ?? 3,
      alarmConfigSessionId: sessionId,
    });
  };

  const getRandomMissionConfigLimit = () => {
    const randomCount = configuredMissions.filter(mission => mission.type === 'random').length;
    const editingMission = editingMissionIndex !== null
      ? configuredMissions[editingMissionIndex]
      : null;

    if (editingMission?.type === 'random') {
      return Math.max(1, MAX_MISSIONS - (configuredMissions.length - randomCount));
    }

    if (editingMissionIndex !== null) {
      return Math.max(1, MAX_MISSIONS - configuredMissions.length + 1);
    }

    return Math.max(1, MAX_MISSIONS - configuredMissions.length);
  };

  const getInitialRandomMissionCount = () => {
    const editingMission = editingMissionIndex !== null
      ? configuredMissions[editingMissionIndex]
      : null;

    if (editingMission?.type === 'random') {
      return Math.max(1, configuredMissions.filter(mission => mission.type === 'random').length);
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

    setConfiguredMissions(prev => {
      const editingMission = editingMissionIndex !== null ? prev[editingMissionIndex] : null;

      if (editingMission?.type === 'random') {
        let inserted = false;
        const next = prev.flatMap(mission => {
          if (mission.type !== 'random') return [mission];
          if (inserted) return [];

          inserted = true;
          return randomMissionGroup;
        });

        return next.slice(0, MAX_MISSIONS);
      }

      if (editingMissionIndex !== null && editingMissionIndex >= 0 && editingMissionIndex < prev.length) {
        return prev
          .flatMap((mission, index) => (index === editingMissionIndex ? randomMissionGroup : [mission]))
          .slice(0, MAX_MISSIONS);
      }

      return [...prev, ...randomMissionGroup].slice(0, MAX_MISSIONS);
    });

    setRandomMissions(false);
    setDraftMission(null);
    setConfigSelection(null);
    setEditingMissionIndex(null);
    setMissionStep('form');
  };

  const saveAlarm = () => {
    const hasConfiguredMissions = missionEnabled && configuredMissions.length > 0;

    onSubmit({
      hour,
      minute,
      label: label.trim(),
      enabled: initialData?.enabled ?? true,
      repeatDays,
      missions: hasConfiguredMissions ? configuredMissions : [],
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

  if (missionStep === 'config' && configSelection === 'random' && draftMission) {
    return (
      <RandomMissionConfig
        initialDifficulty={toRuntimeDifficulty(draftMission.difficulty)}
        initialQuantity={draftMission.quantity ?? 3}
        initialMissionCount={getInitialRandomMissionCount()}
        maxMissionCount={getRandomMissionConfigLimit()}
        onBack={closeMissionConfig}
        saveLabel="Guardar mision"
        onSave={saveRandomMissionConfig}
      />
    );
  }

  return (
    <>
      <View style={styles.header}>
        <BackButton onPress={onBack} style={styles.backBtn} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hora</Text>
          <View style={styles.inlineWheelFrame}>
            <View style={styles.wheelPicker}>
              <ScrollView
                ref={hourWheelRef}
                style={styles.wheelColumn}
                contentContainerStyle={styles.wheelContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleWheelEnd('hour', HOUR_VALUES)}
                onScrollEndDrag={handleWheelEnd('hour', HOUR_VALUES)}
              >
                {HOUR_VALUES.map(value => {
                  const active = value === hour;

                  return (
                    <TouchableOpacity
                      key={`hour-${value}`}
                      style={styles.wheelItem}
                      onPress={() => selectWheelValue(hourWheelRef, value, 'hour')}
                      activeOpacity={0.78}
                    >
                      <Text style={[styles.wheelItemText, active && styles.wheelItemTextActive]}>
                        {padTime(value)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.wheelSeparator}>:</Text>

              <ScrollView
                ref={minuteWheelRef}
                style={styles.wheelColumn}
                contentContainerStyle={styles.wheelContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleWheelEnd('minute', MINUTE_VALUES)}
                onScrollEndDrag={handleWheelEnd('minute', MINUTE_VALUES)}
              >
                {MINUTE_VALUES.map(value => {
                  const active = value === minute;

                  return (
                    <TouchableOpacity
                      key={`minute-${value}`}
                      style={styles.wheelItem}
                      onPress={() => selectWheelValue(minuteWheelRef, value, 'minute')}
                      activeOpacity={0.78}
                    >
                      <Text style={[styles.wheelItemText, active && styles.wheelItemTextActive]}>
                        {padTime(value)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nombre (opcional)</Text>
          <TextInput
            placeholder="Ej. Clase de programacion"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            maxLength={40}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Repeticion</Text>
          <View style={styles.daysRow}>
            {DAY_LABELS_SHORT.map((day, index) => {
              const dayValue = index as RepeatDay;
              const active = repeatDays.includes(dayValue);
              return (
                <TouchableOpacity
                  key={day + index}
                  style={[styles.dayBtn, active && styles.dayBtnActive]}
                  onPress={() => toggleDay(dayValue)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sonido</Text>
          <View style={styles.soundWrap}>
            {ALARM_SOUND_OPTIONS.map(sound => {
              const active = soundUri === sound.uri;
              return (
                <TouchableOpacity
                  key={sound.id}
                  style={[styles.soundBtn, active && styles.soundBtnActive]}
                  onPress={() => setSoundUri(sound.uri)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                  <Text style={[styles.soundText, active && styles.soundTextActive]}>
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

        <TouchableOpacity style={styles.saveBtn} onPress={saveAlarm} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{submitLabel}</Text>
        </TouchableOpacity>

        {onDelete ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.9}>
            <Text style={styles.deleteBtnText}>Eliminar alarma</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

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
    color: Colors.text,
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
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
  },
  inlineWheelFrame: {
    height: WHEEL_HEIGHT,
    borderRadius: 14,
    backgroundColor: Colors.black,
    overflow: 'hidden',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    color: Colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayTextActive: {
    color: Colors.white,
  },
  soundWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soundBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soundBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  soundEmoji: {
    fontSize: 12,
  },
  soundText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  soundTextActive: {
    color: Colors.text,
  },
  helper: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  configBadge: {
    alignSelf: 'flex-start',
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary + '22',
    overflow: 'hidden',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    paddingVertical: 10,
    alignItems: 'center',
  },
  difficultyBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  difficultyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  difficultyTextActive: {
    color: Colors.text,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    overflow: 'hidden',
  },
  quantityBtn: {
    width: 44,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '22',
  },
  quantityBtnText: {
    color: Colors.primaryLight,
    fontSize: 22,
    fontWeight: '800',
  },
  quantityValue: {
    minWidth: 54,
    color: Colors.text,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  operationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  operationBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  operationBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  operationSymbol: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  operationSymbolActive: {
    color: Colors.primaryLight,
  },
  operationLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  operationLabelActive: {
    color: Colors.text,
  },
  saveBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: Colors.dangerDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  wheelPicker: {
    height: WHEEL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wheelColumn: {
    width: 112,
    height: WHEEL_HEIGHT,
  },
  wheelContent: {
    paddingVertical: WHEEL_PADDING,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    color: Colors.textMuted,
    fontSize: 40,
    lineHeight: 50,
    fontWeight: '500',
  },
  wheelItemTextActive: {
    color: Colors.white,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
  },
  wheelSeparator: {
    color: Colors.white,
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
});
