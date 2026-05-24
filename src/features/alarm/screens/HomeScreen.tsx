// src/features/alarm/screens/HomeScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
  Animated,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { Modal as AppModal } from '../../../shared/components/ui/Modal';

import { DAY_LABELS_SHORT } from '../../missions/constants/missions';
import { useAlarmStore } from '../store/alarmStore';
import { Alarm, MissionType } from '../types/alarm.types';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';
import { getAlarmSoundLabel } from '../services/alarmService';
import {
  getNextAlarmOccurrence,
  shouldShowAlarmSwitchOn,
} from '../utils/repeatSchedule';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const DAY_LABELS_SHORT_EN = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const MISSION_ICON_META: Record<
  MissionType,
  {
    icon: IconName;
    color: string;
  }
> = {
  random: {
    icon: 'shuffle-outline',
    color: Colors.missionColors.random ?? Colors.primaryLight,
  },

  math: {
    icon: 'calculator-outline',
    color: Colors.missionColors.math,
  },

  memory: {
    icon: 'albums-outline',
    color: Colors.missionColors.memory,
  },

  physical: {
    icon: 'footsteps-outline',
    color: Colors.missionColors.physical,
  },

  photo: {
    icon: 'scan-outline',
    color: Colors.missionColors.photo,
  },

  trivia: {
    icon: 'help-circle-outline',
    color: Colors.missionColors.trivia,
  },

  writing: {
    icon: 'create-outline',
    color: Colors.missionColors.writing,
  },

  color: {
    icon: 'color-palette-outline',
    color: Colors.missionColors.color,
  },

  colorFind: {
    icon: 'grid-outline',
    color: Colors.missionColors.colorFind ?? Colors.primaryLight,
  },

  shapes: {
    icon: 'grid-outline',
    color: Colors.missionColors.shapes,
  },

  sequence: {
    icon: 'keypad-outline',
    color: Colors.missionColors.sequence,
  },

  wordCompletion: {
    icon: 'text-outline',
    color: Colors.missionColors.wordCompletion ?? Colors.primaryLight,
  },
};

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(
  hour: number,
  minute: number,
): string {
  return `${padZero(hour)}:${padZero(minute)}`;
}

function formatRepeat(
  repeatDays: number[],
  isSpanish: boolean,
): string {
  if (repeatDays.length === 0) {
    return isSpanish ? 'Solo una vez' : 'Once';
  }

  if (repeatDays.length === 7) {
    return isSpanish ? 'Todos los días' : 'Every day';
  }

  const isWeekdays =
    repeatDays.length === 5 &&
    [1, 2, 3, 4, 5].every((day) =>
      repeatDays.includes(day),
    );

  if (isWeekdays) {
    return isSpanish ? 'Lun – Vie' : 'Mon – Fri';
  }

  const labels = isSpanish
    ? DAY_LABELS_SHORT
    : DAY_LABELS_SHORT_EN;

  return repeatDays
    .slice()
    .sort((a, b) => a - b)
    .map((day) => labels[day])
    .join(' · ');
}

function formatSound(soundUri: string | null): string {
  return getAlarmSoundLabel(soundUri);
}

function minutesUntilNextAlarm(
  alarms: Alarm[],
): number | null {
  const now = new Date();
  let min = Infinity;

  for (const alarm of alarms) {
    const nextOccurrence = getNextAlarmOccurrence(
      alarm,
      now,
    );

    if (!nextOccurrence) {
      continue;
    }

    const diff = Math.ceil(
      (nextOccurrence.getTime() - now.getTime()) / 60_000,
    );

    if (diff < min) {
      min = diff;
    }
  }

  return min === Infinity ? null : min;
}

