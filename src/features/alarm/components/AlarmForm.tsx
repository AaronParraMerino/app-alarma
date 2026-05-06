import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../shared/theme/colors';
import {
  DAY_LABELS_SHORT,
  MISSION_ICONS,
  MISSION_LABELS,
} from '../../missions/constants/missions';
import { ALARM_SOUND_OPTIONS, DEFAULT_ALARM_SOUND_URI } from '../services/alarmService';
import { AlarmCreate, Difficulty, MissionType, RepeatDay } from '../types/alarm.types';

interface AlarmFormProps {
  title: string;
  submitLabel: string;
  initialData?: Partial<AlarmCreate>;
  onBack: () => void;
  onSubmit: (data: AlarmCreate) => void;
  onDelete?: () => void;
}

const MISSION_TYPES: MissionType[] = [
  'math',
  'wordCompletion',
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Facil' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Dificil' },
];

const OPERATION_OPTIONS = [
  { value: 'addition' as const, label: 'Suma', symbol: '+' },
  { value: 'subtraction' as const, label: 'Resta', symbol: '-' },
  { value: 'multiplication' as const, label: 'Multi', symbol: 'x' },
  { value: 'division' as const, label: 'Division', symbol: '/' },
];

type TimeMode = 'hour' | 'minute';

const CLOCK_SIZE = 260;
const CLOCK_CENTER = CLOCK_SIZE / 2;
const CLOCK_RADIUS = 102;
const HOUR_VALUES = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_VALUES = Array.from({ length: 12 }, (_, index) => index * 5);

function padTime(value: number): string {
  return value.toString().padStart(2, '0');
}

