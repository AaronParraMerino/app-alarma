import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordChallenge } from '../types/wordCompletion.types';

interface Props {
  challenges: WordChallenge[];
  currentIndex: number;
  completedIndexes: number[];
  accentColor: string;
  accentBg: string;
}

export function WordStack({
  challenges,
  currentIndex,
  completedIndexes,
  accentColor,
  accentBg,
}: Props) {
  return (
    <View style={styles.container}>
      {challenges.map((challenge, idx) => {
        const isCompleted = completedIndexes.includes(idx);
        const isActive = idx === currentIndex;
        const isPending = !isCompleted && !isActive;

        return (
          <View
            key={idx}
            style={[
              styles.card,
              isActive && { borderColor: accentColor + '40', borderWidth: 0.5 },
              (isCompleted || isPending) && { opacity: isCompleted ? 0.3 : 0.25 },
            ]}
          >
            <Text style={[styles.label, isActive && { color: accentColor }]}>
              {isCompleted ? `${idx + 1} — completada` : isActive ? `${idx + 1} — en curso` : `${idx + 1} — pendiente`}
            </Text>
            <View style={styles.lettersRow}>
              {challenge.word.split('').map((letter, lIdx) => {
                const isMissing = challenge.missingIndexes.includes(lIdx);
                if (isMissing) {
                  return (
                    <View
                      key={lIdx}
                      style={[
                        styles.gap,
                        isPending
                          ? { backgroundColor: '#111', borderColor: '#333' }
                          : { backgroundColor: accentBg, borderColor: accentColor },
                      ]}
                    />
                  );
                }
                return (
                  <Text key={lIdx} style={styles.letter}>
                    {letter}
                  </Text>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 10,
    color: '#445566',
    marginBottom: 6,
  },
  lettersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
  },
  letter: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    width: 17,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  gap: {
    width: 17,
    height: 26,
    borderRadius: 3,
    borderWidth: 1.5,
  },
});
