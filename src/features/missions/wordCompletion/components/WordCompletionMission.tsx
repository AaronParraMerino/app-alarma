import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, useWindowDimensions,
} from 'react-native';
import { Difficulty } from '../types/wordCompletion.types';
import { WordCompletionService } from '../services/WordCompletionService';
import { useWordCompletion } from '../hooks/useWordCompletion';
import { WordDisplay } from '../components/WordDisplay';
import { WordStack } from '../components/WordStack';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useAuth } from '../../../auth/hooks/useAuth';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const MAX_ERRORS = 3;

function getPreviousDifficulty(difficulty: Difficulty): Difficulty | null {
  const currentIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  return currentIndex > 0 ? DIFFICULTY_ORDER[currentIndex - 1] : null;
}

function getDifficultyLabel(difficulty: Difficulty) {
  return WordCompletionService.getDifficultyStyle(difficulty).label.toLowerCase();
}

export function WordCompletionMission({ difficulty: initialDifficulty, quantity, onComplete, alarmLabel }: Props) {
  const { width } = useWindowDimensions();
  const [missionCount, setMissionCount]   = useState(0);
  const [difficulty, setDifficulty]       = useState<Difficulty>(initialDifficulty);
  const [errorCount, setErrorCount]       = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] =
    useState<'error' | 'warning' | 'success'>('error');
  const { user, isAuthenticated, isGuest } = useAuth();

  const style = WordCompletionService.getDifficultyStyle(difficulty);
  const { challenges, state, current, handleInputChange, handleConfirm, handleReplace } =
    useWordCompletion(difficulty);

  const { time, day } = useCurrentTime();
  const isHard   = difficulty === 'hard';

  const maxLength = isHard
    ? challenges[state.currentChallengeIndex]?.missingIndexes.length ?? 1
    : current?.missingIndexes.length ?? 1;

  const hintText = isHard
    ? `${challenges.reduce((a, c) => a + c.missingIndexes.length, 0)} letras faltantes`
    : `${maxLength} letra${maxLength > 1 ? 's' : ''} faltante${maxLength > 1 ? 's · escríbelas juntas' : ''}`;

