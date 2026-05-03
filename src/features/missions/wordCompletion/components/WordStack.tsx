import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordChallenge } from '../types/wordCompletion.types';
import { WordDisplay } from './WordDisplay';

interface Props {
  challenges: WordChallenge[];
  currentIndex: number;
  completedIndexes: number[];
  accentColor: string;
  accentBg: string;
}
// Componente que renderiza una pila/lista de palabras con estado visual
export function WordStack({ challenges, currentIndex, completedIndexes, accentColor, accentBg }: Props) {
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
              isActive && { borderColor: accentColor + '50', borderWidth: 0.5 },
              { opacity: isCompleted ? 0.3 : isPending ? 0.25 : 1 },
            ]}
          >
            <Text style={[styles.label, isActive && { color: accentColor }]}>
              {isCompleted
                ? `${idx + 1} — completada`
                : isActive
                ? `${idx + 1} — en curso`
                : `${idx + 1} — pendiente`}
            </Text>
            <WordDisplay
              challenge={challenge}
              accentColor={isPending ? '#333333' : accentColor}
              accentBg={isPending ? '#111111' : accentBg}
              letterSize={20}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  card: {
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  label: {
    fontSize: 10,
    color: '#445566',
  },
});
