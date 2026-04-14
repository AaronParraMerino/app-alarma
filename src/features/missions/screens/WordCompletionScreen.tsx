import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Difficulty } from '../types/wordCompletion.types';
import { DIFFICULTY_CONFIG } from '../constants/wordCompletion.constants';
import { useWordCompletionMission } from '../hooks/useWordCompletionMission';
import { WordDisplay } from '../components/WordDisplay';
import { WordStack } from '../components/WordStack';

interface Props {
  difficulty: Difficulty;
  alarmLabel?: string;
  onMissionComplete?: () => void;
}

export function WordCompletionScreen({
  difficulty,
  alarmLabel = 'Hora de levantarse',
  onMissionComplete,
}: Props) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const {
    challenges,
    state,
    currentChallenge,
    handleInputChange,
    handleConfirm,
    handleReplace,
  } = useWordCompletionMission(difficulty);

  React.useEffect(() => {
    if (state.isCompleted) onMissionComplete?.();
  }, [state.isCompleted]);

  const isHard = difficulty === 'hard';
  const isMedium = difficulty === 'medium';

  const hintText = isHard
    ? `${challenges.reduce((acc, c) => acc + c.missingIndexes.length, 0)} letras faltantes`
    : isMedium
    ? `${currentChallenge?.missingIndexes.length ?? 0} letras faltantes · escríbelas juntas`
    : `${currentChallenge?.missingIndexes.length ?? 0} letra faltante`;

  const confirmLabel = isHard
    ? `Confirmar palabra ${state.currentChallengeIndex + 1}`
    : 'Confirmar';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.screen}>

          {/* Pill dificultad */}
          <View style={[styles.pill, { backgroundColor: config.bgColor, borderColor: config.color + '40' }]}>
            <Text style={[styles.pillText, { color: config.color }]}>{config.label}</Text>
          </View>

          {/* Hora */}
          <View style={styles.timeBlock}>
            <Text style={styles.time}>05:30</Text>
            <Text style={styles.dateLabel}>Miércoles — {alarmLabel}</Text>
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
                accentColor={config.color}
                accentBg={config.bgColor}
              />
            ) : (
              currentChallenge && (
                <WordDisplay
                  challenge={currentChallenge}
                  accentColor={config.color}
                  accentBg={config.bgColor}
                />
              )
            )}

            {/* Input */}
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: state.hasError ? '#F87171' : config.color + '60',
                  color: config.color,
                },
              ]}
              value={state.userInput}
              onChangeText={handleInputChange}
              autoCapitalize="characters"
              placeholder={Array(
                isHard
                  ? challenges[state.currentChallengeIndex]?.missingIndexes.length ?? 1
                  : currentChallenge?.missingIndexes.length ?? 1
              )
                .fill('_')
                .join(' ')}
              placeholderTextColor="#334455"
              maxLength={
                isHard
                  ? challenges[state.currentChallengeIndex]?.missingIndexes.length
                  : currentChallenge?.missingIndexes.length
              }
            />

            {state.hasError && (
              <Text style={styles.errorText}>Respuesta incorrecta, intenta de nuevo</Text>
            )}

            <Text style={[styles.hint, { color: config.color + '88' }]}>{hintText}</Text>

            {/* Botón confirmar */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: config.color }]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, { color: config.textColor }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>

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
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  pillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeBlock: { alignItems: 'center', paddingVertical: 10 },
  time: {
    fontSize: 52,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 56,
  },
  dateLabel: { fontSize: 12, color: '#556677', marginTop: 2 },
  divider: { height: 0.5, backgroundColor: '#1E1E1E', marginHorizontal: 16, marginVertical: 10 },
  body: { flex: 1, paddingHorizontal: 18, paddingBottom: 16 },
  instruction: { fontSize: 12, color: '#667788', marginBottom: 12 },
  input: {
    backgroundColor: '#161616',
    borderWidth: 0.5,
    borderRadius: 10,
    height: 52,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '500',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  errorText: { fontSize: 11, color: '#F87171', textAlign: 'center', marginBottom: 4 },
  hint: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  confirmBtn: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  confirmText: { fontSize: 15, fontWeight: '500' },
  skipBtn: { alignItems: 'center', marginTop: 8, paddingBottom: 4 },
  skipText: { fontSize: 11, color: '#334455', textDecorationLine: 'underline' },
});