/*
  // Wrappea handleConfirm para contar errores
  const handleConfirmWithCount = () => {
    const prevError = state.hasError;
    handleConfirm();
    // Si ya tenía error antes de confirmar, este es un nuevo fallo
    if (!prevError && state.userInput.trim() !== '') {
      // lo detectamos por el cambio en hasError en el siguiente render
    }
  };*/

  // Detecta cuando hasError cambia a true (nuevo fallo)
  const prevHasError = React.useRef(false);
  React.useEffect(() => {
    if (state.hasError && !prevHasError.current) {
      const nextErrorCount = errorCount + 1;
      const previousDifficulty = getPreviousDifficulty(difficulty);

      saveMissionHistory(false, nextErrorCount);

      if (nextErrorCount >= MAX_ERRORS && previousDifficulty) {
        setDifficulty(previousDifficulty);
        setErrorCount(0);
        setFeedbackType('warning');
        setFeedbackMessage(
          `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(previousDifficulty)}.`,
        );
        handleReplace();
        prevHasError.current = state.hasError;
        return;
      }

      if (nextErrorCount >= MAX_ERRORS && !previousDifficulty) {
        setErrorCount(0);
        setFeedbackType('error');
        setFeedbackMessage(
          'Fallaste 3 veces, pero ya estas en el nivel mas bajo. Intenta nuevamente.',
        );
        handleReplace();
        prevHasError.current = state.hasError;
        return;
      }

      setErrorCount(nextErrorCount);

      if (nextErrorCount === MAX_ERRORS - 1 && previousDifficulty) {
        setFeedbackType('warning');
        setFeedbackMessage(
          `1 fallo mas y bajas a ${getDifficultyLabel(previousDifficulty)}.`,
        );
      } else {
        const remainingErrors = MAX_ERRORS - nextErrorCount;

        setFeedbackType('error');
        setFeedbackMessage(
          `Respuesta incorrecta. Te quedan ${remainingErrors} intento${
            remainingErrors === 1 ? '' : 's'
          }.`,
        );
      }
    }
    prevHasError.current = state.hasError;
  }, [state.hasError, errorCount, difficulty, handleReplace]);

  // Reset errorCount al cambiar de palabra
  React.useEffect(() => {
    setErrorCount(0);
  }, [state.currentChallengeIndex]);

  // Misión completada
  React.useEffect(() => {
    if (!state.isCompleted) return;

    if (isAuthenticated && !isGuest && user?.id && current) {
      MissionHistoryLocalService.save({
        userId: user.id,
        missionType: 'word_completion',
        difficulty,
        content: {
          word: current.word,
          missingIndexes: current.missingIndexes,
        },
        correctAnswer: WordCompletionService.getExpectedAnswer(current),
        userAnswer: state.userInput,
        success: true,
        errorCount,
        durationSeconds: null,
      });

      void syncMissionHistory(user.id);
    }

    const next = missionCount + 1;

    if (next >= quantity) {
      onComplete();
    } else {
      setMissionCount(next);
      handleReplace();
      setErrorCount(0);
      setFeedbackMessage('');
    }
  }, [state.isCompleted]);

  const saveMissionHistory = (success: boolean, nextErrorCount: number) => {
    if (!isAuthenticated || isGuest || !user?.id || !current) return;

    MissionHistoryLocalService.save({
      userId: user.id,
      missionType: 'word_completion',
      difficulty,
      content: {
        word: current.word,
        missingIndexes: current.missingIndexes,
      },
      correctAnswer: WordCompletionService.getExpectedAnswer(current),
      userAnswer: state.userInput,
      success,
      errorCount: nextErrorCount,
      durationSeconds: null,
    });

    void syncMissionHistory(user.id);
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

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: state.hasError ? Colors.danger : style.accentColor + '60',
                  color: style.accentColor,
                  fontSize: width < 380 ? 18 : 22,
                },
              ]}
              value={state.userInput}
              onChangeText={(value) => {
                handleInputChange(value);

                if (feedbackMessage && feedbackType !== 'warning') {
                  setFeedbackMessage('');
                }
              }}
              autoCapitalize="characters"
              placeholder={Array(maxLength).fill('_').join(' ')}
              placeholderTextColor={Colors.textMuted}
              maxLength={maxLength}
            />

            {feedbackMessage ? (
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color: feedbackType === 'success'
                      ? Colors.success
                      : feedbackType === 'warning'
                      ? style.accentColor
                      : Colors.danger,
                  },
                ]}
              >
                {feedbackMessage}
              </Text>
            ) : null}

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

          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  screen: {
  flex: 1,
  backgroundColor: Colors.bg,
  paddingTop: 40,
  },
  pill: {
    alignSelf: 'center', marginTop: 16,
    paddingVertical: 5, paddingHorizontal: 18,
    borderRadius: 20, borderWidth: 0.5,
  },
  pillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeBlock: { alignItems: 'center', paddingVertical: 10 },
  time: { fontWeight: '500', color: Colors.text, letterSpacing: -1, lineHeight: 56 },
  dateLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: 16, marginVertical: 10 },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
  },
  instruction: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  wordBox: {
    backgroundColor: Colors.bgCard, borderRadius: Layout.controlRadius,
    paddingVertical: 14, paddingHorizontal: 10,
    alignItems: 'center', marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.bgCard, borderWidth: 0.5, borderRadius: Layout.controlRadius,
    height: 52, textAlign: 'center', fontWeight: '500',
    fontFamily: 'monospace', marginBottom: 6,
  },
  feedbackText: { fontSize: 11, textAlign: 'center', marginBottom: 4 },
  hint: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  confirmBtn: {
    borderRadius: 14, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 'auto',
  },
  confirmText: { fontSize: 15, fontWeight: '500' },
});
