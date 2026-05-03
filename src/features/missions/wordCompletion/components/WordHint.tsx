import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  word: string;
  accentColor: string;
}

export function WordHint({ word, accentColor }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.hintLabel, { color: accentColor + '55' }]}>pista</Text>
      {/* scaleY(-1) = boca abajo, scaleX(-1) = derecha a izquierda */}
      <View style={styles.wordWrapper}>
        <Text style={[
          styles.word,
          { color: accentColor + '40',
            transform: [{ scaleY: -1 }, { scaleX: -1 }] }
        ]}>
          {word}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    gap: 2,
  },
  hintLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    transform: [{ scaleY: -1 }, { scaleX: -1 }],
  },
  wordWrapper: {
    overflow: 'hidden',
  },
  word: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
});
