import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DifficultyStats } from '../types/missionHistory.types';
import { DIFFICULTY_CONFIG } from '../constants/missionHistory.config';

interface Props {
  stats: DifficultyStats;
  total: number;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export function DifficultyStatsCard({ stats, total }: Props) {
  const safeTotal = total || 1;

  return (
    <>
      <Text style={styles.sectionLabel}>DIFICULTAD</Text>

      <View style={styles.card}>
        {DIFFICULTIES.map((key, index) => {
          const dc = DIFFICULTY_CONFIG[key];
          const count = stats[key];
          const pct = Math.round((count / safeTotal) * 100);
          const barW = `${pct}%` as `${number}%`;

          return (
            <View
              key={key}
              style={[
                styles.row,
                index < DIFFICULTIES.length - 1 && styles.rowSpacing,
              ]}
            >
              <View style={[styles.badge, { backgroundColor: dc.bg }]}>
                <Text style={[styles.badgeText, { color: dc.color }]}>
                  {dc.label}
                </Text>
              </View>

              <View style={styles.barTrack}>
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

              <Text style={styles.count}>{count}</Text>
              <Text style={styles.pct}>{pct}%</Text>
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
    color: '#8A93B2',
    paddingHorizontal: 15,
    paddingBottom: 7,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  card: {
    minHeight: 64,
    backgroundColor: '#12161F',
    marginHorizontal: 13,
    borderRadius: 12,
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
    backgroundColor: '#1F2436',
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
    color: '#F0F2F7',
    width: 24,
    textAlign: 'right',
    marginRight: 8,
  },
  pct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A93B2',
    width: 40,
    textAlign: 'right',
  },
});