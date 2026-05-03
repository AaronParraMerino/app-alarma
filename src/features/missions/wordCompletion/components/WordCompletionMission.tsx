import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, useWindowDimensions,
} from 'react-native';
import { Difficulty } from '../types/wordCompletion.types';
import { DIFFICULTY_STYLES } from '../constants/wordCompletion.config';
import { useWordCompletion } from '../hooks/useWordCompletion';
import { WordDisplay } from '../components/WordDisplay';
import { WordStack } from '../components/WordStack';
import { WordHint } from '../components/WordHint';
import { ReplaceButton } from '../components/ReplaceButton';
import { useCurrentTime } from '../hooks/useCurrentTime';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
}

export function WordCompletionMission({ difficulty: initialDifficulty, quantity, onComplete, alarmLabel }: Props) {
  const { width } = useWindowDimensions();
  const [missionCount, setMissionCount]   = useState(0);
  const [difficulty, setDifficulty]       = useState<Difficulty>(initialDifficulty);
  const [errorCount, setErrorCount]       = useState(0);

  const style = DIFFICULTY_STYLES[difficulty];
  const { challenges, state, current, handleInputChange, handleConfirm, handleReplace } =
    useWordCompletion(difficulty);

  const { time, day } = useCurrentTime();
  const isHard   = difficulty === 'hard';
  const isMedium = difficulty === 'medium';
  const showHint = isMedium || isHard;

  const maxLength = isHard
    ? challenges[state.currentChallengeIndex]?.missingIndexes.length ?? 1
    : current?.missingIndexes.length ?? 1;

  const hintText = isHard
    ? `${challenges.reduce((a, c) => a + c.missingIndexes.length, 0)} letras faltantes`
    : `${maxLength} letra${maxLength > 1 ? 's' : ''} faltante${maxLength > 1 ? 's · escríbelas juntas' : ''}`;

  const activeWord = isHard
    ? challenges[state.currentChallengeIndex]?.word
    : current?.word;

  // Wrappea handleConfirm para contar errores
  const handleConfirmWithCount = () => {
    const prevError = state.hasError;
    handleConfirm();
    // Si ya tenía error antes de confirmar, este es un nuevo fallo
    if (!prevError && state.userInput.trim() !== '') {
      // lo detectamos por el cambio en hasError en el siguiente render
    }
  };

  // Detecta cuando hasError cambia a true (nuevo fallo)
  const prevHasError = React.useRef(false);
  React.useEffect(() => {
    if (state.hasError && !prevHasError.current) {
      setErrorCount(c => c + 1);
    }
    prevHasError.current = state.hasError;
  }, [state.hasError]);

  // Reset errorCount al cambiar de palabra
  React.useEffect(() => {
    setErrorCount(0);
  }, [state.currentChallengeIndex]);

  // Misión completada
  React.useEffect(() => {
    if (!state.isCompleted) return;
    const next = missionCount + 1;
    if (next >= quantity) {
      onComplete();
    } else {
      setMissionCount(next);
      handleReplace();
      setErrorCount(0);
    }
  }, [state.isCompleted]);

  // Baja de dificultad — reinicia la misión con nueva dificultad
  const handleDifficultyDown = (next: Difficulty) => {
    setDifficulty(next);
    setErrorCount(0);
    handleReplace();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.screen}>

          {/* etiqueta dificultad */}
          <View style={[styles.pill, { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' }]}>
            <Text style={[styles.pillText, { color: style.accentColor }]}>{style.label}</Text>
          </View>

          {/* Hora */}
          <View style={styles.timeBlock}>
            <Text style={[styles.time, { fontSize: width < 380 ? 44 : 52 }]}>{time}</Text>
            <Text style={styles.dateLabel}>{day} — {alarmLabel ?? 'Hora de levantarse'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Cuerpo misión */}
          <View style={styles.body}>
            <Text style={styles.instruction}>
              {isHard ? 'Completa todas las palabras:' : 'Escribe la letra que falta:'}
            </Text>

            {isHard ? (
              <WordStack
                challenges={challenges}
                currentIndex={state.currentChallengeIndex}
                completedIndexes={state.completedIndexes}
                accentColor={style.accentColor}
                accentBg={style.bgColor}
              />
            ) : (
              current && (
                <View style={styles.wordBox}>
                  <WordDisplay
                    challenge={current}
                    accentColor={style.accentColor}
                    accentBg={style.bgColor}
                    letterSize={width < 380 ? 20 : 26}
                  />
                </View>
              )
            )}

            {/* Pista visual: palabra completa, de cabeza y al revés */}
            {showHint && activeWord && (
              <WordHint word={activeWord} accentColor={style.accentColor} />
            )}

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: state.hasError ? '#F87171' : style.accentColor + '60',
                  color: style.accentColor,
                  fontSize: width < 380 ? 18 : 22,
                },
              ]}
              value={state.userInput}
              onChangeText={handleInputChange}
              autoCapitalize="characters"
              placeholder={Array(maxLength).fill('_').join(' ')}
              placeholderTextColor="#334455"
              maxLength={maxLength}
            />

            {state.hasError && (
              <Text style={styles.errorText}>Respuesta incorrecta, intenta de nuevo</Text>
            )}

            <Text style={[styles.hint, { color: style.accentColor + '88' }]}>{hintText}</Text>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, { color: style.textColor }]}>
                {isHard ? `Confirmar palabra ${state.currentChallengeIndex + 1}` : 'Confirmar'}
              </Text>
            </TouchableOpacity>

            <ReplaceButton
              difficulty={difficulty}
              errorCount={errorCount}
              onReplace={() => { handleReplace(); setErrorCount(0); }}
              onDifficultyDown={handleDifficultyDown}
            />

          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  pill: {
    alignSelf: 'center', marginTop: 16,
    paddingVertical: 5, paddingHorizontal: 18,
    borderRadius: 20, borderWidth: 0.5,
  },
  pillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeBlock: { alignItems: 'center', paddingVertical: 10 },
  time: { fontWeight: '500', color: '#FFFFFF', letterSpacing: -1, lineHeight: 56 },
  dateLabel: { fontSize: 12, color: '#556677', marginTop: 2 },
  divider: { height: 0.5, backgroundColor: '#1E1E1E', marginHorizontal: 16, marginVertical: 10 },
  body: { flex: 1, paddingHorizontal: 18, paddingBottom: 16 },
  instruction: { fontSize: 12, color: '#667788', marginBottom: 12 },
  wordBox: {
    backgroundColor: '#161616', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 10,
    alignItems: 'center', marginBottom: 4,
  },
  input: {
    backgroundColor: '#161616', borderWidth: 0.5, borderRadius: 10,
    height: 52, textAlign: 'center', fontWeight: '500',
    fontFamily: 'monospace', marginBottom: 6,
  },
  errorText: { fontSize: 11, color: '#F87171', textAlign: 'center', marginBottom: 4 },
  hint: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  confirmBtn: {
    borderRadius: 14, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 'auto',
  },
  confirmText: { fontSize: 15, fontWeight: '500' },
});
