import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from '../../../auth/hooks/useAuth';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';
import { ColorFindGrid } from './ColorFindGrid';
import { DIFFICULTY_STYLES } from '../constants/colorFind.config';
import { useColorFind } from '../hooks/useColorFind';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { Difficulty } from '../types/colorFind.types';

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
  return DIFFICULTY_STYLES[difficulty].label.toLowerCase();
}

export function ColorFindMission({
  difficulty: initialDifficulty,
  quantity,
  onComplete,
  alarmLabel,
}: Props) {
  const { width } = useWindowDimensions();
  const { user, isAuthenticated, isGuest } = useAuth();
  const { time, day } = useCurrentTime();
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] =
    useState<'error' | 'warning' | 'success'>('error');
  const { current, reset, isCorrectTile } = useColorFind(difficulty);

  const style = DIFFICULTY_STYLES[difficulty];
  const totalQuantity = Math.max(1, quantity);
  const displayAlarmLabel = !alarmLabel || alarmLabel === 'Alarma'
    ? 'Hora de levantarse'
    : alarmLabel;

  const saveMissionHistory = React.useCallback(
    (success: boolean, nextErrorCount: number, selectedTileId: string) => {
      if (!isAuthenticated || isGuest || !user?.id) return;

      const selectedTile = current.tiles.find(tile => tile.id === selectedTileId);

      MissionHistoryLocalService.save({
        userId: user.id,
        missionType: 'color_find',
        difficulty,
        content: {
          gridSize: current.gridSize,
          baseColor: current.baseColor,
          oddColor: current.oddColor,
          oddIndex: current.oddIndex,
        },
        correctAnswer: `tile_${current.oddIndex}`,
        userAnswer: selectedTile ? `tile_${current.tiles.indexOf(selectedTile)}` : 'unknown',
        success,
        errorCount: nextErrorCount,
        durationSeconds: null,
      });

      void syncMissionHistory(user.id);
    },
    [
      current.baseColor,
      current.gridSize,
      current.oddColor,
      current.oddIndex,
      current.tiles,
      difficulty,
      isAuthenticated,
      isGuest,
      user?.id,
    ],
  );

  const handleWrongAnswer = (tileId: string) => {
    const nextErrorCount = errorCount + 1;
    const previousDifficulty = getPreviousDifficulty(difficulty);

    saveMissionHistory(false, nextErrorCount, tileId);

    if (nextErrorCount >= MAX_ERRORS && previousDifficulty) {
      setDifficulty(previousDifficulty);
      setErrorCount(0);
      setFeedbackType('warning');
      setFeedbackMessage(
        `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(previousDifficulty)}.`,
      );
      return;
    }

    if (nextErrorCount >= MAX_ERRORS && !previousDifficulty) {
      setErrorCount(0);
      setFeedbackType('error');
      setFeedbackMessage(
        'Fallaste 3 veces, pero ya estas en el nivel mas bajo. Intenta nuevamente.',
      );
      reset();
      return;
    }

    setErrorCount(nextErrorCount);

    if (nextErrorCount === MAX_ERRORS - 1 && previousDifficulty) {
      setFeedbackType('warning');
      setFeedbackMessage(
        `1 fallo mas y bajas a ${getDifficultyLabel(previousDifficulty)}.`,
      );
      return;
    }

    const remainingErrors = MAX_ERRORS - nextErrorCount;
    setFeedbackType('error');
    setFeedbackMessage(
      `No es ese color. Te quedan ${remainingErrors} intento${
        remainingErrors === 1 ? '' : 's'
      }.`,
    );
  };

  const handleTilePress = (tileId: string) => {
    if (!isCorrectTile(tileId)) {
      handleWrongAnswer(tileId);
      return;
    }

    const nextCompleted = completedCount + 1;

    saveMissionHistory(true, errorCount, tileId);
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
    }, 450);
  };

  const feedbackColor =
    feedbackType === 'success'
      ? Colors.success
      : feedbackType === 'warning'
      ? style.accentColor
      : Colors.danger;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View
          style={[
            styles.pill,
            { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' },
          ]}
        >
          <Text style={[styles.pillText, { color: style.accentColor }]}>
            {style.label}
          </Text>
        </View>

        <View style={styles.timeBlock}>
          <Text style={[styles.time, { fontSize: width < 380 ? 44 : 52 }]}>
            {time}
          </Text>
          <Text style={styles.dateLabel}>{day} - {displayAlarmLabel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.body}>
          <Text style={styles.instruction}>Encuentra el color diferente:</Text>

          <View style={styles.gridBox}>
            <ColorFindGrid
              challenge={current}
              accentColor={style.accentColor}
              onTilePress={handleTilePress}
            />
          </View>

          <Text style={styles.progressText}>
            {completedCount} / {totalQuantity}
          </Text>

          {feedbackMessage ? (
            <Text style={[styles.feedbackText, { color: feedbackColor }]}>
              {feedbackMessage}
            </Text>
          ) : null}

          <View style={styles.spacer} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
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
  pillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeBlock: { alignItems: 'center', paddingVertical: 10 },
  time: { fontWeight: '500', color: Colors.text, letterSpacing: -1, lineHeight: 56 },
  dateLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
  },
  instruction: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  gridBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.controlRadius,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  feedbackText: { fontSize: 11, textAlign: 'center', marginTop: 6 },
  spacer: { flex: 1 },
});
