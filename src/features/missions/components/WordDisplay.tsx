import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordChallenge } from '../types/wordCompletion.types';

interface Props {
  challenge: WordChallenge;
  accentColor: string;
  accentBg: string;
}

export function WordDisplay({ challenge, accentColor, accentBg }: Props) {
  return (
    <View style={styles.container}>
      {challenge.word.split('').map((letter, index) => {
        const isMissing = challenge.missingIndexes.includes(index);
        if (isMissing) {
          return (
            <View
              key={index}
              style={[
                styles.gap,
                { backgroundColor: accentBg, borderColor: accentColor },
              ]}
            />
          );
        }
        return (
          <Text key={index} style={styles.letter}>
            {letter}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 3,
    marginBottom: 12,
  },
  letter: {
    fontSize: 26,
    fontWeight: '500',
    color: '#FFFFFF',
    width: 22,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  gap: {
    width: 22,
    height: 32,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
