import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Difficulty } from '../types/ColoredFigures.types';
import { DIFFICULTY_STYLES } from '../constants/ColoredFigure.config';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const MAX_ATTEMPTS = 3;

interface Props {
  difficulty: Difficulty;
  errorCount: number;
  onReplace: () => void;
  onDifficultyDown: (next: Difficulty) => void;
}

export function ReplaceButton({
  difficulty,
  errorCount,
  onReplace,
  onDifficultyDown,
}: Props) {
  const [replaceCount, setReplaceCount] = useState(0);

  const currentIdx = DIFFICULTY_ORDER.indexOf(difficulty);
  const canGoDown = currentIdx > 0;
  const nextDifficulty = canGoDown ? DIFFICULTY_ORDER[currentIdx - 1] : difficulty;
  const style = DIFFICULTY_STYLES[difficulty];

  const handleDifficultyDown = () => {
    if (!canGoDown) return;

    onDifficultyDown(nextDifficulty);
    setReplaceCount(0);
  };

  const handleReplace = () => {
    const nextCount = replaceCount + 1;

    setReplaceCount(nextCount);
    onReplace();

    if (nextCount >= MAX_ATTEMPTS && canGoDown) {
      handleDifficultyDown();
    }
  };

  useEffect(() => {
    if (errorCount >= MAX_ATTEMPTS && canGoDown) {
      handleDifficultyDown();
    }
  }, [errorCount]);

  const replacesLeft = MAX_ATTEMPTS - replaceCount;
  const errorsLeft = MAX_ATTEMPTS - errorCount;
  const showWarning = (replacesLeft <= 1 || errorsLeft <= 1) && canGoDown;

  return (
    <View style={styles.container}>
      {showWarning && (
        <Text style={[styles.warning, { color: style.accentColor }]}>
          {replacesLeft <= 1 && errorsLeft > 1
            ? `1 reemplazo más y baja a ${DIFFICULTY_STYLES[nextDifficulty].label.toLowerCase()}`
            : errorsLeft <= 1 && replacesLeft > 1
            ? `1 fallo más y baja a ${DIFFICULTY_STYLES[nextDifficulty].label.toLowerCase()}`
            : `Siguiente fallo o reemplazo baja a ${DIFFICULTY_STYLES[nextDifficulty].label.toLowerCase()}`}
        </Text>
      )}

      <TouchableOpacity onPress={handleReplace} style={styles.btn}>
        <Text style={styles.btnText}>Reemplazar figura</Text>

        {canGoDown && (
          <Text style={styles.counter}>
            {replaceCount}/{MAX_ATTEMPTS}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 4,
  },
  warning: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 11,
    color: '#8EA4B8',
    textDecorationLine: 'underline',
    marginRight: 6,
  },
  counter: {
    fontSize: 10,
    color: '#6B7C8C',
  },
});