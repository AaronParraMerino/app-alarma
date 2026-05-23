import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';
import { useAuth } from '../../../auth/hooks/useAuth';
import { PairCardTile } from '../components/PairCardTile';
import { OpportunityBar } from '../components/OpportunityBar';
import {
  BOARD_CELLS_BY_DIFFICULTY,
  DIFFICULTY_STYLES,
  GRID_SIZE,
  MAX_BOARD_MISSES,
  PAIRS_BY_DIFFICULTY,
} from '../constants/paresMission.config';
import { preloadPairCardAssets } from '../constants/paresAssets';
import { buildPairsBoard } from '../services/paresMissionBuilder';
import { PairCard, PairsDifficulty } from '../types/paresMission.types';
import { useCurrentTime } from '../../hooks/useCurrentTime';

interface Props {
  difficulty: PairsDifficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
}

const DIFFICULTY_ORDER: PairsDifficulty[] = ['easy', 'medium', 'hard'];
const MAX_GAME_ERRORS = 3;
const MISMATCH_REVEAL_DELAY_MS = 450;
const MISMATCH_HIDE_DELAY_MS = 1150;

const PAIR_NAME_TRANSLATIONS: Record<string, string> = {
  arbol: 'Tree',
  astronauta: 'Astronaut',
  avion: 'Plane',
  balon: 'Ball',
  barco: 'Boat',
  bombilla: 'Light bulb',
  castillo: 'Castle',
  coche: 'Car',
  cofre: 'Chest',
  cohete: 'Rocket',
  conejo: 'Rabbit',
  corona: 'Crown',
  elefante: 'Elephant',
  estrella: 'Star',
  gato: 'Cat',
  llave: 'Key',
  manzana: 'Apple',
  perro: 'Dog',
  regalo: 'Gift',
  sol: 'Sun',
  tierra: 'Earth',
};

function getPairName(id: string, name: string, isSpanish: boolean) {
  return isSpanish ? name : PAIR_NAME_TRANSLATIONS[id] ?? name;
}

// Obtiene la dificultad anterior
function getPreviousDifficulty(difficulty: PairsDifficulty): PairsDifficulty | null {
  const currentIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  return currentIndex > 0 ? DIFFICULTY_ORDER[currentIndex - 1] : null;
}

// Obtiene la etiqueta de dificultad
function getDifficultyLabel(difficulty: PairsDifficulty, isSpanish: boolean) {
  const labels: Record<PairsDifficulty, { es: string; en: string }> = {
    easy: { es: 'facil', en: 'easy' },
    medium: { es: 'medio', en: 'medium' },
    hard: { es: 'dificil', en: 'hard' },
  };

  return labels[difficulty][isSpanish ? 'es' : 'en'];
}

// Construye el mensaje de fallo de juego segun la dificultad
function getGameFailureMessage(
  nextGameErrorCount: number,
  previousDifficulty: PairsDifficulty | null,
  isSpanish: boolean,
) {
  const remainingErrors = MAX_GAME_ERRORS - nextGameErrorCount;

  if (remainingErrors === 1 && previousDifficulty) {
    return isSpanish
      ? `1 fallo mas y bajas a ${getDifficultyLabel(previousDifficulty, true)}.`
      : `1 more miss and you drop to ${getDifficultyLabel(previousDifficulty, false)}.`;
  }

  if (previousDifficulty) {
    return isSpanish
      ? `Juego fallido. Te quedan ${remainingErrors} intento${
          remainingErrors === 1 ? '' : 's'
        } antes de bajar de nivel.`
      : `Board failed. You have ${remainingErrors} attempt${
          remainingErrors === 1 ? '' : 's'
        } before dropping a level.`;
  }

  return isSpanish
    ? 'Juego fallido. Intenta nuevamente.'
    : 'Board failed. Try again.';
}

// Obtiene los pares resueltos del tablero
function getMatchedPairs(cards: PairCard[]) {
  return new Set(cards.filter(card => card.matched && !card.fixed).map(card => card.pairId)).size;
}

// Divide el tablero en filas de tamano fijo
function chunkBoardRows(cards: PairCard[], size: number) {
  const rows: PairCard[][] = [];

  for (let index = 0; index < cards.length; index += size) {
    rows.push(cards.slice(index, index + size));
  }

  return rows;
}

