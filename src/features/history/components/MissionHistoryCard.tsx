// src/features/history/components/MissionHistoryCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../../shared/theme/colors';
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

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type MissionIconMeta = {
  icon: IconName;
  color: string;
};

const MISSION_ICON_META: Record<string, MissionIconMeta> = {
  random: {
    icon: 'shuffle-outline',
    color: Colors.missionColors.random ?? Colors.primaryLight,
  },

  math: {
    icon: 'calculator-outline',
    color: Colors.missionColors.math ?? Colors.primaryLight,
  },

  memory: {
    icon: 'albums-outline',
    color: Colors.missionColors.memory ?? Colors.primaryLight,
  },

  physical: {
    icon: 'footsteps-outline',
    color: Colors.missionColors.physical ?? Colors.primaryLight,
  },

  movement: {
    icon: 'footsteps-outline',
    color: Colors.missionColors.physical ?? Colors.primaryLight,
  },

  photo: {
    icon: 'scan-outline',
    color: Colors.missionColors.photo ?? Colors.primaryLight,
  },

  object: {
    icon: 'scan-outline',
    color: Colors.missionColors.photo ?? Colors.primaryLight,
  },

  trivia: {
    icon: 'help-circle-outline',
    color: Colors.missionColors.trivia ?? Colors.primaryLight,
  },

  writing: {
    icon: 'create-outline',
    color: Colors.missionColors.writing ?? Colors.primaryLight,
  },

  color: {
    icon: 'color-palette-outline',
    color: Colors.missionColors.color ?? Colors.primaryLight,
  },

  colorFind: {
    icon: 'grid-outline',
    color: Colors.missionColors.colorFind ?? Colors.primaryLight,
  },

  shapes: {
    icon: 'grid-outline',
    color: Colors.missionColors.shapes ?? Colors.primaryLight,
  },

  sequence: {
    icon: 'keypad-outline',
    color: Colors.missionColors.sequence ?? Colors.primaryLight,
  },

  wordCompletion: {
    icon: 'text-outline',
    color: Colors.missionColors.wordCompletion ?? Colors.primaryLight,
  },
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getMissionIconMeta(
  missionType: string,
  iconName?: string,
): MissionIconMeta {
  const type = normalizeText(missionType);
  const icon = normalizeText(String(iconName ?? ''));

  if (
    type.includes('random') ||
    type.includes('aleatorio') ||
    icon.includes('shuffle')
  ) {
    return MISSION_ICON_META.random;
  }

  if (
    type.includes('math') ||
    type.includes('matematica') ||
    icon.includes('calculator')
  ) {
    return MISSION_ICON_META.math;
  }

  if (
    type.includes('word') ||
    type.includes('palabra') ||
    type.includes('completion') ||
    icon.includes('text')
  ) {
    return MISSION_ICON_META.wordCompletion;
  }

  if (
    type.includes('movement') ||
    type.includes('physical') ||
    type.includes('movimiento') ||
    icon.includes('footsteps')
  ) {
    return MISSION_ICON_META.physical;
  }

  if (
    type.includes('colorfind') ||
    type.includes('color_find') ||
    type.includes('different') ||
    type.includes('diferente') ||
    icon.includes('grid')
  ) {
    return MISSION_ICON_META.colorFind;
  }

  if (
    type.includes('color') ||
    type.includes('colored') ||
    type.includes('figure') ||
    type.includes('figura') ||
    icon.includes('palette')
  ) {
    return MISSION_ICON_META.color;
  }

  if (
    type.includes('photo') ||
    type.includes('object') ||
    type.includes('objeto') ||
    icon.includes('scan')
  ) {
    return MISSION_ICON_META.photo;
  }

  if (
    type.includes('memory') ||
    type.includes('memoria') ||
    icon.includes('albums')
  ) {
    return MISSION_ICON_META.memory;
  }

  if (
    type.includes('trivia') ||
    type.includes('pregunta') ||
    icon.includes('help')
  ) {
    return MISSION_ICON_META.trivia;
  }

  if (
    type.includes('writing') ||
    type.includes('escritura') ||
    icon.includes('create')
  ) {
    return MISSION_ICON_META.writing;
  }

  if (
    type.includes('sequence') ||
    type.includes('secuencia') ||
    icon.includes('keypad')
  ) {
    return MISSION_ICON_META.sequence;
  }

  return {
    icon: 'apps-outline',
    color: Colors.primaryLight,
  };
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

  const iconMeta = getMissionIconMeta(
    String(item.mission_type),
    missionConfig.iconName,
  );

  const iconBg = item.success
    ? iconMeta.color + '18'
    : colors.dangerDim;

  const iconColor = item.success
    ? iconMeta.color
    : colors.danger;

  const detail = formatContenido(
    item.mission_type,
    item.content,
    language,
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
          borderColor: item.success
            ? colors.border
            : colors.danger + '55',
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
        <Ionicons
          name={iconMeta.icon}
          size={24}
          color={iconColor}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
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

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: item.success
                  ? colors.success + '18'
                  : colors.danger + '18',
              },
            ]}
          >
            <Ionicons
              name={
                item.success
                  ? 'checkmark-circle-outline'
                  : 'close-circle-outline'
              }
              size={13}
              color={item.success ? colors.success : colors.danger}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: item.success ? colors.success : colors.danger,
                },
              ]}
            >
              {getStatusLabel(item.success, isSpanish)}
            </Text>
          </View>
        </View>

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
              styles.difficultyPill,
              {
                backgroundColor: difficultyConfig.bg,
              },
            ]}
          >
            <View
              style={[
                styles.difficultyDot,
                {
                  backgroundColor: difficultyConfig.barColor,
                },
              ]}
            />

            <Text
              style={[
                styles.difficultyText,
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
              styles.metaText,
              {
                color: colors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {formatFecha(item.created_at, language)}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <Ionicons
              name="close-circle-outline"
              size={13}
              color={item.error_count > 0 ? colors.danger : colors.textMuted}
            />

            <Text
              style={[
                styles.footerText,
                {
                  color: item.error_count > 0
                    ? colors.danger
                    : colors.textMuted,
                },
              ]}
            >
              {getErrorLabel(item.error_count ?? 0, isSpanish)}
            </Text>
          </View>

          {typeof item.duration_seconds === 'number' ? (
            <View style={styles.footerItem}>
              <Ionicons
                name="timer-outline"
                size={13}
                color={colors.textMuted}
              />

              <Text
                style={[
                  styles.footerText,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {item.duration_seconds}s
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
  },

  cardFailed: {
    opacity: 0.92,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: Typography.action.fontWeight,
    marginRight: 8,
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  detalle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 9,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  difficultyPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
  },

  metaText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  footerText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
});