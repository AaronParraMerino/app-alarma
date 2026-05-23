// src/features/history/components/HistorySummaryCards.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

import { HistorySummary } from '../types/missionHistory.types';

interface Props {
  resumen: HistorySummary;
}

export function HistorySummaryCards({
  resumen,
}: Props) {
  const {
    colors,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';

  return (
    <View style={styles.grid}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.val,
            {
              color: colors.text,
            },
          ]}
        >
          {resumen.completadas}
        </Text>

        <Text
          style={[
            styles.lbl,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {isSpanish ? 'Completadas' : 'Completed'}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.val,
            {
              color: colors.warning,
            },
          ]}
        >
          {resumen.fallidas}
        </Text>

        <Text
          style={[
            styles.lbl,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {isSpanish ? 'Fallidas' : 'Failed'}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.val,
            {
              color: colors.primaryLight,
            },
          ]}
        >
          {resumen.tasaExito}%
        </Text>

        <Text
          style={[
            styles.lbl,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {isSpanish ? 'Tasa éxito' : 'Success rate'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    marginBottom: 12,
  },

  card: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },

  val: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },

  lbl: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
});