import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Difficulty, OperationType } from '../types/mathExercises.types';
import { DIFFICULTY_STYLES } from '../constants/mathExercises.config';
import { useMathExercises } from '../hooks/useMathExercises';
import { useCurrentTime } from '../hooks/useCurrentTime';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
  operationType?: OperationType;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const MAX_ERRORS = 3;

function getPreviousDifficulty(difficulty: Difficulty): Difficulty | null {
  const currentIndex = DIFFICULTY_ORDER.indexOf(difficulty);

  if (currentIndex <= 0) {
    return null;
  }

  return DIFFICULTY_ORDER[currentIndex - 1];
}

function getDifficultyLabel(difficulty: Difficulty) {
  return DIFFICULTY_STYLES[difficulty].label.toLowerCase();
}

export function MathExercisesMission({
  difficulty: initialDifficulty,
  quantity,
  onComplete,
  alarmLabel,
  operationType,
}: Props) {
  const { width } = useWindowDimensions();

  const [missionCount, setMissionCount] = React.useState(0);
  const [difficulty, setDifficulty] =
    React.useState<Difficulty>(initialDifficulty);
  const [errorCount, setErrorCount] = React.useState(0);
  const [feedbackMessage, setFeedbackMessage] = React.useState('');
  const [feedbackType, setFeedbackType] =
    React.useState<'error' | 'warning' | 'success'>('error');

  const style = DIFFICULTY_STYLES[difficulty];

  const {
    state,
    current,
    handleInputChange,
    handleConfirm,
    handleReplace,
  } = useMathExercises(difficulty, 1, operationType);

  const { time, day } = useCurrentTime();

  // Detecta nuevo error acumulado y baja de dificultad al tercer fallo
  const prevHasError = React.useRef(false);

  React.useEffect(() => {
    if (state.hasError && !prevHasError.current) {
      const nextErrorCount = errorCount + 1;
      const previousDifficulty = getPreviousDifficulty(difficulty);

      if (nextErrorCount >= MAX_ERRORS && previousDifficulty) {
        setDifficulty(previousDifficulty);
        setErrorCount(0);
        setFeedbackType('warning');
        setFeedbackMessage(
          `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(
            previousDifficulty,
          )}.`,
        );

        handleReplace();
        prevHasError.current = state.hasError;
        return;
      }

      if (nextErrorCount >= MAX_ERRORS && !previousDifficulty) {
        setErrorCount(0);
        setFeedbackType('error');
        setFeedbackMessage(
          'Fallaste 3 veces, pero ya estás en el nivel más bajo. Intenta nuevamente.',
        );

        handleReplace();
        prevHasError.current = state.hasError;
        return;
      }

      setErrorCount(nextErrorCount);

      if (nextErrorCount === MAX_ERRORS - 1 && previousDifficulty) {
        setFeedbackType('warning');
        setFeedbackMessage(
          `1 fallo más y bajas a ${getDifficultyLabel(previousDifficulty)}.`,
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

  // Reset errorCount al cambiar de ejercicio
  React.useEffect(() => {
    setErrorCount(0);
  }, [current?.expression]);

  // Misión completada — sale directo sin modal
  React.useEffect(() => {
    if (!state.isCompleted) return;

    const next = missionCount + 1;

    setFeedbackType('success');
    setFeedbackMessage('Correcto.');

    if (next >= quantity) {
      onComplete();
    } else {
      setMissionCount(next);

      setTimeout(() => {
        setFeedbackMessage('');
        handleReplace();
      }, 500);
    }
  }, [state.isCompleted]);

  const displayExpression = current?.expression
    ? current.expression
    : current
    ? `${current.num1} ${current.operation} ${current.num2}`
    : '...';

  const feedbackColor =
    feedbackType === 'success'
      ? '#4ADE80'
      : feedbackType === 'warning'
      ? style.accentColor
      : '#F87171';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.screen}>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: style.bgColor,
                borderColor: style.accentColor + '40',
              },
            ]}
          >
            <Text style={[styles.pillText, { color: style.accentColor }]}>
              {style.label}
            </Text>
          </View>

          <View style={styles.timeBlock}>
            <Text
              style={[
                styles.time,
                { fontSize: width < 380 ? 44 : 52 },
              ]}
            >
              {time}
            </Text>

            <Text style={styles.dateLabel}>
              {day} - {alarmLabel ?? 'Hora de levantarse'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.body}>
            <Text style={styles.instruction}>
              Resuelve la operación matemática
            </Text>

            <View
              style={[
                styles.mathBox,
                {
                  backgroundColor: style.bgColor,
                  borderColor: style.accentColor + '30',
                },
              ]}
            >
              <Text
                style={[
                  styles.mathExpression,
                  {
                    color: style.accentColor,
                    fontSize: width < 380 ? 22 : 26,
                  },
                ]}
              >
                {displayExpression} = ?
              </Text>
            </View>

            <Text style={[styles.hint, { color: style.accentColor + '80' }]}>
              Ingresa tu respuesta numérica
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: state.hasError
                    ? '#F87171'
                    : style.accentColor + '60',
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
              placeholder="0"
              placeholderTextColor="#334455"
              keyboardType="number-pad"
              maxLength={8}
            />

            {feedbackMessage ? (
              <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                {feedbackMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: style.accentColor },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, { color: style.textColor }]}>
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingTop: 40,
  },

  pill: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 0.5,
  },

  pillText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  timeBlock: {
    alignItems: 'center',
    paddingVertical: 10,
  },

  time: {
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 56,
  },

  dateLabel: {
    fontSize: 12,
    color: '#556677',
    marginTop: 2,
  },

  divider: {
    height: 0.5,
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginVertical: 10,
  },

  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },

  instruction: {
    fontSize: 12,
    color: '#667788',
    marginBottom: 12,
  },

  mathBox: {
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 0.5,
  },

  mathExpression: {
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    flexWrap: 'wrap',
  },

  input: {
    backgroundColor: '#161616',
    borderWidth: 0.5,
    borderRadius: 10,
    height: 52,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'monospace',
    marginBottom: 6,
  },

  feedbackText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },

  hint: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
  },

  confirmBtn: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },

  confirmText: {
    fontSize: 15,
    fontWeight: '500',
  },
});