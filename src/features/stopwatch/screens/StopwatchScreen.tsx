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

import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

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
  const { colors } = useAppTheme();

  const color = {
    primary: colors.white,
    secondary: colors.textSecondary,
    danger: colors.danger,
  }[variant];

  return (
    <TouchableOpacity
      style={[
        styles.controlButton,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
        variant === 'primary' && {
          backgroundColor: colors.primary,
          borderColor: colors.primaryDeep,
        },
        variant === 'danger' && {
          backgroundColor: colors.dangerDim,
          borderColor: colors.danger + '66',
        },
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
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.lapRow,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.lapIndex,
          {
            backgroundColor: colors.bgElevated,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.lapIndexText, { color: colors.primaryLight }]}>
          {item.index}
        </Text>
      </View>

      <View style={styles.lapColumn}>
        <Text style={[styles.lapLabel, { color: colors.textMuted }]}>
          Parcial
        </Text>
        <Text style={[styles.lapTime, { color: colors.text }]}>
          {formatTime(item.lapTime)}
        </Text>
      </View>

      <View style={styles.lapColumn}>
        <Text style={[styles.lapLabel, { color: colors.textMuted }]}>
          Total
        </Text>
        <Text style={[styles.lapTotal, { color: colors.primaryLight }]}>
          {formatTime(item.totalTime)}
        </Text>
      </View>
    </View>
  );
}

export default function StopwatchScreen() {
  const { colors, statusBarStyle } = useAppTheme();

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
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Cronometro</Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isRunning ? colors.successDim : colors.bgCard,
              borderColor: isRunning ? colors.success : colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isRunning ? colors.success : colors.textMuted,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: isRunning ? colors.success : colors.textSecondary,
              },
            ]}
          >
            {isRunning ? 'En marcha' : status === 'paused' ? 'Pausado' : 'Listo'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.timerPanel,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.primary + '33',
          },
        ]}
      >
        <View
          style={[
            styles.timerIconWrap,
            {
              backgroundColor: colors.accentGlow,
              borderColor: colors.primary + '55',
            },
          ]}
        >
          <Ionicons name="timer-outline" size={30} color={colors.primaryLight} />
        </View>

        <Text style={[styles.timer, { color: colors.text }]}>
          {formatTime(elapsed)}
        </Text>

        <Text style={[styles.timerHint, { color: colors.textSecondary }]}>
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

      <View
        style={[
          styles.summaryRow,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Ultimo parcial
          </Text>

          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {laps[0] ? formatTime(laps[0].lapTime) : '--:--.--'}
          </Text>
        </View>

        <View
          style={[
            styles.summaryDivider,
            {
              backgroundColor: colors.borderMuted,
            },
          ]}
        />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Tiempo total
          </Text>

          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatTime(elapsed)}
          </Text>
        </View>
      </View>

      <View style={styles.lapsHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Parciales
        </Text>

        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {laps.length}
        </Text>
      </View>

      <FlatList
        data={laps}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <LapRow item={item} />}
        style={styles.lapsFrame}
        contentContainerStyle={[
          styles.lapsList,
          laps.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={28} color={colors.textMuted} />

            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              Sin parciales todavia
            </Text>

            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
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
  },

  header: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  timerPanel: {
    width: '90%',
    maxWidth: Layout.maxWideContentWidth - Layout.screenPadding * 2,
    alignSelf: 'center',
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 28,
    alignItems: 'center',
  },

  timerIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  timer: {
    fontSize: 48,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },

  timerHint: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },

  controls: {
    flexDirection: 'row',
    gap: 10,
    width: '90%',
    maxWidth: Layout.maxWideContentWidth - Layout.screenPadding * 2,
    alignSelf: 'center',
    marginTop: 14,
  },

  controlButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
    width: '90%',
    maxWidth: Layout.maxWideContentWidth - Layout.screenPadding * 2,
    alignSelf: 'center',
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
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
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  lapsHeader: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginTop: 22,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  sectionCount: {
    fontSize: 12,
    fontWeight: '800',
  },

  lapsList: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 8,
  },

  lapsFrame: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
  },

  emptyList: {
    flexGrow: 1,
  },

  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },

  lapIndex: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lapIndexText: {
    fontSize: 13,
    fontWeight: '800',
  },

  lapColumn: {
    flex: 1,
    gap: 2,
  },

  lapLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  lapTime: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  lapTotal: {
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
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 5,
  },
});
