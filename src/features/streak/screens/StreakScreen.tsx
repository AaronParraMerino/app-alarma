// src/features/streak/screens/StreakScreen.tsx

import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '../../../shared/components/ui/BackButton';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { Layout } from '../../../shared/theme/layout';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

import {
  getStreakSummary,
  getStreakSummaryLocal,
} from '../services/streak';

import {
  AlarmStreakEvent,
  StreakEventType,
  StreakSummary,
} from '../types/streak.types';

type Props = {
  navigation: any;
  route: {
    params?: {
      userId?: string;
    };
  };
};

type WeekDayItem = {
  key: string;
  dayLabel: string;
  dateLabel: string;
  status: StreakEventType | null;
  isToday: boolean;
};

type ProgressMode = 'week' | 'month';

const FROZEN_COLOR = '#38BDF8';

function getDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getDateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatEventDate(dateKey: string, isSpanish: boolean): string {
  const date = getDateFromKey(dateKey);
  return date.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function formatShortDay(date: Date, isSpanish: boolean): string {
  const label = date.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
    weekday: 'short',
  });
  return label
    .replace('.', '')
    .slice(0, 3)
    .replace(/^./, value => value.toUpperCase());
}

function formatShortDate(date: Date, isSpanish: boolean): string {
  return date
    .toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
    })
    .replace('.', '');
}

function getEffectiveEventType(event: AlarmStreakEvent): StreakEventType {
  if (
    event.eventType === 'missed' &&
    !event.alarmId &&
    !event.alarmTime
  ) {
    return 'frozen';
  }

  return event.eventType;
}

function getEventStatusLabel(event: AlarmStreakEvent, isSpanish: boolean): string {
  const eventType = getEffectiveEventType(event);

  if (eventType === 'completed') {
    return isSpanish ? 'Alarma completada' : 'Alarm completed';
  }
  if (eventType === 'frozen') {
    return isSpanish ? 'Racha congelada' : 'Streak frozen';
  }
  return isSpanish ? 'Alarma incompleta' : 'Alarm missed';
}

function getEventIconName(event: AlarmStreakEvent): React.ComponentProps<typeof Ionicons>['name'] {
  const eventType = getEffectiveEventType(event);

  if (eventType === 'completed') return 'checkmark-circle-outline';
  if (eventType === 'frozen') return 'snow-outline';
  return 'close-circle-outline';
}

function buildDayStatusMap(events: AlarmStreakEvent[]): Map<string, StreakEventType> {
  const map = new Map<string, StreakEventType>();
  const priority: Record<StreakEventType, number> = {
    frozen: 1,
    missed: 2,
    completed: 3,
  };

  events.forEach(event => {
    const eventType = getEffectiveEventType(event);
    const current = map.get(event.eventDate);

    if (current && priority[current] >= priority[eventType]) return;

    map.set(event.eventDate, eventType);
  });
  return map;
}

function buildWeekDays(events: AlarmStreakEvent[], isSpanish: boolean): WeekDayItem[] {
  const statusMap = buildDayStatusMap(events);
  const today = new Date();
  return Array.from({ length: 7 }).map((_, index) => {
    const diff = 6 - index;
    const date = new Date(today);
    date.setDate(today.getDate() - diff);
    const key = getDateKey(date);
    return {
      key,
      dayLabel:
        diff === 0
          ? isSpanish ? 'Hoy' : 'Today'
          : formatShortDay(date, isSpanish),
      dateLabel: formatShortDate(date, isSpanish),
      status: statusMap.get(key) ?? null,
      isToday: diff === 0,
    };
  });
}

function buildMonthDays(events: AlarmStreakEvent[], isSpanish: boolean): WeekDayItem[] {
  const statusMap = buildDayStatusMap(events);
  const today = new Date();
  return Array.from({ length: 31 }).map((_, index) => {
    const diff = 30 - index;
    const date = new Date(today);
    date.setDate(today.getDate() - diff);
    const key = getDateKey(date);
    return {
      key,
      dayLabel: String(date.getDate()),
      dateLabel: formatShortDay(date, isSpanish),
      status: statusMap.get(key) ?? null,
      isToday: key === getDateKey(today),
    };
  });
}

