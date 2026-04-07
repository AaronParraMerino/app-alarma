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
import { DAY_LABELS_SHORT, MISSION_ICONS, MISSION_LABELS } from '../../missions/constants/missions';
import { useAlarmStore } from '../store/alarmStore';
import { Alarm } from '../types/alarm.types';

// ─── Utilidades ──────────────────────────────────────────────────────────────

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
  if (
    repeatDays.length === 5 &&
    [1, 2, 3, 4, 5].every(d => repeatDays.includes(d))
  )
    return 'Lun – Vie';
  return repeatDays
    .slice()
    .sort((a, b) => a - b)
    .map(d => DAY_LABELS_SHORT[d])
    .join(' ');
}

/** Minutos hasta la próxima alarma habilitada */
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

// ─── Componente AlarmCard ─────────────────────────────────────────────────────

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onPress: (alarm: Alarm) => void;
  onLongPress: (alarm: Alarm) => void;
}

const AlarmCard = React.memo(
  ({ alarm, onToggle, onPress, onLongPress }: AlarmCardProps) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

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

    const cardStyle = alarm.enabled ? styles.cardEnabled : styles.cardDisabled;

    return (
      <Animated.View style={[styles.cardWrap, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.card, cardStyle]}
          onPress={() => onPress(alarm)}
          onLongPress={() => onLongPress(alarm)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Fila superior: hora + toggle */}
          <View style={styles.cardTop}>
            <View>
              <Text
                style={[
                  styles.alarmTime,
                  !alarm.enabled && styles.textDisabled,
                ]}
              >
                {formatTime(alarm.hour, alarm.minute)}
              </Text>
              {alarm.label.length > 0 && (
                <Text
                  style={[
                    styles.alarmLabel,
                    !alarm.enabled && styles.textMutedDisabled,
                  ]}
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
                false: Colors.muted,
                true: Colors.accentDim,
              }}
              thumbColor={alarm.enabled ? Colors.accent : Colors.textMuted}
              ios_backgroundColor={Colors.muted}
            />
          </View>

          {/* Fila inferior: días + misiones */}
          <View style={styles.cardBottom}>
            <Text
              style={[
                styles.repeatText,
                !alarm.enabled && styles.textMutedDisabled,
              ]}
            >
              {formatRepeat(alarm.repeatDays)}
            </Text>

            <View style={styles.missionRow}>
              {alarm.randomMissions ? (
                <View style={styles.missionBadge}>
                  <Text style={styles.missionBadgeText}>🎲 Aleatorio</Text>
                </View>
              ) : (
                alarm.missions.slice(0, 3).map((m, i) => (
                  <View
                    key={i}
                    style={[
                      styles.missionBadge,
                      !alarm.enabled && styles.missionBadgeDisabled,
                    ]}
                  >
                    <Text style={styles.missionBadgeText}>
                      {MISSION_ICONS[m.type]}
                    </Text>
                  </View>
                ))
              )}
              {!alarm.randomMissions && alarm.missions.length > 3 && (
                <Text style={styles.moreMissions}>
                  +{alarm.missions.length - 3}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

// ─── Banner "próxima alarma" ──────────────────────────────────────────────────

function NextAlarmBanner({ alarms }: { alarms: Alarm[] }) {
  const minutes = useMemo(() => minutesUntilNextAlarm(alarms), [alarms]);
  if (minutes === null) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerLabel}>Próxima alarma en</Text>
      <Text style={styles.bannerTime}>{formatCountdown(minutes)}</Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>⏰</Text>
      <Text style={styles.emptyTitle}>Sin alarmas</Text>
      <Text style={styles.emptySubtitle}>
        Crea tu primera alarma con misiones para despertar de verdad
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>Crear alarma</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { alarms, toggleAlarm, deleteAlarm } = useAlarmStore();

  // TODO: reemplazar con navigation.navigate('AlarmCreate')
  const handleAdd = useCallback(() => {
    Alert.alert('Nueva alarma', 'Pantalla de creación — próximamente');
  }, []);

  const handlePress = useCallback((alarm: Alarm) => {
    // TODO: navigation.navigate('AlarmEdit', { alarmId: alarm.id })
    Alert.alert(alarm.label || 'Alarma', `Editar — próximamente`);
  }, []);

  const handleLongPress = useCallback(
    (alarm: Alarm) => {
      Alert.alert(
        'Eliminar alarma',
        `¿Eliminar "${alarm.label || formatTime(alarm.hour, alarm.minute)}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteAlarm(alarm.id),
          },
        ],
      );
    },
    [deleteAlarm],
  );

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

  // Ordenar: habilitadas primero, luego por hora
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
        <Text style={styles.headerTitle}>Neuro Wake</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => Alert.alert('Perfil', 'Próximamente')}>
          <Text style={styles.headerIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Banner próxima alarma */}
      <NextAlarmBanner alarms={alarms} />

      {/* Lista de alarmas */}
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

      {/* FAB — agregar alarma */}
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 18,
  },

  // Banner
  banner: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.accentDim,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.accent + '33',
  },
  bannerLabel: {
    fontSize: 13,
    color: Colors.accentLight,
    fontWeight: '500',
  },
  bannerTime: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
  },

  // Lista
  list: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },

  // Card
  cardWrap: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardEnabled: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
  },
  cardDisabled: {
    backgroundColor: Colors.bg,
    borderColor: Colors.border,
    opacity: 0.6,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  alarmTime: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 40,
  },
  alarmLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 200,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
  textMutedDisabled: {
    color: Colors.textMuted,
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: Colors.bgCardActive,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  missionBadgeDisabled: {
    opacity: 0.5,
  },
  missionBadgeText: {
    fontSize: 14,
  },
  moreMissions: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 2,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },
});