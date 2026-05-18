import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyHistoryStateProps {
  title?: string;
  description?: string;
}

export function EmptyHistoryState({
  title = 'Sin misiones aún',
  description = 'Cuando completes misiones en tus alarmas, aparecerán aquí.',
}: EmptyHistoryStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>☰</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.sub}>{description}</Text>
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
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    color: '#666',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 8,
  },
  sub: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },
});