// src/features/stopwatch/screens/StopwatchScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';

type StopwatchStatus = 'idle' | 'running' | 'paused';

type Lap = {
  id: string;
  index: number;
  lapTime: number;
  totalTime: number;
};

function formatTime(ms: number): string {
  const totalCentiseconds = Math.floor(ms / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cc = String(centiseconds).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}.${cc}`;
  }

  return `${mm}:${ss}.${cc}`;
}

function ControlButton({
  icon,
  label,
  onPress,
  disabled = false,
  variant = 'secondary',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const color = {
    primary: Colors.white,
    secondary: Colors.textSecondary,
    danger: Colors.danger,
  }[variant];

  return (
    <TouchableOpacity
      style={[
        styles.controlButton,
        variant === 'primary' && styles.controlButtonPrimary,
        variant === 'danger' && styles.controlButtonDanger,
        disabled && styles.controlButtonDisabled,
      ]}
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[styles.controlText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function LapRow({ item }: { item: Lap }) {
  return (
    <View style={styles.lapRow}>
      <View style={styles.lapIndex}>
        <Text style={styles.lapIndexText}>{item.index}</Text>
      </View>

      <View style={styles.lapColumn}>
        <Text style={styles.lapLabel}>Parcial</Text>
        <Text style={styles.lapTime}>{formatTime(item.lapTime)}</Text>
      </View>

      <View style={styles.lapColumn}>
        <Text style={styles.lapLabel}>Total</Text>
        <Text style={styles.lapTotal}>{formatTime(item.totalTime)}</Text>
      </View>
    </View>
  );
}

export default function StopwatchScreen() {
  const [status, setStatus] = useState<StopwatchStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  const isRunning = status === 'running';
  const hasTime = elapsed > 0 || laps.length > 0;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (startTimeRef.current === null) return;

      setElapsed(accumulatedRef.current + Date.now() - startTimeRef.current);
    }, 30);

    return () => clearInterval(interval);
  }, [isRunning]);

  const lastLapTime = useMemo(() => {
    if (laps.length === 0) return 0;
    return laps[0].totalTime;
  }, [laps]);

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setStatus('running');
  };

  const handlePause = () => {
    accumulatedRef.current = elapsed;
    startTimeRef.current = null;
    setStatus('paused');
  };

  const handleResume = () => {
    startTimeRef.current = Date.now();
    setStatus('running');
  };

  const handleReset = () => {
    startTimeRef.current = null;
    accumulatedRef.current = 0;
    setElapsed(0);
    setLaps([]);
    setStatus('idle');
  };

  const handleLap = () => {
    if (!hasTime) return;

    const nextIndex = laps.length + 1;
    const lapTime = elapsed - lastLapTime;

    setLaps(current => [
      {
        id: `${Date.now()}-${nextIndex}`,
        index: nextIndex,
        lapTime,
        totalTime: elapsed,
      },
      ...current,
    ]);
  };

  const primaryAction = isRunning
    ? { label: 'Pausar', icon: 'pause' as const, onPress: handlePause }
    : status === 'paused'
      ? { label: 'Reanudar', icon: 'play' as const, onPress: handleResume }
      : { label: 'Iniciar', icon: 'play' as const, onPress: handleStart };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={Colors.bg} barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Cronometro</Text>
        <View style={[styles.statusBadge, isRunning && styles.statusBadgeActive]}>
          <View style={[styles.statusDot, isRunning && styles.statusDotActive]} />
          <Text style={[styles.statusText, isRunning && styles.statusTextActive]}>
            {isRunning ? 'En marcha' : status === 'paused' ? 'Pausado' : 'Listo'}
          </Text>
        </View>
      </View>

      <View style={styles.timerPanel}>
        <View style={styles.timerIconWrap}>
          <Ionicons name="timer-outline" size={30} color={Colors.primaryLight} />
        </View>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <Text style={styles.timerHint}>
          {laps.length > 0
            ? `${laps.length} parciales registrados`
            : 'Registra parciales mientras el cronometro avanza'}
        </Text>
      </View>

      <View style={styles.controls}>
        <ControlButton
          icon="flag-outline"
          label="Parcial"
          onPress={handleLap}
          disabled={!hasTime}
        />
        <ControlButton
          icon={primaryAction.icon}
          label={primaryAction.label}
          onPress={primaryAction.onPress}
          variant="primary"
        />
        <ControlButton
          icon="refresh-outline"
          label="Reset"
          onPress={handleReset}
          disabled={!hasTime}
          variant="danger"
        />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ultimo parcial</Text>
          <Text style={styles.summaryValue}>
            {laps[0] ? formatTime(laps[0].lapTime) : '--:--.--'}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tiempo total</Text>
          <Text style={styles.summaryValue}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      <View style={styles.lapsHeader}>
        <Text style={styles.sectionTitle}>Parciales</Text>
        <Text style={styles.sectionCount}>{laps.length}</Text>
      </View>

      <FlatList
        data={laps}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <LapRow item={item} />}
        contentContainerStyle={[
          styles.lapsList,
          laps.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Sin parciales todavia</Text>
            <Text style={styles.emptyText}>
              Toca Parcial para guardar el tiempo del tramo actual.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusBadgeActive: {
    backgroundColor: Colors.successDim,
    borderColor: Colors.success,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextActive: {
    color: Colors.success,
  },
  timerPanel: {
    marginHorizontal: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    paddingHorizontal: 18,
    paddingVertical: 28,
    alignItems: 'center',
  },
  timerIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  timer: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timerHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
  },
  controlButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  controlButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDeep,
  },
  controlButtonDanger: {
    backgroundColor: Colors.dangerDim,
    borderColor: Colors.danger + '66',
  },
  controlButtonDisabled: {
    opacity: 0.42,
  },
  controlText: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderMuted,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  lapsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 8,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCount: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  lapsList: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  lapIndex: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lapIndexText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '800',
  },
  lapColumn: {
    flex: 1,
    gap: 2,
  },
  lapLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lapTime: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  lapTotal: {
    color: Colors.primaryLight,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 24,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 5,
  },
});
