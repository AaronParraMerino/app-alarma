// src/features/auth/components/AuthMessage.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';

type AuthMessageType = 'success' | 'error' | 'info';

type Props = {
  type: AuthMessageType;
  message: string;
};

export function AuthMessage({ type, message }: Props) {
  if (!message) return null;

  const config = {
    success: {
      icon: 'checkmark-circle-outline' as const,
      bg: Colors.successDim,
      border: Colors.success,
      color: Colors.success,
    },
    error: {
      icon: 'alert-circle-outline' as const,
      bg: Colors.dangerDim,
      border: Colors.danger,
      color: Colors.danger,
    },
    info: {
      icon: 'information-circle-outline' as const,
      bg: Colors.accentGlow,
      border: Colors.primary,
      color: Colors.primaryLight,
    },
  }[type];

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Ionicons name={config.icon} size={19} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});