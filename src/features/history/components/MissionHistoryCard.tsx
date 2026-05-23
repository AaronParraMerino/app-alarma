// src/features/history/components/MissionHistoryCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

import { MissionHistoryRecord } from '../types/missionHistory.types';
import {
  MISSION_CONFIG,
  DIFFICULTY_CONFIG,
  getMissionLabel,
  getMissionSublabel,
  getDifficultyLabel,
  formatFecha,
  formatContenido,
} from '../constants/missionHistory.config';

interface Props {
  item: MissionHistoryRecord;
}

function getStatusLabel(
  success: boolean,
  isSpanish: boolean,
): string {
  if (success) {
    return isSpanish ? 'completada' : 'completed';
  }

  return isSpanish ? 'fallida' : 'failed';
}

function getErrorLabel(
  errorCount: number,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return `${errorCount} error${errorCount > 1 ? 'es' : ''}`;
  }

  return `${errorCount} error${errorCount > 1 ? 's' : ''}`;
}

export function MissionHistoryCard({
  item,
}: Props) {
  const {
    colors,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';

  const fallbackMissionConfig = {
    label: isSpanish ? 'Misión' : 'Mission',
    labelEn: 'Mission',
    sublabel: isSpanish ? 'Sin descripción' : 'No description',
    sublabelEn: 'No description',
    iconName: '',
    bgColor: colors.bgElevated,
    iconColor: colors.primary,
    failedBg: colors.dangerDim,
  };

  const fallbackDifficultyConfig = {
    label: isSpanish ? 'Sin nivel' : 'No level',
    labelEn: 'No level',
    color: colors.textSecondary,
    bg: colors.bgElevated,
    barColor: colors.textMuted,
  };

  const missionConfig =
    MISSION_CONFIG[item.mission_type] ??
    fallbackMissionConfig;

  const difficultyConfig = item.difficulty
    ? DIFFICULTY_CONFIG[item.difficulty] ??
      fallbackDifficultyConfig
    : fallbackDifficultyConfig;

  const iconBg = item.success
    ? missionConfig.bgColor
    : colors.dangerDim;

  const iconColor = item.success
    ? missionConfig.iconColor
    : colors.danger;

  const detail = formatContenido(
    item.mission_type,
    item.content,
    language,
  );

  const iconText = getMissionIconText(
    item.mission_type,
    missionConfig.iconName,
  );

  const missionLabel = MISSION_CONFIG[item.mission_type]
    ? getMissionLabel(
        item.mission_type,
        language,
      )
    : fallbackMissionConfig.label;

  const missionSublabel = MISSION_CONFIG[item.mission_type]
    ? getMissionSublabel(
        item.mission_type,
        language,
      )
    : fallbackMissionConfig.sublabel;

  const difficultyLabel = getDifficultyLabel(
    item.difficulty,
    language,
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
        !item.success && styles.cardFailed,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: iconBg,
          },
        ]}
      >
        <Text
          style={[
            styles.iconText,
            {
              color: iconColor,
            },
          ]}
        >
          {iconText}
        </Text>
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            {
              color: colors.text,
            },
          ]}
          numberOfLines={1}
        >
          {missionLabel}
        </Text>

        <Text
          style={[
            styles.detalle,
            {
              color: colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {detail || missionSublabel}
        </Text>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: difficultyConfig.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: difficultyConfig.color,
                },
              ]}
            >
              {difficultyLabel}
            </Text>
          </View>

          <Text
            style={[
              styles.estado,
              {
                color: item.success
                  ? colors.textSecondary
                  : colors.danger,
              },
            ]}
            numberOfLines={1}
          >
            {getStatusLabel(
              item.success,
              isSpanish,
            )}
          </Text>

          {item.error_count > 0 ? (
            <Text
              style={[
                styles.errores,
                {
                  color: colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {getErrorLabel(
                item.error_count,
                isSpanish,
              )}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.fecha,
            {
              color: colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {formatFecha(
            item.created_at,
            language,
          )}
        </Text>

        {item.duration_seconds != null ? (
          <Text
            style={[
              styles.duracion,
              {
                color: colors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {item.duration_seconds}s
          </Text>
        ) : null}

        {item.user_answer != null ? (
          <View style={styles.respuestaRow}>
            <Text
              style={[
                styles.respuestaLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {isSpanish ? 'R: ' : 'A: '}
            </Text>

            <Text
              style={[
                styles.respuesta,
                {
                  color: item.success
                    ? colors.textSecondary
                    : colors.danger,
                },
              ]}
              numberOfLines={1}
            >
              {String(item.user_answer)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getMissionIconText(
  missionType: string,
  iconName?: string,
): string {
  const type = String(missionType).toLowerCase();
  const icon = String(iconName ?? '').toLowerCase();

  if (
    type.includes('math') ||
    type.includes('matematica') ||
    icon.includes('calculator')
  ) {
    return 'Σ';
  }

  if (
    type.includes('word') ||
    type.includes('palabra') ||
    icon.includes('pencil') ||
    icon.includes('text')
  ) {
    return 'Aa';
  }

  if (
    type.includes('movement') ||
    type.includes('movimiento') ||
    icon.includes('run') ||
    icon.includes('walk')
  ) {
    return '↯';
  }

  if (
    type.includes('color') ||
    type.includes('figure') ||
    type.includes('figura') ||
    icon.includes('palette') ||
    icon.includes('shape')
  ) {
    return '●';
  }

  return '◎';
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: Layout.screenPadding,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardFailed: {
    opacity: 0.78,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  iconText: {
    fontSize: 22,
    fontWeight: '800',
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
  },

  detalle: {
    fontSize: 12,
    marginTop: 3,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 7,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  estado: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 7,
  },

  errores: {
    fontSize: 12,
  },

  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 10,
    maxWidth: 92,
  },

  fecha: {
    fontSize: 12,
    fontWeight: '500',
  },

  duracion: {
    fontSize: 11,
    marginTop: 4,
  },

  respuestaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    maxWidth: 92,
  },

  respuestaLabel: {
    fontSize: 11,
  },

  respuesta: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
});