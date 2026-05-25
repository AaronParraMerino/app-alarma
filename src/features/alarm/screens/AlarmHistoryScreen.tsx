// src/features/alarm/screens/AlarmHistoryScreen.tsx
import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Layout } from '../../../shared/theme/layout';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

import {
  getAlarmHistoryCloud,
  getAlarmHistoryLocal,
  insertAlarmHistoryLocal,
} from '../services/alarmHistory';

import {
  ALARM_HISTORY_ACTION_LABELS,
  ALARM_HISTORY_STATUS_LABELS,
  AlarmHistoryAction,
  AlarmHistoryEvent,
} from '../types/alarmHistory.types';

type Props = {
  navigation: any;
  route: {
    params?: {
      userId?: string;
    };
  };
};

type HistorySection = {
  title: string;
  data: AlarmHistoryEvent[];
};

function formatAlarmTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
}

function getActionIcon(action: AlarmHistoryAction) {
  if (action === 'disabled') return 'notifications-off-outline';
  if (action === 'updated') return 'pencil-outline';
  if (action === 'deleted') return 'trash-outline';
  return 'alarm-outline';
}

function getMissionName(event: AlarmHistoryEvent): string {
  if (event.randomMissions) {
    return 'Misión aleatoria';
  }

  if (!event.missions || event.missions.length === 0) {
    return 'Sin misión';
  }

  const firstMission = event.missions[0] as any;

  const rawName =
    firstMission?.title ??
    firstMission?.name ??
    firstMission?.label ??
    firstMission?.missionName ??
    firstMission?.mission_type ??
    firstMission?.missionType ??
    firstMission?.type ??
    firstMission?.id ??
    '';

  const normalized = String(rawName).toLowerCase();

  let missionName = String(rawName || '').trim();

  if (
    normalized.includes('color') ||
    normalized.includes('figure') ||
    normalized.includes('figura')
  ) {
    missionName = 'Figuras de colores';
  } else if (
    normalized.includes('math') ||
    normalized.includes('matem')
  ) {
    missionName = 'Matemáticas';
  } else if (
    normalized.includes('word') ||
    normalized.includes('palabra')
  ) {
    missionName = 'Palabras';
  } else if (
    normalized.includes('object') ||
    normalized.includes('objeto')
  ) {
    missionName = 'Reconocimiento de objetos';
  }

  if (!missionName) {
    missionName = 'Misión configurada';
  }

  if (event.missions.length > 1) {
    return `${missionName} +${event.missions.length - 1}`;
  }

  return missionName;
}

