// src/features/history/components/DifficultyStatsCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

import { DifficultyStats } from '../types/missionHistory.types';
import { DIFFICULTY_CONFIG } from '../constants/missionHistory.config';

interface Props {
  stats: DifficultyStats;
  total: number;
}

const DIFFICULTIES = [
  'easy',
  'medium',
  'hard',
] as const;

function getDifficultyLabel(
  difficulty: typeof DIFFICULTIES[number],
  fallbackLabel: string,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish ? 'Fácil' : 'Easy';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'Medio' : 'Medium';
  }

  if (difficulty === 'hard') {
    return isSpanish ? 'Difícil' : 'Hard';
  }

  return fallbackLabel;
}

export function DifficultyStatsCard({
  stats,
  total,
}: Props) {
  const {
    colors,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';
  const safeTotal = total || 1;

  return (
    <>
      <Text
        style={[
          styles.sectionLabel,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {isSpanish ? 'DIFICULTAD' : 'DIFFICULTY'}
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        {DIFFICULTIES.map((key, index) => {
          const dc = DIFFICULTY_CONFIG[key];
          const count = stats[key];
          const pct = Math.round(
            (count / safeTotal) * 100,
          );

          const barW = `${pct}%` as `${number}%`;

          return (
            <View
              key={key}
              style={[
                styles.row,
                index < DIFFICULTIES.length - 1 &&
                  styles.rowSpacing,
              ]}
            >
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: dc.bg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: dc.color,
                    },
                  ]}
                >
                  {getDifficultyLabel(
                    key,
                    dc.label,
                    isSpanish,
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: colors.borderMuted,
                  },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: barW,
                      backgroundColor: dc.barColor,
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.count,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {count}
              </Text>

              <Text
                style={[
                  styles.pct,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {pct}%
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingBottom: 7,
    letterSpacing: 0.7,
    fontWeight: '700',
  },

  card: {
    minHeight: 64,
    marginHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },

  rowSpacing: {
    marginBottom: 8,
  },

  badge: {
    width: 70,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 10,
  },

  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },

  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },

  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  count: {
    fontSize: 14,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
    marginRight: 8,
  },

  pct: {
    fontSize: 14,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
});