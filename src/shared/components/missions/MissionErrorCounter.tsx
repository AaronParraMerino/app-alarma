import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTranslation } from '../../i18n/useTranslation';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = {
  count: number;
  max: number;
  color?: string;
};

export function MissionErrorCounter({
  count,
  max,
  color,
}: Props) {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const accentColor = color ?? colors.warning;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: accentColor + '14',
          borderColor: accentColor + '42',
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {isSpanish ? 'Errores' : 'Errors'}
      </Text>
      <Text style={[styles.value, { color: accentColor }]}>
        {count}/{max}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
