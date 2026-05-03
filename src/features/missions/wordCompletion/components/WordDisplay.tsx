import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { WordChallenge } from '../types/wordCompletion.types';

interface Props {
  challenge: WordChallenge;
  accentColor: string;
  accentBg: string;
  letterSize?: number;
  textColor?: string;
}

export function WordDisplay({ challenge, accentColor, accentBg, letterSize = 24, textColor = '#FFFFFF' }: Props) {
  const { width } = useWindowDimensions();
  const cellSize = Math.min(letterSize, (width - 80) / challenge.word.length);

  return (
    <View style={styles.row}>
      {challenge.word.split('').map((letter, idx) => {
        const isMissing = challenge.missingIndexes.includes(idx);
        return isMissing ? (
          <View
            key={idx}
            style={[
              styles.gap,
              {
                width: cellSize + 4,
                height: cellSize + 10,
                backgroundColor: accentBg,
                borderColor: accentColor,
              },
            ]}
          />
        ) : (
          <Text
            key={idx}
            style={[styles.letter, { fontSize: cellSize, width: cellSize + 4, color: textColor }]}
          >
            {letter}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  letter: {
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  gap: {
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
