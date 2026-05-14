import { useCallback, useEffect, useState } from 'react';
import {
  ColoredFigureChallenge,
  ColoredFiguresChallengeState,
  Difficulty,
} from '../types/ColoredFigures.types';
import {
  generateColoredFigureChallenge,
  isCorrectAnswer,
} from '../constants/ColoredFigure.config';

export function useColoredFigures(difficulty: Difficulty) {
  const [current, setCurrent] = useState<ColoredFigureChallenge>(() =>
    generateColoredFigureChallenge(difficulty)
  );

  const [state, setState] = useState<ColoredFiguresChallengeState>({
    userInput: '',
    hasError: false,
    isCompleted: false,
  });

  useEffect(() => {
    const next = generateColoredFigureChallenge(difficulty);

    setCurrent(next);
    setState({
      userInput: '',
      hasError: false,
      isCompleted: false,
    });
  }, [difficulty]);

  const handleInputChange = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      userInput: text,
      hasError: false,
    }));
  }, []);

  const handleConfirm = useCallback((): boolean | null => {
    if (!state.userInput.trim()) return null;

    const isCorrect = isCorrectAnswer(current, state.userInput);

    setState(prev => ({
      ...prev,
      hasError: !isCorrect,
      isCompleted: isCorrect,
    }));

    return isCorrect;
  }, [current, state.userInput]);

  const handleReplace = useCallback(() => {
    const next = generateColoredFigureChallenge(difficulty, current.hex);

    setCurrent(next);
    setState({
      userInput: '',
      hasError: false,
      isCompleted: false,
    });
  }, [difficulty, current.hex]);

  const reset = useCallback(() => {
    const next = generateColoredFigureChallenge(difficulty);

    setCurrent(next);
    setState({
      userInput: '',
      hasError: false,
      isCompleted: false,
    });
  }, [difficulty]);

  return {
    current,
    state,
    handleInputChange,
    handleConfirm,
    handleReplace,
    reset,
  };
}