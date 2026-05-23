import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '../../../../shared/theme/colors';
import { WordChallenge } from '../types/wordCompletion.types';

interface Props {
  challenge: WordChallenge;
  accentColor: string;
  accentBg: string;
  letterSize?: number;
  textColor?: string;
}

export function WordDisplay({ challenge, accentColor, accentBg, letterSize = 24, textColor = Colors.text }: Props) {
  const { width } = useWindowDimensions();
  const cellSize = Math.min(letterSize, (width - 80) / challenge.word.length);

  return (
    <View style={styles.row}>
      {challenge.word.split('').map((letter, idx) => {
        const isMissing = challenge.missingIndexes.includes(idx);
        const key = `${challenge.word}-${idx}-${isMissing ? 'gap' : 'letter'}`;

        return isMissing ? (
          <View
            key={key}
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
            key={key}
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
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  gap: {
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
