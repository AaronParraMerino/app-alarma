import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Animated,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { Colors } from '../../../shared/theme/colors';
import { DAY_LABELS_SHORT, MISSION_ICONS } from '../../missions/constants/missions';
import { useAlarmStore } from '../store/alarmStore';
import { Alarm } from '../types/alarm.types';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${padZero(h)}:${padZero(minute)} ${ampm}`;
}

function formatRepeat(repeatDays: number[]): string {
  if (repeatDays.length === 0) return 'Solo una vez';
  if (repeatDays.length === 7) return 'Todos los días';
  if (repeatDays.length === 5 && [1, 2, 3, 4, 5].every(d => repeatDays.includes(d)))
    return 'Lun – Vie';
  return repeatDays
    .slice()
    .sort((a, b) => a - b)
    .map(d => DAY_LABELS_SHORT[d])
    .join(' · ');
}

function minutesUntilNextAlarm(alarms: Alarm[]): number | null {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const enabled = alarms.filter(a => a.enabled);
  if (enabled.length === 0) return null;
  let min = Infinity;
  for (const alarm of enabled) {
    const alarmMin = alarm.hour * 60 + alarm.minute;
    let diff = alarmMin - nowMin;
    if (diff <= 0) diff += 24 * 60;
    if (diff < min) min = diff;
  }
  return min === Infinity ? null : min;
}

function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// ─── AlarmCard ────────────────────────────────────────────────────────────────

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onPress: (alarm: Alarm) => void;
  onLongPress: (alarm: Alarm) => void;
}

const AlarmCard = React.memo(({ alarm, onToggle, onPress, onLongPress }: AlarmCardProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.card, alarm.enabled ? styles.cardEnabled : styles.cardDisabled]}
        onPress={() => onPress(alarm)}
        onLongPress={() => onLongPress(alarm)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Línea de acento izquierda cuando está activa */}
        {alarm.enabled && <View style={styles.cardAccentBar} />}

        {/* Hora + toggle */}
        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.alarmTime, !alarm.enabled && styles.textDisabled]}>
              {formatTime(alarm.hour, alarm.minute)}
            </Text>
            {alarm.label.length > 0 && (
              <Text
                style={[styles.alarmLabel, !alarm.enabled && styles.textMutedDisabled]}
                numberOfLines={1}
              >
                {alarm.label}
              </Text>
            )}
          </View>

          <Switch
            value={alarm.enabled}
            onValueChange={() => onToggle(alarm.id)}
            trackColor={{
              false: Colors.borderFocus + '33',
              true: Colors.primary,
            }}
            thumbColor={alarm.enabled ? Colors.primaryLight : Colors.textMuted}
            ios_backgroundColor={Colors.border}
          />
        </View>

        {/* Días + misiones */}
        <View style={styles.cardBottom}>
          <View style={styles.repeatRow}>
            <Text style={styles.repeatDot}>◈</Text>
            <Text style={[styles.repeatText, !alarm.enabled && styles.textMutedDisabled]}>
              {formatRepeat(alarm.repeatDays)}
            </Text>
          </View>

          <View style={styles.missionRow}>
            {alarm.randomMissions ? (
              <View style={styles.missionBadge}>
                <Text style={styles.missionBadgeText}>🎲</Text>
                <Text style={styles.missionBadgeLabel}>Aleatorio</Text>
              </View>
            ) : (
              alarm.missions.slice(0, 3).map((m, i) => (
                <View key={i} style={[styles.missionBadge, !alarm.enabled && { opacity: 0.4 }]}>
                  <Text style={styles.missionBadgeText}>{MISSION_ICONS[m.type]}</Text>
                </View>
              ))
            )}
            {!alarm.randomMissions && alarm.missions.length > 3 && (
              <Text style={styles.moreMissions}>+{alarm.missions.length - 3}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Banner próxima alarma ────────────────────────────────────────────────────

function NextAlarmBanner({ alarms }: { alarms: Alarm[] }) {
  const minutes = useMemo(() => minutesUntilNextAlarm(alarms), [alarms]);
  if (minutes === null) return null;

  return (
    <View style={styles.banner}>
      <View>
        <Text style={styles.bannerLabel}>Próxima alarma</Text>
        <Text style={styles.bannerSub}>Sonará pronto</Text>
      </View>
      <View style={styles.bannerTimeWrap}>
        <Text style={styles.bannerTime}>{formatCountdown(minutes)}</Text>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>⏰</Text>
      </View>
      <Text style={styles.emptyTitle}>Sin alarmas</Text>
      <Text style={styles.emptySubtitle}>
        Crea tu primera alarma con misiones{'\n'}para despertar de verdad
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd} activeOpacity={0.85}>
        <Text style={styles.emptyBtnText}>+ Crear alarma</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { alarms, toggleAlarm, deleteAlarm } = useAlarmStore();

  const handleAdd = useCallback(() => {
    Alert.alert('Nueva alarma', 'Pantalla de creación — próximamente');
  }, []);

  const handlePress = useCallback((alarm: Alarm) => {
    Alert.alert(alarm.label || 'Alarma', 'Editar — próximamente');
  }, []);

  const handleLongPress = useCallback((alarm: Alarm) => {
    Alert.alert(
      'Eliminar alarma',
      `¿Eliminar "${alarm.label || formatTime(alarm.hour, alarm.minute)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteAlarm(alarm.id) },
      ],
    );
  }, [deleteAlarm]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Alarm>) => (
      <AlarmCard
        alarm={item}
        onToggle={toggleAlarm}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    ),
    [toggleAlarm, handlePress, handleLongPress],
  );

  const keyExtractor = useCallback((item: Alarm) => item.id, []);

  const sortedAlarms = useMemo(
    () =>
      [...alarms].sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
      }),
    [alarms],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.bg} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Buenos días</Text>
          <Text style={styles.headerTitle}>Neuro Wake</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => Alert.alert('Perfil', 'Próximamente')}
        >
          <Text style={styles.headerIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <NextAlarmBanner alarms={alarms} />

      {/* Contador */}
      {sortedAlarms.length > 0 && (
        <Text style={styles.alarmCount}>
          {sortedAlarms.filter(a => a.enabled).length} de {sortedAlarms.length} activas
        </Text>
      )}

      {/* Lista */}
      {sortedAlarms.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <FlatList
          data={sortedAlarms}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {sortedAlarms.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerEyebrow: {
    fontSize: 12,
    color: Colors.textAccent,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: { fontSize: 18 },

  // Banner
  banner: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.primary + '55',
  },
  bannerLabel: {
    fontSize: 13,
    color: Colors.textAccent,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bannerTimeWrap: {
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  bannerTime: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryLight,
  },

  // Contador
  alarmCount: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 20,
    marginBottom: 8,
    fontWeight: '500',
  },

  // Lista
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Card
  cardWrap: { marginBottom: 10 },
  card: {
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardEnabled: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
  },
  cardDisabled: {
    backgroundColor: Colors.bg,
    borderColor: Colors.borderMuted,
    opacity: 0.55,
  },
  cardAccentBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: Colors.primary,
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
    color: Colors.cream,
    letterSpacing: -1,
    lineHeight: 42,
  },
  alarmLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    maxWidth: 200,
  },
  textDisabled: { color: Colors.textMuted },
  textMutedDisabled: { color: Colors.textMuted },

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
    color: Colors.primary,
  },
  repeatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
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
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  missionBadgeText: { fontSize: 13 },
  missionBadgeLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  moreMissions: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 2,
  },

  // Empty state
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
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
  },
  emptyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '44',
  },
  fabIcon: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
    marginTop: -2,
  },
});