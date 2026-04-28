import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Difficulty } from '../types/wordCompletion.types';
import { DIFFICULTY_STYLES } from '../constants/wordCompletion.config';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const MAX_ATTEMPTS = 3;

interface Props {
  difficulty: Difficulty;
  errorCount: number;                          // errores acumulados
  onReplace: () => void;                       // reemplaza la misión
  onDifficultyDown: (next: Difficulty) => void; // baja dificultad
}

export function ReplaceButton({ difficulty, errorCount, onReplace, onDifficultyDown }: Props) {
  const [replaceCount, setReplaceCount] = useState(0);
  const style = DIFFICULTY_STYLES[difficulty];

  const currentIdx = DIFFICULTY_ORDER.indexOf(difficulty);
  const canGoDown  = currentIdx > 0;

  const tryGoDown = (reason: 'replace' | 'error') => {
    if (!canGoDown) return;
    const next = DIFFICULTY_ORDER[currentIdx - 1];
    onDifficultyDown(next);
    setReplaceCount(0); // reset contador al bajar
  };

  const handleReplace = () => {
    const next = replaceCount + 1;
    setReplaceCount(next);
    onReplace();
    if (next >= MAX_ATTEMPTS && canGoDown) {
      tryGoDown('replace');
    }
  };

  // Reaccionar a errores acumulados
  React.useEffect(() => {
    if (errorCount >= MAX_ATTEMPTS && canGoDown) {
      tryGoDown('error');
    }
  }, [errorCount]);

  // Cuántos intentos quedan antes de bajar
  const replacesLeft = MAX_ATTEMPTS - replaceCount;
  const errorsLeft   = MAX_ATTEMPTS - errorCount;
  const showWarning  = (replacesLeft <= 1 || errorsLeft <= 1) && canGoDown;

  return (
    <View style={styles.container}>
      {showWarning && (
        <Text style={[styles.warning, { color: style.accentColor + 'AA' }]}>
          {replacesLeft <= 1 && errorsLeft > 1
            ? `1 reemplazo más y baja a ${DIFFICULTY_STYLES[DIFFICULTY_ORDER[currentIdx - 1]].label.toLowerCase()}`
            : errorsLeft <= 1 && replacesLeft > 1
            ? `1 fallo más y baja a ${DIFFICULTY_STYLES[DIFFICULTY_ORDER[currentIdx - 1]].label.toLowerCase()}`
            : `Siguiente fallo o reemplazo baja a ${DIFFICULTY_STYLES[DIFFICULTY_ORDER[currentIdx - 1]].label.toLowerCase()}`
          }
        </Text>
      )}

      <TouchableOpacity onPress={handleReplace} style={styles.btn}>
        <Text style={styles.btnText}>Reemplazar misión</Text>
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
  container: { alignItems: 'center', marginTop: 8, paddingBottom: 4, gap: 4 },
  warning: { fontSize: 10, textAlign: 'center' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnText: { fontSize: 11, color: '#334455', textDecorationLine: 'underline' },
  counter: { fontSize: 10, color: '#2a3a4a' },
});
