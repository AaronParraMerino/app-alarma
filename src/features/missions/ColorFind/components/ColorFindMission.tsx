import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from '../../../auth/hooks/useAuth';
import { Layout } from '../../../../shared/theme/layout';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';
import { MissionCompleteModal } from '../../../../shared/components/missions/MissionCompleteModal';
import { MissionErrorCounter } from '../../../../shared/components/missions/MissionErrorCounter';
import { OpportunityBar } from '../../../../shared/components/missions/OpportunityBar';
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
const MAX_GAME_ERRORS = 3;
const MAX_CHALLENGE_MISSES: Record<Difficulty, number> = {
  easy: 2,
  medium: 4,
  hard: 6,
};

function getPreviousDifficulty(difficulty: Difficulty): Difficulty | null {
  const currentIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  return currentIndex > 0 ? DIFFICULTY_ORDER[currentIndex - 1] : null;
}

function getDifficultyLabel(difficulty: Difficulty, isSpanish: boolean) {
  if (difficulty === 'easy') {
    return isSpanish ? 'facil' : 'easy';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'medio' : 'medium';
  }

  return isSpanish ? 'dificil' : 'hard';
}

function getDifficultyBadgeLabel(difficulty: Difficulty, isSpanish: boolean) {
  if (difficulty === 'easy') {
    return isSpanish ? 'FACIL' : 'EASY';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'MEDIO' : 'MEDIUM';
  }

  return isSpanish ? 'DIFICIL' : 'HARD';
}

function translateDay(day: string, isSpanish: boolean): string {
  if (isSpanish) {
    return day;
  }

  const normalized = day
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const days: Record<string, string> = {
    domingo: 'Sunday',
    lunes: 'Monday',
    martes: 'Tuesday',
    miercoles: 'Wednesday',
    jueves: 'Thursday',
    viernes: 'Friday',
    sabado: 'Saturday',
  };

  return days[normalized] ?? day;
}

