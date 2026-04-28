import React, { useMemo, useState } from 'react';
import {
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
import { ALARM_SOUND_OPTIONS } from '../services/alarmService';
import { AlarmCreate, MissionType, RepeatDay } from '../types/alarm.types';

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
  'memory',
  'physical',
  'photo',
  'trivia',
  'writing',
  'color',
  'shapes',
  'sequence',
];

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
  const [soundUri, setSoundUri] = useState<string | null>(initialData?.soundUri ?? null);

  const timePreview = useMemo(() => {
    const hh = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${hh.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }, [hour, minute]);

  const changeHour = (delta: number) => {
    setHour(prev => {
      const next = prev + delta;
      if (next < 0) return 23;
      if (next > 23) return 0;
      return next;
    });
  };

  const changeMinute = (delta: number) => {
    setMinute(prev => {
      const next = prev + delta;
      if (next < 0) return 59;
      if (next > 59) return 0;
      return next;
    });
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
              difficulty: 'normal',
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
          <Text style={styles.timePreview}>{timePreview}</Text>

          <View style={styles.timeControls}>
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>Hora</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => changeHour(-1)}>
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{hour.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => changeHour(1)}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>Minuto</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => changeMinute(-1)}>
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{minute.toString().padStart(2, '0')}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => changeMinute(1)}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
});