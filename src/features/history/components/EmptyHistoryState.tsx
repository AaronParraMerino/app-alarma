import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

interface EmptyHistoryStateProps {
  title?: string;
  description?: string;
}

export function EmptyHistoryState({
  title = 'Sin misiones aún',
  description = 'Cuando completes misiones en tus alarmas, aparecerán aquí.',
}: EmptyHistoryStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: colors.bgElevated,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.icon, { color: colors.textMuted }]}>☰</Text>
      </View>

      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>

      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});