function mergeHistoryEvents(
  localEvents: AlarmHistoryEvent[],
  cloudEvents: AlarmHistoryEvent[],
): AlarmHistoryEvent[] {
  const map = new Map<string, AlarmHistoryEvent>();

  localEvents.forEach(event => {
    map.set(event.id, event);
  });

  cloudEvents.forEach(event => {
    map.set(event.id, event);
  });

  return Array.from(map.values()).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

function getSectionTitle(createdAt: number): string {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const eventDate = new Date(createdAt);

  const eventDay = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  );

  const diffDays = Math.floor(
    (today.getTime() - eventDay.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays <= 6) return 'Esta semana';

  return 'Anteriores';
}

function groupHistoryEvents(
  events: AlarmHistoryEvent[],
): HistorySection[] {
  const order = [
    'Hoy',
    'Ayer',
    'Esta semana',
    'Anteriores',
  ];

  const groups = new Map<string, AlarmHistoryEvent[]>();

  events.forEach(event => {
    const title = getSectionTitle(event.createdAt);
    const current = groups.get(title) ?? [];

    groups.set(title, [
      ...current,
      event,
    ]);
  });

  return order
    .filter(title => groups.has(title))
    .map(title => ({
      title,
      data: groups.get(title) ?? [],
    }));
}

export default function AlarmHistoryScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';
  const userId = route.params?.userId;

  const [history, setHistory] = useState<AlarmHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(
    async (refresh = false) => {
      if (!userId) {
        setHistory([]);
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const localEvents = getAlarmHistoryLocal(userId);
        setHistory(localEvents);

        const cloudEvents = await getAlarmHistoryCloud(userId);

        cloudEvents.forEach(event => {
          insertAlarmHistoryLocal(event, {
            synced: true,
          });
        });

        const mergedEvents = mergeHistoryEvents(
          localEvents,
          cloudEvents,
        );

        setHistory(mergedEvents);
      } catch (error) {
        console.log(
          '[AlarmHistoryScreen] Error cargando historial:',
          error,
        );

        try {
          const localEvents = getAlarmHistoryLocal(userId);
          setHistory(localEvents);
        } catch (localError) {
          console.log(
            '[AlarmHistoryScreen] Error cargando historial local:',
            localError,
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadHistory(false);
    }, [loadHistory]),
  );

  const sections = useMemo(
    () => groupHistoryEvents(history),
    [history],
  );

  const stats = useMemo(() => {
    return {
      created: history.filter(event => event.action === 'created').length,
      enabled: history.filter(event => event.action === 'enabled').length,
      disabled: history.filter(event => event.action === 'disabled').length,
    };
  }, [history]);

  const getActionColor = (action: AlarmHistoryAction): string => {
    if (action === 'deleted') return colors.danger;
    if (action === 'disabled') return colors.textMuted;
    if (action === 'updated') return colors.warning;

    return colors.primary;
  };

  const renderHistoryItem = (event: AlarmHistoryEvent) => {
    const actionColor = getActionColor(event.action);

    const eventDate = new Date(event.createdAt);

    const dateText = eventDate.toLocaleDateString(
      isSpanish ? 'es-ES' : 'en-US',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );

    const hourText = eventDate.toLocaleTimeString(
      isSpanish ? 'es-ES' : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    return (
      <View
        key={event.id}
        style={[
          styles.historyCard,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.historyIcon,
            {
              backgroundColor: `${actionColor}18`,
            },
          ]}
        >
          <Ionicons
            name={getActionIcon(event.action) as any}
            size={24}
            color={actionColor}
          />
        </View>

        <View style={styles.historyContent}>
          <Text
            style={[
              styles.historyTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {ALARM_HISTORY_ACTION_LABELS[event.action]}
          </Text>

          <Text
            style={[
              styles.historyTime,
              {
                color: colors.text,
              },
            ]}
          >
            {formatAlarmTime(event.hour, event.minute)}
          </Text>

          <Text
            style={[
              styles.historyMeta,
              {
                color: colors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {dateText} • {hourText}
          </Text>

          <Text
            style={[
              styles.historyMission,
              {
                color: colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            Misión: {getMissionName(event)}
          </Text>
        </View>

        <View style={styles.historyRight}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: `${actionColor}18`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: actionColor,
                },
              ]}
            >
              {ALARM_HISTORY_STATUS_LABELS[event.action]}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={colors.primary}
          />

          <Text
            style={[
              styles.backText,
              {
                color: colors.primary,
              },
            ]}
          >
            {isSpanish ? 'Volver' : 'Back'}
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish ? 'Historial de alarmas' : 'Alarm history'}
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[
              colors.primary,
            ]}
            tintColor={colors.primary}
            onRefresh={() => void loadHistory(true)}
          />
        }
      >
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Creadas
            </Text>

            <Text
              style={[
                styles.summaryValue,
                {
                  color: colors.primary,
                },
              ]}
            >
              {stats.created}
            </Text>
          </View>

          <View
            style={[
              styles.summaryDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Activadas
            </Text>

            <Text
              style={[
                styles.summaryValue,
                {
                  color: colors.primary,
                },
              ]}
            >
              {stats.enabled}
            </Text>
          </View>

          <View
            style={[
              styles.summaryDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Desactivadas
            </Text>

            <Text
              style={[
                styles.summaryValue,
                {
                  color: colors.primary,
                },
              ]}
            >
              {stats.disabled}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Cargando historial...
            </Text>
          </View>
        ) : null}

        {!loading && history.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="alarm-outline"
              size={36}
              color={colors.primary}
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Todavía no hay historial
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Cuando crees, actives, desactives, edites o elimines alarmas,
              aparecerán aquí.
            </Text>
          </View>
        ) : null}

        {!loading
          ? sections.map(section => (
              <View
                key={section.title}
                style={styles.section}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {section.title}
                </Text>

                {section.data.map(renderHistoryItem)}
              </View>
            ))
          : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 82,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backText: {
    fontSize: 14,
    fontWeight: '700',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },

  headerSpace: {
    width: 82,
  },

  scroll: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 24,
  },

  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 22,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
  },

  summaryDivider: {
    width: 1,
    height: 42,
  },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },

  historyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  historyIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  historyContent: {
    flex: 1,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },

  historyTime: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  historyMeta: {
    fontSize: 11,
    marginTop: 2,
  },

  historyMission: {
    fontSize: 11,
    marginTop: 2,
  },

  historyRight: {
    marginLeft: 8,
    alignSelf: 'flex-start',
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  bottomSpace: {
    height: 40,
  },
});