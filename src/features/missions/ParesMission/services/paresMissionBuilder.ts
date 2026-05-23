import { PAIR_CARD_ASSETS } from '../constants/paresAssets';
import {
  BOARD_CELLS_BY_DIFFICULTY,
  FIXED_CENTER_INDEX_BY_DIFFICULTY,
  PAIRS_BY_DIFFICULTY,
} from '../constants/paresMission.config';
import { PairCard, PairsDifficulty } from '../types/paresMission.types';

// Mezcla las cartas para cada tablero
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

// Genera las cartas del tablero segun dificultad
export function buildPairsBoard(difficulty: PairsDifficulty): PairCard[] {
  const selectedAssets = shuffle(PAIR_CARD_ASSETS).slice(0, PAIRS_BY_DIFFICULTY[difficulty]);
  const cards = selectedAssets.flatMap(asset => [
    {
      id: `${asset.id}-a-${Date.now()}`,
      pairId: asset.id,
      name: asset.name,
      source: asset.source,
      matched: false,
    },
    {
      id: `${asset.id}-b-${Date.now()}`,
      pairId: asset.id,
      name: asset.name,
      source: asset.source,
      matched: false,
    },
  ]);

  const shuffled = shuffle(cards);
  const fixedIndex = FIXED_CENTER_INDEX_BY_DIFFICULTY[difficulty];

  if (fixedIndex == null) {
    return shuffled;
  }

  const board = [
    ...shuffled.slice(0, fixedIndex),
    {
      id: `fixed-${Date.now()}`,
      pairId: 'fixed',
      name: 'Bloque fijo',
      source: null,
      matched: true,
      fixed: true,
    },
    ...shuffled.slice(fixedIndex),
  ];

  return board.slice(0, BOARD_CELLS_BY_DIFFICULTY[difficulty]);
}
