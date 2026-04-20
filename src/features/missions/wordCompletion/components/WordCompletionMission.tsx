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

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
}

export function WordCompletionMission({ difficulty, quantity, onComplete, alarmLabel }: Props) {
  const { width } = useWindowDimensions();

  // Contador de cuántas misiones se han completado
  const [missionCount, setMissionCount] = useState(0);

  const style = DIFFICULTY_STYLES[difficulty];
  const { challenges, state, current, handleInputChange, handleConfirm, handleReplace } =
    useWordCompletion(difficulty);


// Determina si la dificultad es alta (cambia comportamiento del UI)
  const isHard = difficulty === 'hard';
  const maxLength = isHard
    ? challenges[state.currentChallengeIndex]?.missingIndexes.length ?? 1
    : current?.missingIndexes.length ?? 1;

  const hintText = isHard
    ? `${challenges.reduce((a, c) => a + c.missingIndexes.length, 0)} letras faltantes`
    : `${maxLength} letra${maxLength > 1 ? 's' : ''} faltante${maxLength > 1 ? 's · escríbelas juntas' : ''}`;


    /**
   * Efecto: detecta cuando una misión se completa
   * - Si se completan todas ejecuta onComplete()
   * - Si quedan mas incrementa contador y reemplaza misión
   */
  React.useEffect(() => {
    if (!state.isCompleted) return;
    const next = missionCount + 1;
    if (next >= quantity) {
      onComplete();
    } else {
      setMissionCount(next);
      handleReplace();
    }
  }, [state.isCompleted, missionCount, quantity, onComplete, handleReplace]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.screen}>

          {/* Pill dificultad */}
          <View style={[styles.pill, { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' }]}>
            <Text style={[styles.pillText, { color: style.accentColor }]}>{style.label}</Text>
          </View>

          {/* Hora */}
          <View style={styles.timeBlock}>
            <Text style={[styles.time, { fontSize: width < 380 ? 44 : 52 }]}>05:30</Text>
            <Text style={styles.dateLabel}>Miércoles — Hora de levantarse</Text>
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

            {/* Boton para cambiar misión */}
            <TouchableOpacity onPress={handleReplace} style={styles.skipBtn}>
              <Text style={styles.skipText}>Reemplazar misión</Text>
            </TouchableOpacity>
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
    alignItems: 'center', marginBottom: 12,
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
  skipBtn: { alignItems: 'center', marginTop: 8, paddingBottom: 4 },
  skipText: { fontSize: 11, color: '#334455', textDecorationLine: 'underline' },
});