function formatCountdown(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${mins} min`;
}

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onPress: (alarm: Alarm) => void;
  onLongPress: (alarm: Alarm) => void;
}

const AlarmCard = React.memo(
  ({
    alarm,
    onToggle,
    onPress,
    onLongPress,
  }: AlarmCardProps) => {
    const { colors } = useAppTheme();
    const { language } = useTranslation();

    const isSpanish = language === 'es';
    const scaleAnim = React.useRef(
      new Animated.Value(1),
    ).current;

    const switchOn = shouldShowAlarmSwitchOn(alarm);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.cardWrap,
          {
            transform: [
              {
                scale: scaleAnim,
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.card,
            {
              backgroundColor: switchOn
                ? colors.bgCard
                : colors.bg,
              borderColor: switchOn
                ? colors.border
                : colors.borderMuted,
              opacity: switchOn ? 1 : 0.55,
            },
          ]}
          onPress={() => onPress(alarm)}
          onLongPress={() => onLongPress(alarm)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {switchOn ? (
            <View
              style={[
                styles.cardAccentBar,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            />
          ) : null}

          <View style={styles.cardTop}>
            <View>
              <Text
                style={[
                  styles.alarmTime,
                  {
                    color: switchOn
                      ? colors.cream
                      : colors.textMuted,
                  },
                ]}
              >
                {formatTime(
                  alarm.hour,
                  alarm.minute,
                )}
              </Text>

              {alarm.label.length > 0 ? (
                <Text
                  style={[
                    styles.alarmLabel,
                    {
                      color: switchOn
                        ? colors.textSecondary
                        : colors.textMuted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {alarm.label}
                </Text>
              ) : null}
            </View>

            <Switch
              value={switchOn}
              onValueChange={() => onToggle(alarm.id)}
              trackColor={{
                false: colors.borderFocus + '33',
                true: colors.primary,
              }}
              thumbColor={
                switchOn
                  ? colors.primaryLight
                  : colors.textMuted
              }
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.repeatRow}>
              <Text
                style={[
                  styles.repeatDot,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ◈
              </Text>

              <Text
                style={[
                  styles.repeatText,
                  {
                    color: switchOn
                      ? colors.textSecondary
                      : colors.textMuted,
                  },
                ]}
              >
                {formatRepeat(
                  alarm.repeatDays,
                  isSpanish,
                )}
              </Text>

              <Text
                style={[
                  styles.soundText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {formatSound(alarm.soundUri)}
              </Text>
            </View>

            <View style={styles.missionRow}>
              {alarm.randomMissions ? (
                <View
                  style={[
                    styles.missionBadge,
                    {
                      backgroundColor: colors.bgElevated,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={MISSION_ICON_META.random.icon}
                    size={16}
                    color={MISSION_ICON_META.random.color}
                  />

                  <Text
                    style={[
                      styles.missionBadgeLabel,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {isSpanish ? 'Aleatorio' : 'Random'}
                  </Text>
                </View>
              ) : (
                alarm.missions
                  .slice(0, 3)
                  .map((mission, index) => {
                    const meta =
                      MISSION_ICON_META[mission.type] ??
                      MISSION_ICON_META.random;

                    return (
                      <View
                        key={index}
                        style={[
                          styles.missionBadge,
                          {
                            backgroundColor: colors.bgElevated,
                            borderColor: colors.border,
                            opacity: switchOn ? 1 : 0.4,
                          },
                        ]}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={16}
                          color={meta.color}
                        />
                      </View>
                    );
                  })
              )}

              {!alarm.randomMissions &&
              alarm.missions.length > 3 ? (
                <Text
                  style={[
                    styles.moreMissions,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  +{alarm.missions.length - 3}
                </Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

function NextAlarmBanner({
  alarms,
}: {
  alarms: Alarm[];
}) {
  const { colors } = useAppTheme();
  const { language } = useTranslation();

  const isSpanish = language === 'es';

  const [minutes, setMinutes] =
    useState<number | null>(() =>
      minutesUntilNextAlarm(alarms),
    );

  useEffect(() => {
    const updateMinutes = () => {
      setMinutes(minutesUntilNextAlarm(alarms));
    };

    updateMinutes();

    const now = new Date();

    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 -
      now.getMilliseconds();

    let intervalId:
      | ReturnType<typeof setInterval>
      | undefined;

    const timeoutId = setTimeout(() => {
      updateMinutes();

      intervalId = setInterval(
        updateMinutes,
        60 * 1000,
      );
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [alarms]);

  if (minutes === null) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.primary + '55',
        },
      ]}
    >
      <View>
        <Text
          style={[
            styles.bannerLabel,
            {
              color: colors.textAccent,
            },
          ]}
        >
          {isSpanish ? 'Próxima alarma' : 'Next alarm'}
        </Text>

        <Text
          style={[
            styles.bannerSub,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {isSpanish ? 'Sonará pronto' : 'It will ring soon'}
        </Text>
      </View>

      <View
        style={[
          styles.bannerTimeWrap,
          {
            backgroundColor: colors.primary + '22',
            borderColor: colors.primary + '44',
          },
        ]}
      >
        <Text
          style={[
            styles.bannerTime,
            {
              color: colors.primaryLight,
            },
          ]}
        >
          {formatCountdown(minutes)}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  const { colors } = useAppTheme();
  const { language } = useTranslation();

  const isSpanish = language === 'es';

  return (
    <View style={styles.empty}>
      <View
        style={[
          styles.emptyIconWrap,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={styles.emptyIcon}>⏰</Text>
      </View>

      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {isSpanish ? 'Sin alarmas' : 'No alarms'}
      </Text>

      <Text
        style={[
          styles.emptySubtitle,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {isSpanish
          ? 'Crea tu primera alarma con misiones\npara despertar de verdad'
          : 'Create your first alarm with missions\nto truly wake up'}
      </Text>

      <TouchableOpacity
        style={[
          styles.emptyBtn,
          {
            backgroundColor: colors.primary,
            borderColor: colors.primaryDeep,
          },
        ]}
        onPress={onAdd}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.emptyBtnText,
            {
              color: colors.white,
            },
          ]}
        >
          {isSpanish ? '+ Crear alarma' : '+ Create alarm'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<
        AlarmStackParamList,
        'Home'
      >
    >();

  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

  const { language } = useTranslation();

  const {
    alarms,
    toggleAlarm,
    deleteAlarm,
    reloadAlarms,
  } = useAlarmStore();

  const isSpanish = language === 'es';

  useFocusEffect(
    useCallback(() => {
      reloadAlarms();
    }, [
      reloadAlarms,
    ]),
  );

  const [alarmToDelete, setAlarmToDelete] =
    useState<Alarm | null>(null);

  const handleAdd = useCallback(() => {
    navigation.navigate('AlarmCreate');
  }, [navigation]);

  const handlePress = useCallback(
    (alarm: Alarm) => {
      navigation.navigate('AlarmEdit', {
        alarmId: alarm.id,
      });
    },
    [navigation],
  );

  const handleLongPress = useCallback(
    (alarm: Alarm) => {
      setAlarmToDelete(alarm);
    },
    [],
  );

  const confirmDeleteAlarm = useCallback(() => {
    if (!alarmToDelete) {
      return;
    }

    deleteAlarm(alarmToDelete.id);
    setAlarmToDelete(null);
  }, [
    alarmToDelete,
    deleteAlarm,
  ]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Alarm>) => (
      <AlarmCard
        alarm={item}
        onToggle={toggleAlarm}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    ),
    [
      toggleAlarm,
      handlePress,
      handleLongPress,
    ],
  );

  const keyExtractor = useCallback(
    (item: Alarm) => item.id,
    [],
  );

  const sortedAlarms = useMemo(
    () =>
      [...alarms].sort((a, b) => {
        const aEnabled = shouldShowAlarmSwitchOn(a);
        const bEnabled = shouldShowAlarmSwitchOn(b);

        if (aEnabled !== bEnabled) {
          return aEnabled ? -1 : 1;
        }

        return (
          a.hour * 60 +
          a.minute -
          (b.hour * 60 + b.minute)
        );
      }),
    [alarms],
  );

  const activeAlarmCount = sortedAlarms.filter(
    shouldShowAlarmSwitchOn,
  ).length;

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

      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.headerEyebrow,
              {
                color: colors.textAccent,
              },
            ]}
          >
            {isSpanish ? 'Buenos días' : 'Good morning'}
          </Text>

          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Neuro Wake
          </Text>
        </View>
      </View>

      <NextAlarmBanner alarms={alarms} />

      {sortedAlarms.length > 0 ? (
        <Text
          style={[
            styles.alarmCount,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {isSpanish
            ? `${activeAlarmCount} de ${sortedAlarms.length} activas`
            : `${activeAlarmCount} of ${sortedAlarms.length} active`}
        </Text>
      ) : null}

      {sortedAlarms.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <FlatList
          data={sortedAlarms}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          style={styles.listFrame}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {sortedAlarms.length > 0 ? (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              borderColor: colors.primaryLight + '44',
            },
          ]}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.fabIcon,
              {
                color: colors.white,
              },
            ]}
          >
            +
          </Text>
        </TouchableOpacity>
      ) : null}

      <AppModal
        visible={Boolean(alarmToDelete)}
        type="warning"
        title={
          isSpanish
            ? 'Eliminar alarma'
            : 'Delete alarm'
        }
        message={
          alarmToDelete
            ? isSpanish
              ? `¿Eliminar "${
                  alarmToDelete.label ||
                  formatTime(
                    alarmToDelete.hour,
                    alarmToDelete.minute,
                  )
                }"?`
              : `Delete "${
                  alarmToDelete.label ||
                  formatTime(
                    alarmToDelete.hour,
                    alarmToDelete.minute,
                  )
                }"?`
            : undefined
        }
        closeOnBackdropPress
        onClose={() => setAlarmToDelete(null)}
        cancelAction={{
          label: isSpanish ? 'Cancelar' : 'Cancel',
          onPress: () => setAlarmToDelete(null),
        }}
        confirmAction={{
          label: isSpanish ? 'Eliminar' : 'Delete',
          onPress: confirmDeleteAlarm,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  header: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 10,
  },

  headerEyebrow: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    letterSpacing: -0.5,
  },

  banner: {
    width: '90%',
    maxWidth:
      Layout.maxWideContentWidth -
      Layout.screenPadding * 2,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },

  bannerLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  bannerSub: {
    fontSize: 11,
    marginTop: 2,
  },

  bannerTimeWrap: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  bannerTime: {
    fontSize: 16,
    fontWeight: '700',
  },

  alarmCount: {
    fontSize: 12,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
    fontWeight: '500',
  },

  listFrame: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  cardWrap: {
    marginBottom: 10,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  cardAccentBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  alarmTime: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 42,
  },

  alarmLabel: {
    fontSize: 13,
    marginTop: 3,
    maxWidth: 200,
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  repeatDot: {
    fontSize: 10,
  },

  repeatText: {
    fontSize: 12,
    fontWeight: '500',
  },

  soundText: {
    fontSize: 11,
    marginLeft: 6,
  },

  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  missionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },

  missionBadgeLabel: {
    fontSize: 11,
    fontWeight: '500',
  },

  moreMissions: {
    fontSize: 11,
    marginLeft: 2,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },

  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  emptyBtnText: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderWidth: 1,
  },

  fabIcon: {
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
    marginTop: -2,
  },
});
