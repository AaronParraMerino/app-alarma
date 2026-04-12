// src/features/missions/screens/MissionsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';

export default function MissionsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Misiones</Text>
      </View>
      <View style={styles.body}>
        <Ionicons name="trophy-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.soon}>Próximamente</Text>
        <Text style={styles.desc}>
          Tus misiones para despertar mejor{'\n'}estarán aquí muy pronto.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  soon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  desc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});