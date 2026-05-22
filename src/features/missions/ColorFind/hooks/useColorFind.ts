import { useCallback, useEffect, useState } from 'react';
import { generateColorFindChallenge } from '../constants/colorFind.config';
import { ColorFindChallenge, Difficulty } from '../types/colorFind.types';

export function useColorFind(difficulty: Difficulty) {
  const [current, setCurrent] = useState<ColorFindChallenge>(() =>
    generateColorFindChallenge(difficulty),
  );

  useEffect(() => {
    setCurrent(generateColorFindChallenge(difficulty));
  }, [difficulty]);

  const reset = useCallback(() => {
    setCurrent(previous =>
      generateColorFindChallenge(difficulty, previous.oddIndex, previous.baseColor),
    );
  }, [difficulty]);

  const isCorrectTile = useCallback(
    (tileId: string) => current.tiles.some(tile => tile.id === tileId && tile.isOdd),
    [current.tiles],
  );

  return {
    current,
    reset,
    isCorrectTile,
  };
}
