import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { WordCompletionConfig } from '../types/wordCompletion.types';
import { DIFFICULTY_STYLES } from '../constants/wordCompletion.config';
import { WordCompletionMission } from '../components/WordCompletionMission';

interface Props {
  config: WordCompletionConfig;
  onAllCompleted: () => void;
  alarmLabel?: string;
}

export function WordCompletionScreen({ config, onAllCompleted, alarmLabel }: Props) {
  const [current, setCurrent] = useState(0);
  const style = DIFFICULTY_STYLES[config.difficulty];

  const handleComplete = () => {
    const next = current + 1;
    if (next >= config.quantity) {
      onAllCompleted();
    } else {
      setCurrent(next);
    }
  };

  return (
    <View style={styles.container}>
      <WordCompletionMission
        key={current}
        difficulty={config.difficulty}
        quantity={config.quantity}
        onComplete={handleComplete}
        alarmLabel={alarmLabel}
      />

      {/* Barra de progreso de misiones */}
      {config.quantity > 1 && (
        <SafeAreaView style={styles.progressBar}>
          <View style={styles.dotsRow}>
            {Array.from({ length: config.quantity }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < current && { backgroundColor: style.accentColor + '60' },
                  i === current && { backgroundColor: style.accentColor },
                  i > current && { backgroundColor: '#2a2a2a' },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.progressText, { color: style.accentColor + 'AA' }]}>
            {current + 1} / {config.quantity}
          </Text>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  progressBar: {
    backgroundColor: '#0D0D0D',
    borderTopWidth: 0.5,
    borderTopColor: '#1E1E1E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  progressText: { fontSize: 12 },
});
