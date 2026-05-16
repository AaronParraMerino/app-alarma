import React, { useState } from 'react';
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

import { Difficulty, FigureType } from '../types/ColoredFigures.types';
import { DIFFICULTY_STYLES } from '../constants/ColoredFigure.config';
import { useColoredFigures } from '../hooks/useColoredFigures';
import { useCurrentTime } from '../hooks/useCurrentTime';

import { useAuth } from '../../../auth/hooks/useAuth';
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

  if (currentIndex <= 0) {
    return null;
  }

  return DIFFICULTY_ORDER[currentIndex - 1];
}

function getDifficultyLabel(difficulty: Difficulty) {
  return DIFFICULTY_STYLES[difficulty].label.toLowerCase();
}

export function ColoredFiguresMission({
  difficulty,
  quantity,
  onComplete,
  alarmLabel,
}: Props) {
  const { user, isAuthenticated, isGuest } = useAuth();

  const [currentDifficulty, setCurrentDifficulty] =
    useState<Difficulty>(difficulty);

  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] =
    useState<'error' | 'warning' | 'success'>('error');

  const {
    current,
    state,
    handleInputChange,
    handleConfirm,
    reset,
  } = useColoredFigures(currentDifficulty);

  const { time, day } = useCurrentTime();
  const style = DIFFICULTY_STYLES[currentDifficulty];
  const totalQuantity = Math.max(1, quantity);

  React.useEffect(() => {
    setErrorCount(0);
    reset();
  }, [currentDifficulty]);

  const saveMissionHistory = React.useCallback(
    (success: boolean, nextErrorCount: number) => {
      if (!isAuthenticated || isGuest || !user?.id || !current) {
        return;
      }

      MissionHistoryLocalService.save({
        userId: user.id,
        missionType: 'colored_figures',
        difficulty: currentDifficulty,
        content: {
          figure: current.figure,
          hex: current.hex,
          colorName: current.colorName,
          colorDisplayName: current.colorDisplayName,
        },
        correctAnswer: current.colorName,
        userAnswer: state.userInput,
        success,
        errorCount: nextErrorCount,
        durationSeconds: null,
      });

      void syncMissionHistory(user.id);
    },
    [
      isAuthenticated,
      isGuest,
      user?.id,
      current,
      currentDifficulty,
      state.userInput,
    ],
  );

  const handleSubmit = () => {
    const result = handleConfirm();

    if (result === null) {
      return;
    }

    if (!result) {
      const nextErrorCount = errorCount + 1;
      const previousDifficulty = getPreviousDifficulty(currentDifficulty);

      saveMissionHistory(false, nextErrorCount);

      if (nextErrorCount >= MAX_ERRORS && previousDifficulty) {
        setCurrentDifficulty(previousDifficulty);
        setErrorCount(0);
        setFeedbackType('warning');
        setFeedbackMessage(
          `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(
            previousDifficulty,
          )}.`,
        );

        return;
      }

      if (nextErrorCount >= MAX_ERRORS && !previousDifficulty) {
        setErrorCount(0);
        setFeedbackType('error');
        setFeedbackMessage(
          'Fallaste 3 veces, pero ya estás en el nivel más bajo. Intenta nuevamente.',
        );

        setTimeout(() => {
          reset();
        }, 300);

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
          `Color incorrecto. Te quedan ${remainingErrors} intento${
            remainingErrors === 1 ? '' : 's'
          }.`,
        );
      }

      return;
    }

    const nextCompleted = completedCount + 1;

    saveMissionHistory(true, errorCount);

    setCompletedCount(nextCompleted);
    setErrorCount(0);
    setFeedbackType('success');
    setFeedbackMessage('Correcto.');

    if (nextCompleted >= totalQuantity) {
      onComplete();
      return;
    }

    setTimeout(() => {
      setFeedbackMessage('');
      reset();
    }, 500);
  };

  const renderFigure = (figure: FigureType, color: string) => {
    if (figure === 'circle') {
      return (
        <View
          style={[
            styles.figureBase,
            styles.circle,
            { backgroundColor: color },
          ]}
        />
      );
    }

    if (figure === 'square') {
      return (
        <View
          style={[
            styles.figureBase,
            styles.square,
            { backgroundColor: color },
          ]}
        />
      );
    }

    if (figure === 'rectangle') {
      return (
        <View
          style={[
            styles.rectangle,
            { backgroundColor: color },
          ]}
        />
      );
    }

    if (figure === 'diamond') {
      return (
        <View
          style={[
            styles.diamond,
            { backgroundColor: color },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.triangle,
          { borderBottomColor: color },
        ]}
      />
    );
  };

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: style.bgColor }]}>
              <Text style={[styles.badgeText, { color: style.accentColor }]}>
                {style.label}
              </Text>
            </View>

            <Text style={styles.time}>{time}</Text>
            <Text style={styles.day}>{day}</Text>

            {alarmLabel ? (
              <Text style={styles.alarmLabel}>{alarmLabel}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.instruction}>
              Escribe el color de la figura
            </Text>

            <View style={styles.figureContainer}>
              {renderFigure(current.figure, current.hex)}
            </View>
          </View>

          <TextInput
            value={state.userInput}
            onChangeText={(value) => {
              handleInputChange(value);

              if (feedbackMessage) {
                setFeedbackMessage('');
              }
            }}
            placeholder="Escribe el color"
            placeholderTextColor="#556677"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              { borderColor: style.accentColor },
              state.hasError ? styles.inputError : null,
              state.isCompleted ? styles.inputSuccess : null,
            ]}
            onSubmitEditing={handleSubmit}
          />

          {feedbackMessage ? (
            <Text style={[styles.feedbackText, { color: feedbackColor }]}>
              {feedbackMessage}
            </Text>
          ) : null}

          <View style={styles.spacer} />

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
            onPress={handleSubmit}
          >
            <Text style={styles.confirmBtnText}>Confirmar</Text>
          </TouchableOpacity>
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

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },

  badge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 6,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  time: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 56,
  },

  day: {
    fontSize: 14,
    color: '#8EA4B8',
  },

  alarmLabel: {
    fontSize: 12,
    color: '#556677',
    marginTop: 2,
  },

  card: {
    backgroundColor: '#111A24',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1C2A38',
  },

  instruction: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },

  figureContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  figureBase: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },

  circle: {
    borderRadius: 60,
  },

  square: {
    borderRadius: 12,
  },

  rectangle: {
    width: 150,
    height: 95,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },

  diamond: {
    width: 110,
    height: 110,
    borderRadius: 12,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },

  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 130,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0D0D0D',
    borderWidth: 2,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    marginTop: 16,
    marginBottom: 6,
  },

  inputError: {
    borderColor: '#F87171',
  },

  inputSuccess: {
    borderColor: '#4ADE80',
  },

  feedbackText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },

  spacer: {
    flex: 1,
  },

  confirmBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  confirmBtnText: {
    color: '#0D0D0D',
    fontSize: 15,
    fontWeight: '700',
  },
});