function getDayVisual(status: StreakEventType | null, colors: any): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  background: string;
  border: string;
} {
  if (status === 'completed') {
    return {
      icon: 'flame',
      color: colors.warning,
      background: colors.warning + '22',
      border: colors.warning,
    };
  }
  if (status === 'frozen') {
    return {
      icon: 'snow-outline',
      color: FROZEN_COLOR,
      background: FROZEN_COLOR + '24',
      border: FROZEN_COLOR,
    };
  }
  if (status === 'missed') {
    return {
      icon: 'close-outline',
      color: colors.danger,
      background: colors.danger + '18',
      border: colors.danger,
    };
  }
  return {
    icon: 'ellipse-outline',
    color: colors.textMuted,
    background: 'transparent',
    border: colors.border,
  };
}

export default function StreakScreen({ navigation, route }: Props) {
  const { colors, statusBarStyle } = useAppTheme();
  const { language } = useTranslation();

  const isSpanish = language === 'es';
  const userId = route.params?.userId;

  const [summary, setSummary] = useState<StreakSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressMode, setProgressMode] = useState<ProgressMode>('week');
  const hasLoadedSummaryRef = useRef(false);

  const loadSummary = useCallback(
    async (showRefresh = false) => {
      if (!userId) {
        setSummary(null);
        setLoading(false);
        return;
      }
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(!hasLoadedSummaryRef.current);
      }
      try {
        const localData = getStreakSummaryLocal(userId);
        setSummary(localData);
        hasLoadedSummaryRef.current = true;
        setLoading(false);

        const data = await getStreakSummary(userId);
        setSummary(data);
        hasLoadedSummaryRef.current = true;
      } catch (error) {
        console.log('[StreakScreen] Error cargando racha:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadSummary(false);
    }, [loadSummary]),
  );

  const recentEvents = summary?.events.slice(0, 5) ?? [];

  const weekDays = useMemo(
    () => buildWeekDays(summary?.events ?? [], isSpanish),
    [summary?.events, isSpanish],
  );

  const monthDays = useMemo(
    () => buildMonthDays(summary?.events ?? [], isSpanish),
    [summary?.events, isSpanish],
  );

  const currentStreak = summary?.currentStreak ?? 0;
  const bestStreak = summary?.bestStreak ?? 0;
  const successfulAlarms = summary?.successfulAlarms ?? 0;

  const daysToBest = Math.max(bestStreak - currentStreak, 0);

  const heroMessage =
    currentStreak > 0
      ? isSpanish
        ? `Has completado tus alarmas con éxito durante ${currentStreak} días seguidos.`
        : `You have completed your alarms successfully for ${currentStreak} days in a row.`
      : isSpanish
        ? 'Completa una alarma hoy para encender tu racha.'
        : 'Complete an alarm today to start your streak.';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={styles.topBar}>
        <BackButton
          label={isSpanish ? 'Volver' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {isSpanish ? 'Racha' : 'Streak'}
        </Text>
        <View style={styles.rightIcon}>
          <Ionicons name="flame-outline" size={25} color={colors.textMuted} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.warning}
            colors={[colors.warning]}
            onRefresh={() => void loadSummary(true)}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.warning} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              {isSpanish ? 'Cargando racha...' : 'Loading streak...'}
            </Text>
          </View>
        ) : null}

        {!loading ? (
          <>
            <View
              style={[
                styles.heroCard,
                { backgroundColor: colors.bgCard, borderColor: colors.warning + '66' },
              ]}
            >
              <View style={[styles.heroFlameWrap, { backgroundColor: colors.warning + '18' }]}>
                <Ionicons name="flame" size={88} color={colors.warning} />
              </View>

              <View style={styles.heroTextWrap}>
                <View style={styles.heroNumberRow}>
                  <Text style={[styles.heroNumber, { color: colors.warning }]}>
                    {currentStreak}
                  </Text>
                  <Text style={[styles.heroDays, { color: colors.warning }]}>
                    {isSpanish ? 'días' : 'days'}
                  </Text>
                </View>

                <Text style={[styles.heroMessage, { color: colors.textSecondary }]}>
                  {heroMessage}
                </Text>

                <View style={[styles.heroBadge, { backgroundColor: colors.warning + '1E' }]}>
                  <Ionicons name="flame" size={15} color={colors.warning} />
                  <Text style={[styles.heroBadgeText, { color: colors.warning }]}>
                    {currentStreak > 0
                      ? isSpanish ? '¡Sigue encendido!' : 'Keep it burning!'
                      : isSpanish ? 'Empieza hoy' : 'Start today'}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.statsPanel,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <View style={styles.statBox}>
                <View style={[styles.statIconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="time-outline" size={22} color={colors.primary} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {isSpanish ? 'Racha actual' : 'Current streak'}
                </Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {currentStreak}
                  <Text style={styles.statSuffix}> {isSpanish ? 'días' : 'days'}</Text>
                </Text>
              </View>

              <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

              <View style={styles.statBox}>
                <View style={[styles.statIconWrap, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="trophy-outline" size={22} color={colors.warning} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {isSpanish ? 'Mejor racha' : 'Best streak'}
                </Text>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {bestStreak}
                  <Text style={styles.statSuffix}> {isSpanish ? 'días' : 'days'}</Text>
                </Text>
              </View>

              <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

              <View style={styles.statBox}>
                <View style={[styles.statIconWrap, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {isSpanish ? 'Alarmas exitosas' : 'Successful alarms'}
                </Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {successfulAlarms}
                  <Text style={styles.statSuffix}> {isSpanish ? 'veces' : 'times'}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.progressHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isSpanish ? 'Tu progreso' : 'Your progress'}
              </Text>

              <View style={[styles.segmented, { borderColor: colors.border }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setProgressMode('week')}
                  style={[
                    styles.segmentButton,
                    progressMode === 'week' && [
                      styles.segmentActive,
                      { backgroundColor: colors.primary + '22', borderColor: colors.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      progressMode === 'week' ? styles.segmentTextActive : styles.segmentText,
                      { color: progressMode === 'week' ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {isSpanish ? 'Semana' : 'Week'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setProgressMode('month')}
                  style={[
                    styles.segmentButton,
                    progressMode === 'month' && [
                      styles.segmentActive,
                      { backgroundColor: colors.primary + '22', borderColor: colors.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      progressMode === 'month' ? styles.segmentTextActive : styles.segmentText,
                      { color: progressMode === 'month' ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {isSpanish ? 'Mes' : 'Month'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {progressMode === 'week' ? (
              <View style={styles.weekRow}>
                {weekDays.map((day, index) => {
                  const visual = getDayVisual(day.status, colors);
                  return (
                    <View key={day.key} style={styles.weekItem}>
                      <Text style={[styles.weekDayLabel, { color: day.isToday ? colors.text : colors.textMuted }]}>
                        {day.dayLabel}
                      </Text>

                      <View style={styles.circleLineWrap}>
                        {index > 0 ? (
                          <View style={[styles.leftLine, { backgroundColor: day.status ? visual.border : colors.border }]} />
                        ) : null}

                        <View style={[styles.weekCircle, { backgroundColor: visual.background, borderColor: visual.border }]}>
                          <Ionicons name={visual.icon} size={25} color={visual.color} />
                        </View>

                        {index < weekDays.length - 1 ? (
                          <View style={[styles.rightLine, { backgroundColor: day.status ? visual.border : colors.border }]} />
                        ) : null}
                      </View>

                      <Text style={[styles.weekDateLabel, { color: day.isToday ? colors.warning : colors.textMuted }]}>
                        {day.dateLabel}
                      </Text>

                      {day.status === 'frozen' ? (
                        <Text style={[styles.weekStatusLabel, { color: FROZEN_COLOR }]}>
                          {isSpanish ? 'Congelada' : 'Frozen'}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.monthGrid, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                {monthDays.map(day => {
                  const visual = getDayVisual(day.status, colors);
                  return (
                    <View key={day.key} style={styles.monthDayItem}>
                      <Text style={[styles.monthDayNumber, { color: day.isToday ? colors.warning : colors.textSecondary }]}>
                        {day.dayLabel}
                      </Text>
                      <View style={[styles.monthCircle, { backgroundColor: visual.background, borderColor: visual.border }]}>
                        <Ionicons name={visual.icon} size={17} color={visual.color} />
                      </View>
                    </View>
                  );
                })}

                <View style={styles.monthLegend}>
                  <Text style={[styles.monthLegendText, { color: colors.warning }]}>
                    🔥 {isSpanish ? 'Completada' : 'Completed'}
                  </Text>
                  <Text style={[styles.monthLegendText, { color: FROZEN_COLOR }]}>
                    ❄️ {isSpanish ? 'Congelada' : 'Frozen'}
                  </Text>
                  <Text style={[styles.monthLegendText, { color: colors.danger }]}>
                    ✕ {isSpanish ? 'Incompleta' : 'Missed'}
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.messageCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={[styles.messageIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="calendar-outline" size={23} color={colors.primary} />
              </View>
              <View style={styles.messageContent}>
                <Text style={[styles.messageTitle, { color: colors.text }]}>
                  {currentStreak > 0
                    ? isSpanish ? '¡Excelente! Mantén tu racha encendida.' : 'Great! Keep your streak alive.'
                    : isSpanish ? 'Empieza tu racha completando una alarma.' : 'Start your streak by completing an alarm.'}
                </Text>
                <Text style={[styles.messageText, { color: colors.textSecondary }]}>
                  {isSpanish
                    ? 'Completa tus alarmas cada día para seguir creciendo.'
                    : 'Complete your alarms every day to keep growing.'}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.rulesCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <View style={styles.rulesHeader}>
                <View style={[styles.rulesHeaderIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.rulesHeaderText}>
                  <Text style={[styles.rulesTitle, { color: colors.text }]}>
                    {isSpanish ? 'Como funciona tu racha' : 'How your streak works'}
                  </Text>
                  <Text style={[styles.rulesSubtitle, { color: colors.textSecondary }]}>
                    {isSpanish
                      ? 'Solo cuenta cuando una alarma se apaga desde la ejecucion real.'
                      : 'It only counts when an alarm is dismissed from the real alarm flow.'}
                  </Text>
                </View>
              </View>

              <View style={styles.rulesList}>
                <View style={styles.ruleRow}>
                  <View style={[styles.ruleIconWrap, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
                    <Ionicons name="flame" size={18} color={colors.warning} />
                  </View>
                  <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                    {isSpanish
                      ? 'Si completas al menos una alarma del dia, ese dia suma a tu racha.'
                      : 'Completing at least one alarm that day adds it to your streak.'}
                  </Text>
                </View>

                <View style={styles.ruleRow}>
                  <View style={[styles.ruleIconWrap, { backgroundColor: FROZEN_COLOR + '24', borderColor: FROZEN_COLOR }]}>
                    <Ionicons name="snow-outline" size={18} color={FROZEN_COLOR} />
                  </View>
                  <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                    {isSpanish
                      ? 'Si no hay alarma completada ni incompleta, el dia queda congelado y mantiene la racha.'
                      : 'If there is no completed or missed alarm, the day freezes and keeps the streak.'}
                  </Text>
                </View>

                <View style={styles.ruleRow}>
                  <View style={[styles.ruleIconWrap, { backgroundColor: colors.danger + '18', borderColor: colors.danger }]}>
                    <Ionicons name="close-outline" size={18} color={colors.danger} />
                  </View>
                  <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                    {isSpanish
                      ? 'Tras 15 errores aparece No pude resolver. Si el dia termina solo con alarmas incompletas, la racha empieza en 0.'
                      : 'After 15 mistakes, I could not solve it appears. If the day ends only with missed alarms, the streak resets to 0.'}
                  </Text>
                </View>

                <View style={styles.ruleRow}>
                  <View style={[styles.ruleIconWrap, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                    <Ionicons name="school-outline" size={18} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
                    {isSpanish
                      ? 'Practicar misiones no suma ni rompe la racha; solo sirve para aprender.'
                      : 'Practice missions do not add to or break the streak; they are only for learning.'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isSpanish ? 'Actividad reciente' : 'Recent activity'}
            </Text>

            {recentEvents.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <Ionicons name="flame-outline" size={36} color={colors.warning} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {isSpanish ? 'Todavía no hay racha' : 'No streak yet'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {isSpanish
                    ? 'Cuando completes una alarma correctamente, aparecerá aquí.'
                    : 'When you complete an alarm successfully, it will appear here.'}
                </Text>
              </View>
            ) : (
              <View style={[styles.activityCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                {recentEvents.map((event, index) => {
                  const eventType = getEffectiveEventType(event);
                  const isCompleted = eventType === 'completed';
                  const isFrozen = eventType === 'frozen';
                  const eventColor = isCompleted ? colors.success : isFrozen ? FROZEN_COLOR : colors.danger;

                  return (
                    <View key={event.id}>
                      <View style={styles.activityRow}>
                        <Ionicons name={getEventIconName(event)} size={25} color={eventColor} />
                        <Text style={[styles.activityDate, { color: colors.text }]}>
                          {formatEventDate(event.eventDate, isSpanish)}
                        </Text>
                        <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                          {event.alarmTime ?? '--:--'}
                        </Text>
                        <Text numberOfLines={1} style={[styles.activityStatus, { color: eventColor }]}>
                          {getEventStatusLabel(event, isSpanish)}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </View>

                      {index < recentEvents.length - 1 ? (
                        <View style={[styles.activityDivider, { backgroundColor: colors.border }]} />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}

            <View style={[styles.bottomMotivationCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary }]}>
              <View style={[styles.mascotBubble, { backgroundColor: colors.primary + '25' }]}>
                <Ionicons name="happy-outline" size={42} color={colors.primary} />
              </View>

              <View style={styles.bottomMotivationText}>
                <Text style={[styles.bottomMotivationTitle, { color: colors.text }]}>
                  {daysToBest > 0
                    ? isSpanish ? '¡Sigue así!' : 'Keep going!'
                    : isSpanish ? '¡Vas muy bien!' : 'You are doing great!'}
                </Text>

                <Text style={[styles.bottomMotivationDescription, { color: colors.textSecondary }]}>
                  {daysToBest > 0
                    ? isSpanish
                      ? `Te faltan ${daysToBest} días para superar tu mejor racha de ${bestStreak} días.`
                      : `${daysToBest} days left to beat your best streak of ${bestStreak} days.`
                    : isSpanish
                      ? 'Completa tus alarmas para seguir fortaleciendo tus hábitos.'
                      : 'Complete your alarms to keep building stronger habits.'}
                </Text>
              </View>

              <View style={styles.trophyWrap}>
                <Ionicons name="trophy" size={34} color={colors.warning} />
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '800' },
  rightIcon: { width: 76, alignItems: 'flex-end' },
  scroll: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 24,
  },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 44 },
  loadingText: { fontSize: 12, marginTop: 10 },
  heroCard: { borderWidth: 1, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  heroFlameWrap: { width: 116, height: 116, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  heroTextWrap: { flex: 1 },
  heroNumberRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  heroNumber: { fontSize: 58, fontWeight: '900', lineHeight: 64, letterSpacing: -1 },
  heroDays: { fontSize: 28, fontWeight: '900', marginLeft: 8, marginBottom: 8 },
  heroMessage: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  heroBadgeText: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  statsPanel: { borderWidth: 1, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center' },
  statIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  statLabel: { fontSize: 12, textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  statValue: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  statSuffix: { fontSize: 13, fontWeight: '800' },
  verticalDivider: { width: 1, height: 84 },
  rulesCard: { borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 22 },
  rulesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rulesHeaderIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rulesHeaderText: { flex: 1 },
  rulesTitle: { fontSize: 16, fontWeight: '900', marginBottom: 3 },
  rulesSubtitle: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  rulesList: { gap: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'center' },
  ruleIconWrap: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  ruleText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  segmented: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, overflow: 'hidden', alignItems: 'center' },
  segmentButton: { borderRadius: 999 },
  segmentActive: { borderWidth: 1, borderRadius: 999 },
  segmentTextActive: { fontSize: 13, fontWeight: '900', paddingHorizontal: 18, paddingVertical: 8 },
  segmentText: { fontSize: 13, fontWeight: '700', paddingHorizontal: 18, paddingVertical: 8 },
  weekRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  weekItem: { flex: 1, alignItems: 'center' },
  weekDayLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  circleLineWrap: { width: '100%', height: 42, alignItems: 'center', justifyContent: 'center' },
  leftLine: { position: 'absolute', left: 0, right: '50%', height: 3 },
  rightLine: { position: 'absolute', left: '50%', right: 0, height: 3 },
  weekCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  weekDateLabel: { fontSize: 11, fontWeight: '700', marginTop: 7 },
  weekStatusLabel: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  monthGrid: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 },
  monthDayItem: { width: '14.28%', alignItems: 'center', marginBottom: 14 },
  monthDayNumber: { fontSize: 11, fontWeight: '800', marginBottom: 5 },
  monthCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  monthLegend: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  monthLegendText: { fontSize: 11, fontWeight: '800' },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  messageIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  messageContent: { flex: 1 },
  messageTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  messageText: { fontSize: 12, lineHeight: 17 },
  emptyCard: { borderWidth: 1, borderRadius: 20, padding: 22, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  activityCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 18 },
  activityRow: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  activityDate: { width: 86, fontSize: 13, fontWeight: '900', marginLeft: 12 },
  activityTime: { width: 56, fontSize: 13, fontWeight: '600' },
  activityStatus: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '800', marginRight: 8 },
  activityDivider: { height: 1, marginLeft: 52 },
  bottomMotivationCard: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center' },
  mascotBubble: { width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  bottomMotivationText: { flex: 1 },
  bottomMotivationTitle: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
  bottomMotivationDescription: { fontSize: 13, lineHeight: 19 },
  trophyWrap: { width: 38, alignItems: 'center' },
  bottomSpace: { height: 40 },
});
