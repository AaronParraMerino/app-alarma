// src/features/history/components/HistoryFilterChips.tsx
import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';

import { FILTER_OPTIONS } from '../constants/missionHistory.config';
import { FilterOption } from '../types/missionHistory.types';

interface Props {
  filtroActivo: FilterOption;
  onSelect: (filtro: FilterOption) => void;
}

export function HistoryFilterChips({ filtroActivo, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTER_OPTIONS.map((filter, index) => {
        const active = filtroActivo === filter.key;

        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.chip,
              active && styles.chipActive,
              index < FILTER_OPTIONS.length - 1 && styles.chipSpacing,
            ]}
            onPress={() => onSelect(filter.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                active && styles.chipTextActive,
              ]}
              numberOfLines={1}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
    flexDirection: 'row',
  },

  chip: {
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipSpacing: {
    marginRight: 8,
  },

  chipActive: {
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.primary,
  },

  chipText: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    color: Colors.textSecondary,
  },

  chipTextActive: {
    color: Colors.primaryLight,
  },
});