export function ParesMissionScreen({
  difficulty: initialDifficulty,
  quantity,
  onComplete,
  alarmLabel,
}: Props) {
  const { width, height } = useWindowDimensions();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const { time, day } = useCurrentTime(language);
  const { user, isAuthenticated, isGuest } = useAuth();
  const [difficulty, setDifficulty] = useState<PairsDifficulty>(initialDifficulty);
  const [board, setBoard] = useState<PairCard[]>(() => buildPairsBoard(initialDifficulty));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mismatchIds, setMismatchIds] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [gameErrorCount, setGameErrorCount] = useState(0);
  const [missionCount, setMissionCount] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] =
    useState<'error' | 'warning' | 'success'>('error');
  const [locked, setLocked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startedAtRef = React.useRef(Date.now());

  const style = DIFFICULTY_STYLES[difficulty];
  const difficultyLabel = getDifficultyLabel(difficulty, isSpanish).toUpperCase();
  const gridSize = GRID_SIZE[difficulty];
  const boardCells = BOARD_CELLS_BY_DIFFICULTY[difficulty];
  const maxMisses = MAX_BOARD_MISSES[difficulty];
  const remaining = maxMisses - misses;
  const defaultAlarmLabel = isSpanish ? 'Hora de levantarse' : 'Time to wake up';
  const displayAlarmLabel = !alarmLabel || alarmLabel === 'Alarma'
    ? defaultAlarmLabel
    : alarmLabel;
  const matchedPairs = useMemo(() => getMatchedPairs(board), [board]);
  const totalPairs = PAIRS_BY_DIFFICULTY[difficulty];
  const boardRows = useMemo(() => chunkBoardRows(board, gridSize), [board, gridSize]);
  const isSmall = width < 360;
  const isShort = height < 680;
  const boardGap = isSmall ? 8 : 10;
  const boardPadding = 12;
  const boardSize = Math.min(width - (Layout.screenPadding * 2), isShort ? 330 : 380);
  const boardInnerSize = boardSize - (boardPadding * 2);
  const cardSize = (boardInnerSize - boardGap * (gridSize - 1)) / gridSize;

  // Precarga imagenes para evitar saltos al voltear cartas
  useEffect(() => {
    void preloadPairCardAssets();
  }, []);

  // Reinicia el tablero manteniendo la dificultad actual
  const resetBoard = React.useCallback((nextDifficulty = difficulty) => {
    startedAtRef.current = Date.now();
    setDifficulty(nextDifficulty);
    setBoard(buildPairsBoard(nextDifficulty));
    setSelectedIds([]);
    setMismatchIds([]);
    setMisses(0);
    setLocked(false);
  }, [difficulty]);

  // Guarda el resultado del tablero para usuarios registrados
  const saveMissionHistory = React.useCallback((success: boolean, nextMisses: number) => {
    if (!isAuthenticated || isGuest || !user?.id) return;

    const pairNames = board
      .filter(card => !card.fixed)
      .filter((card, index, cards) => cards.findIndex(item => item.pairId === card.pairId) === index)
      .map(card => card.name);

    MissionHistoryLocalService.save({
      userId: user.id,
      missionType: 'memory_pairs',
      difficulty,
      content: {
        board: `${gridSize}x${gridSize}`,
        cells: boardCells,
        pairs: pairNames,
        matchedPairs,
      },
      correctAnswer: pairNames.join(', '),
      userAnswer: success ? 'pares_encontrados' : 'oportunidades_agotadas',
      success,
      errorCount: nextMisses,
      durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
    });

    void syncMissionHistory(user.id);
  }, [
    board,
    boardCells,
    difficulty,
    gridSize,
    isAuthenticated,
    isGuest,
    matchedPairs,
    user?.id,
  ]);

  // Procesa una derrota de tablero
  const handleBoardFailure = React.useCallback((nextMisses: number) => {
    saveMissionHistory(false, nextMisses);

    const nextGameErrorCount = gameErrorCount + 1;
    const previousDifficulty = getPreviousDifficulty(difficulty);

    if (nextGameErrorCount >= MAX_GAME_ERRORS && previousDifficulty) {
      setGameErrorCount(0);
      setFeedbackType('warning');
      setFeedbackMessage(
        isSpanish
          ? `Fallaste 3 veces. Bajaste a ${getDifficultyLabel(previousDifficulty, true)}.`
          : `You missed 3 times. You dropped to ${getDifficultyLabel(previousDifficulty, false)}.`,
      );
      resetBoard(previousDifficulty);
      return;
    }

    if (nextGameErrorCount >= MAX_GAME_ERRORS && !previousDifficulty) {
      setGameErrorCount(0);
      setFeedbackType('error');
      setFeedbackMessage(
        isSpanish
          ? 'Fallaste 3 veces, pero ya estas en el nivel mas bajo. Intenta nuevamente.'
          : 'You missed 3 times, but you are already on the lowest level. Try again.',
      );
      resetBoard(difficulty);
      return;
    }

    setGameErrorCount(nextGameErrorCount);

    setFeedbackType(previousDifficulty ? 'warning' : 'error');
    setFeedbackMessage(getGameFailureMessage(nextGameErrorCount, previousDifficulty, isSpanish));

    resetBoard(difficulty);
  }, [difficulty, gameErrorCount, isSpanish, resetBoard, saveMissionHistory]);

  // Maneja la seleccion de cartas
  const handleSelectCard = (card: PairCard) => {
    if (locked || card.fixed || card.matched || selectedIds.includes(card.id)) return;

    if (feedbackMessage && feedbackType !== 'warning') {
      setFeedbackMessage('');
    }

    const nextSelectedIds = [...selectedIds, card.id];
    setSelectedIds(nextSelectedIds);
    setMismatchIds([]);

    if (nextSelectedIds.length < 2) return;

    const selectedCards = board.filter(item => nextSelectedIds.includes(item.id));
    const [first, second] = selectedCards;

    if (first?.pairId === second?.pairId) {
      setBoard(current =>
        current.map(item =>
          nextSelectedIds.includes(item.id) ? { ...item, matched: true } : item,
        ),
      );
      setSelectedIds([]);
      setFeedbackType('success');
      setFeedbackMessage(isSpanish ? 'Correcto.' : 'Correct.');
      return;
    }

    const nextMisses = misses + 1;
    setMisses(nextMisses);
    setLocked(true);
    setFeedbackType('error');

    if (nextMisses >= maxMisses) {
      setTimeout(() => {
        setMismatchIds(nextSelectedIds);
      }, MISMATCH_REVEAL_DELAY_MS);
      setTimeout(() => handleBoardFailure(nextMisses), MISMATCH_HIDE_DELAY_MS);
      return;
    }

    setTimeout(() => {
      setMismatchIds(nextSelectedIds);
    }, MISMATCH_REVEAL_DELAY_MS);

    setTimeout(() => {
      setSelectedIds([]);
      setMismatchIds([]);
      setLocked(false);
    }, MISMATCH_HIDE_DELAY_MS);
  };

  // Completa un tablero y avanza la cantidad configurada
  useEffect(() => {
    if (totalPairs === 0 || matchedPairs < totalPairs) return;

    saveMissionHistory(true, misses);
    const next = missionCount + 1;

    if (next >= quantity) {
      setCompleted(true);
      const timeout = setTimeout(onComplete, 900);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setMissionCount(next);
      setGameErrorCount(0);
      setFeedbackMessage('');
      resetBoard(difficulty);
    }, 800);

    return () => clearTimeout(timeout);
  }, [matchedPairs, totalPairs]);

  // Pantalla corta antes de volver al flujo de alarma.
  if (completed) {
    return (
      <CenteredState color={style.accentColor}>
        <Text style={[styles.stateIcon, { color: style.accentColor }]}>OK</Text>
        <Text style={[styles.stateTitle, { color: style.accentColor }]}>
          {isSpanish ? 'Mision completada' : 'Mission complete'}
        </Text>
        <Text style={styles.stateText}>
          {isSpanish
            ? `${quantity} tablero${quantity === 1 ? '' : 's'} completado${quantity === 1 ? '' : 's'}.`
            : `${quantity} board${quantity === 1 ? '' : 's'} completed.`}
        </Text>
      </CenteredState>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={[styles.pill, { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' }]}>
          <Text style={[styles.pillText, { color: style.accentColor }]}>{difficultyLabel}</Text>
        </View>

        <View style={styles.timeBlock}>
          <Text style={[styles.time, { fontSize: width < 380 ? 44 : 52 }]}>
            {time}
          </Text>
          <Text style={styles.dateLabel}>{day} - {displayAlarmLabel}</Text>
        </View>

        <View style={styles.progressWrap}>
          <OpportunityBar remaining={remaining} total={maxMisses} color={style.accentColor} />
          <Text style={[styles.progressText, { color: style.accentColor + 'AA' }]}>
            {remaining} {isSpanish ? 'oportunidades' : 'chances'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.body}>
          <Text style={styles.instruction}>
            {isSpanish ? 'Encuentra los pares:' : 'Find the pairs:'}
          </Text>
          <Text style={[styles.pairCounter, { color: style.accentColor }]}>
            {matchedPairs}/{totalPairs}
          </Text>

          <View
            style={[
              styles.board,
              {
                width: boardSize,
                height: boardSize,
                gap: boardGap,
                padding: boardPadding,
              },
            ]}
          >
            {boardRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={[styles.boardRow, { gap: boardGap }]}>
                {row.map(card => (
                  <PairCardTile
                    key={card.id}
                    name={getPairName(card.pairId, card.name, isSpanish)}
                    source={card.source}
                    fixed={card.fixed}
                    revealed={card.matched || selectedIds.includes(card.id)}
                    mismatched={mismatchIds.includes(card.id)}
                    accentColor={style.accentColor}
                    textColor={style.textColor}
                    size={cardSize}
                    onPress={() => handleSelectCard(card)}
                  />
                ))}
              </View>
            ))}
          </View>

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
        </View>
      </View>
    </SafeAreaView>
  );
}

function CenteredState({
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>{children}</View>
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
  progressWrap: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    gap: 6,
  },
  progressText: { fontSize: 11, textAlign: 'center' },
  divider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: 16, marginVertical: 10 },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
    alignItems: 'center',
  },
  instruction: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  pairCounter: {
    alignSelf: 'flex-start',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  board: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.controlRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  boardRow: {
    flexDirection: 'row',
  },
  feedbackText: { fontSize: 11, textAlign: 'center', marginBottom: 6 },
  hint: { fontSize: 11, textAlign: 'center' },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  stateIcon: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },
  stateTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