export function ColorFindMission({
  difficulty: initialDifficulty,
  quantity,
  onComplete,
  alarmLabel,
}: Props) {
  const { width } = useWindowDimensions();
  const { colors, statusBarStyle } = useAppTheme();
  const { language } = useTranslation();
  const { user, isAuthenticated, isGuest } = useAuth();
  const { time, day } = useCurrentTime();
  const isSpanish = language === 'es';
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [completedCount, setCompletedCount] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameErrorCount, setGameErrorCount] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] =
    useState<'error' | 'warning' | 'success'>('error');
  const [missionCompleted, setMissionCompleted] = useState(false);
  const { current, reset, isCorrectTile } = useColorFind(difficulty);

  const style = DIFFICULTY_STYLES[difficulty];
  const totalQuantity = Math.max(1, quantity);
  const maxMisses = MAX_CHALLENGE_MISSES[difficulty];
  const remaining = maxMisses - misses;
  const displayAlarmLabel = !alarmLabel || alarmLabel === 'Alarma'
    ? isSpanish
      ? 'Hora de levantarse'
      : 'Time to wake up'
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

  const handleChallengeFailure = (tileId: string, nextMisses: number) => {
    const nextGameErrorCount = gameErrorCount + 1;
    const previousDifficulty = getPreviousDifficulty(difficulty);

    saveMissionHistory(false, nextMisses, tileId);

    if (nextGameErrorCount >= MAX_GAME_ERRORS && previousDifficulty) {
      setDifficulty(previousDifficulty);
      setMisses(0);
      setGameErrorCount(0);
      setFeedbackType('warning');
      setFeedbackMessage(
        isSpanish
          ? `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(previousDifficulty, true)}.`
          : `You failed 3 times. You dropped to ${getDifficultyLabel(previousDifficulty, false)}.`,
      );
      reset();
      return;
    }

    if (nextGameErrorCount >= MAX_GAME_ERRORS && !previousDifficulty) {
      setMisses(0);
      setGameErrorCount(0);
      setFeedbackType('error');
      setFeedbackMessage(
        isSpanish
          ? 'Fallaste 3 veces, pero ya estas en el nivel mas bajo. Intenta nuevamente.'
          : 'You failed 3 times, but you are already at the lowest level. Try again.',
      );
      reset();
      return;
    }

    setMisses(0);
    setGameErrorCount(nextGameErrorCount);
    setFeedbackType(previousDifficulty ? 'warning' : 'error');
    setFeedbackMessage(
      previousDifficulty
        ? isSpanish
          ? `Se agotaron tus oportunidades. Te quedan ${
              MAX_GAME_ERRORS - nextGameErrorCount
            } intento${
              MAX_GAME_ERRORS - nextGameErrorCount === 1 ? '' : 's'
            } antes de bajar de nivel.`
          : `You ran out of chances. You have ${
              MAX_GAME_ERRORS - nextGameErrorCount
            } attempt${
              MAX_GAME_ERRORS - nextGameErrorCount === 1 ? '' : 's'
            } before dropping a level.`
        : isSpanish
          ? 'Se agotaron tus oportunidades. Intenta nuevamente.'
          : 'You ran out of chances. Try again.',
    );
    reset();
  };

  const handleWrongAnswer = (tileId: string) => {
    const nextMisses = misses + 1;

    setMisses(nextMisses);

    if (nextMisses >= maxMisses) {
      handleChallengeFailure(tileId, nextMisses);
      return;
    }

    const remainingMisses = maxMisses - nextMisses;
    setFeedbackType('error');
    setFeedbackMessage(
      isSpanish
        ? `No es ese color. Te quedan ${remainingMisses} oportunidad${
            remainingMisses === 1 ? '' : 'es'
          }.`
        : `That is not the different color. You have ${remainingMisses} chance${
            remainingMisses === 1 ? '' : 's'
          } left.`,
    );
  };

  const handleTilePress = (tileId: string) => {
    if (!isCorrectTile(tileId)) {
      handleWrongAnswer(tileId);
      return;
    }

    const nextCompleted = completedCount + 1;

    saveMissionHistory(true, misses, tileId);
    setCompletedCount(nextCompleted);
    setMisses(0);
    setGameErrorCount(0);
    setFeedbackType('success');
    setFeedbackMessage(isSpanish ? 'Correcto.' : 'Correct.');

    if (nextCompleted >= totalQuantity) {
      setMissionCompleted(true);
      return;
    }

    setTimeout(() => {
      setFeedbackMessage('');
      reset();
    }, 450);
  };

  const feedbackColor =
    feedbackType === 'success'
      ? colors.success
      : feedbackType === 'warning'
      ? style.accentColor
      : colors.danger;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.pill,
            { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' },
          ]}
        >
          <Text style={[styles.pillText, { color: style.accentColor }]}>
            {getDifficultyBadgeLabel(difficulty, isSpanish)}
          </Text>
        </View>

        <View style={styles.timeBlock}>
          <Text
            style={[
              styles.time,
              {
                color: colors.text,
                fontSize: width < 380 ? 44 : 52,
              },
            ]}
          >
            {time}
          </Text>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
            {translateDay(day, isSpanish)} - {displayAlarmLabel}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.progressWrap}>
          <OpportunityBar
            remaining={remaining}
            total={maxMisses}
            color={style.accentColor}
            trackColor={colors.border}
          />
          <Text style={[styles.chancesText, { color: style.accentColor + 'AA' }]}>
            {remaining} {isSpanish ? 'oportunidades' : 'chances'}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            {isSpanish ? 'Encuentra el color diferente:' : 'Find the different color:'}
          </Text>

          <View
            style={[
              styles.gridBox,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <ColorFindGrid
              challenge={current}
              accentColor={style.accentColor}
              onTilePress={handleTilePress}
            />
          </View>

          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {completedCount} / {totalQuantity}
          </Text>

          {feedbackMessage ? (
            <Text style={[styles.feedbackText, { color: feedbackColor }]}>
              {feedbackMessage}
            </Text>
          ) : null}

          <MissionErrorCounter
            count={gameErrorCount}
            max={MAX_GAME_ERRORS}
            color={feedbackType === 'warning' ? style.accentColor : undefined}
          />

          <View style={styles.spacer} />
        </View>
      </View>

      <MissionCompleteModal
        visible={missionCompleted}
        completedCount={totalQuantity}
        totalCount={totalQuantity}
        onContinue={onComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: {
    flex: 1,
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
  time: { fontWeight: '500', letterSpacing: -1, lineHeight: 56 },
  dateLabel: { fontSize: 12, marginTop: 2 },
  divider: {
    height: 0.5,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  progressWrap: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    gap: 6,
    marginBottom: 10,
  },
  chancesText: { fontSize: 11, textAlign: 'center' },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
  },
  instruction: { fontSize: 12, marginBottom: 12 },
  gridBox: {
    borderRadius: Layout.controlRadius,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  feedbackText: { fontSize: 11, textAlign: 'center', marginTop: 6 },
  spacer: { flex: 1 },
});