export default function AlarmForm({
  title,
  submitLabel,
  initialData,
  onBack,
  onSubmit,
  onDelete,
}: AlarmFormProps) {
  const [hour, setHour] = useState<number>(initialData?.hour ?? 7);
  const [minute, setMinute] = useState<number>(initialData?.minute ?? 0);
  const [label, setLabel] = useState<string>(initialData?.label ?? '');
  const [repeatDays, setRepeatDays] = useState<RepeatDay[]>(initialData?.repeatDays ?? []);
  const [randomMissions, setRandomMissions] = useState<boolean>(
    initialData?.randomMissions ?? false,
  );
  const [selectedMission, setSelectedMission] = useState<MissionType>(
    initialData?.missions?.[0]?.type ?? 'math',
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(
    initialData?.missions?.[0]?.difficulty ?? 'normal',
  );
  const [missionQuantity, setMissionQuantity] = useState<number>(
    initialData?.missions?.[0]?.quantity ?? 3,
  );
  const [operationType, setOperationType] = useState<
    'addition' | 'subtraction' | 'multiplication' | 'division'
  >(initialData?.missions?.[0]?.operationType ?? 'addition');
  const [soundUri, setSoundUri] = useState<string | null>(
    initialData ? initialData.soundUri ?? null : DEFAULT_ALARM_SOUND_URI,
  );
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timeMode, setTimeMode] = useState<TimeMode>('hour');

  const timePreview = useMemo(() => {
    const hh = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${padTime(hh)}:${padTime(minute)} ${ampm}`;
  }, [hour, minute]);

  const selectedPeriod = hour < 12 ? 'AM' : 'PM';
  const selectedDisplayHour = hour % 12 === 0 ? 12 : hour % 12;

  const setPeriod = (period: 'AM' | 'PM') => {
    setHour(prev => {
      const displayHour = prev % 12;
      return period === 'AM' ? displayHour : displayHour + 12;
    });
  };

  const selectClockValue = (value: number) => {
    if (timeMode === 'hour') {
      const nextHour = value % 12;
      setHour(selectedPeriod === 'AM' ? nextHour : nextHour + 12);
      setTimeMode('minute');
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

  const saveAlarm = () => {
    onSubmit({
      hour,
      minute,
      label: label.trim(),
      enabled: initialData?.enabled ?? true,
      repeatDays,
      missions: randomMissions
        ? []
        : [
            {
              type: selectedMission,
              difficulty: selectedDifficulty,
              quantity: missionQuantity,
              operationType: selectedMission === 'math' ? operationType : undefined,
            },
          ],
      randomMissions,
      soundUri,
    });
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hora</Text>
          <TouchableOpacity
            style={styles.timeSelectButton}
            onPress={() => {
              setTimeMode('hour');
              setTimePickerOpen(true);
            }}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.timeSelectLabel}>Seleccionar hora</Text>
              <Text style={styles.timePreview}>{timePreview}</Text>
            </View>
            <Text style={styles.timeSelectIcon}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nombre (opcional)</Text>
          <TextInput
            placeholder="Ej. Clase de programación"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            maxLength={40}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Repetición</Text>
          <View style={styles.daysRow}>
            {DAY_LABELS_SHORT.map((day, index) => {
              const dayValue = index as RepeatDay;
              const active = repeatDays.includes(dayValue);
              return (
                <TouchableOpacity
                  key={day + index}
                  style={[styles.dayBtn, active && styles.dayBtnActive]}
                  onPress={() => toggleDay(dayValue)}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
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
                >
                  <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                  <Text style={[styles.soundText, active && styles.soundTextActive]}>{sound.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>Misiones aleatorias</Text>
              <Text style={styles.helper}>Si activas esto, se asignan al azar</Text>
            </View>
            <Switch
              value={randomMissions}
              onValueChange={setRandomMissions}
              trackColor={{ false: Colors.borderFocus + '33', true: Colors.primary }}
              thumbColor={randomMissions ? Colors.primaryLight : Colors.textMuted}
            />
          </View>

          {!randomMissions && (
            <>
              <Text style={styles.sectionTitle}>Misión principal</Text>
              <View style={styles.missionsWrap}>
                {MISSION_TYPES.map(type => {
                  const active = selectedMission === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.missionBtn, active && styles.missionBtnActive]}
                      onPress={() => setSelectedMission(type)}
                    >
                      <Text style={styles.missionIcon}>{MISSION_ICONS[type]}</Text>
                      <Text style={[styles.missionText, active && styles.missionTextActive]}>
                        {MISSION_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>Dificultad</Text>
              <View style={styles.difficultyRow}>
                {DIFFICULTY_OPTIONS.map(option => {
                  const active = selectedDifficulty === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.difficultyBtn, active && styles.difficultyBtnActive]}
                      onPress={() => setSelectedDifficulty(option.value)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          active && styles.difficultyTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>Cantidad</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setMissionQuantity(prev => Math.max(1, prev - 1))}
                >
                  <Text style={styles.quantityBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{missionQuantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setMissionQuantity(prev => Math.min(9, prev + 1))}
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {selectedMission === 'math' && (
                <>
                  <Text style={styles.sectionTitle}>Operacion</Text>
                  <View style={styles.operationGrid}>
                    {OPERATION_OPTIONS.map(option => {
                      const active = operationType === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.operationBtn, active && styles.operationBtnActive]}
                          onPress={() => setOperationType(option.value)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.operationSymbol,
                              active && styles.operationSymbolActive,
                            ]}
                          >
                            {option.symbol}
                          </Text>
                          <Text
                            style={[
                              styles.operationLabel,
                              active && styles.operationLabelActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveAlarm} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{submitLabel}</Text>
        </TouchableOpacity>

        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.9}>
            <Text style={styles.deleteBtnText}>Eliminar alarma</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={timePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timeModal}>
            <Text style={styles.modalTitle}>Seleccionar hora</Text>

            <View style={styles.timeDisplayRow}>
              <TouchableOpacity
                style={[styles.timeBox, timeMode === 'hour' && styles.timeBoxActive]}
                onPress={() => setTimeMode('hour')}
                activeOpacity={0.85}
              >
                <Text style={[styles.timeBoxText, timeMode === 'hour' && styles.timeBoxTextActive]}>
                  {padTime(selectedDisplayHour)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.timeSeparator}>:</Text>

              <TouchableOpacity
                style={[styles.timeBox, timeMode === 'minute' && styles.timeBoxActive]}
                onPress={() => setTimeMode('minute')}
                activeOpacity={0.85}
              >
                <Text style={[styles.timeBoxText, timeMode === 'minute' && styles.timeBoxTextActive]}>
                  {padTime(minute)}
                </Text>
              </TouchableOpacity>

              <View style={styles.periodGroup}>
                {(['AM', 'PM'] as const).map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      selectedPeriod === period && styles.periodButtonActive,
                    ]}
                    onPress={() => setPeriod(period)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        selectedPeriod === period && styles.periodTextActive,
                      ]}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.clockFace}>
              {(timeMode === 'hour' ? HOUR_VALUES : MINUTE_VALUES).map((value, index) => {
                const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
                const x = CLOCK_CENTER + Math.cos(angle) * CLOCK_RADIUS - 22;
                const y = CLOCK_CENTER + Math.sin(angle) * CLOCK_RADIUS - 22;
                const active =
                  timeMode === 'hour'
                    ? value === selectedDisplayHour
                    : value === minute;

                return (
                  <TouchableOpacity
                    key={`${timeMode}-${value}`}
                    style={[
                      styles.clockNumber,
                      { left: x, top: y },
                      active && styles.clockNumberActive,
                    ]}
                    onPress={() => selectClockValue(value)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.clockNumberText, active && styles.clockNumberTextActive]}>
                      {timeMode === 'hour' ? value : padTime(value)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.clockCenterDot} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setTimeMode(timeMode === 'hour' ? 'minute' : 'hour')}>
                <Text style={styles.modalActionText}>{timeMode === 'hour' ? 'Minutos' : 'Horas'}</Text>
              </TouchableOpacity>
              <View style={styles.modalActionRight}>
                <TouchableOpacity onPress={() => setTimePickerOpen(false)}>
                  <Text style={styles.modalActionText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTimePickerOpen(false)}>
                  <Text style={styles.modalActionText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    color: Colors.text,
    fontSize: 18,
    lineHeight: 22,
  },
  headerSpacer: {
    width: 36,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  timePreview: {
    color: Colors.primaryLight,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timeSelectButton: {
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeSelectLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeSelectIcon: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary + '22',
    overflow: 'hidden',
  },
  timeControls: {
    flexDirection: 'row',
    gap: 10,
  },
  timeCol: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  timeLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '55',
  },
  stepBtnText: {
    color: Colors.primaryLight,
    fontSize: 22,
    marginTop: -1,
  },
  stepValue: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    minWidth: 46,
    textAlign: 'center',
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  helper: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  missionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  missionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  missionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  missionIcon: {
    fontSize: 13,
  },
  missionText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  missionTextActive: {
    color: Colors.text,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  timeModal: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 16,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  timeBox: {
    width: 94,
    height: 86,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeBoxActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  timeBoxText: {
    color: Colors.text,
    fontSize: 54,
    fontWeight: '800',
    lineHeight: 60,
  },
  timeBoxTextActive: {
    color: Colors.bg,
  },
  timeSeparator: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: '900',
    marginTop: -6,
  },
  periodGroup: {
    width: 66,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  periodButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  periodText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
  },
  periodTextActive: {
    color: Colors.bg,
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    alignSelf: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    marginBottom: 18,
  },
  clockNumber: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNumberActive: {
    backgroundColor: Colors.primary,
  },
  clockNumberText: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  clockNumberTextActive: {
    color: Colors.white,
  },
  clockCenterDot: {
    position: 'absolute',
    left: CLOCK_CENTER - 5,
    top: CLOCK_CENTER - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 42,
  },
  modalActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  modalActionText: {
    color: Colors.primaryLight,
    fontSize: 15,
    fontWeight: '800',
    paddingVertical: 8,
  },
});
