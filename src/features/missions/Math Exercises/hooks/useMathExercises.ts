import { useState, useCallback } from 'react';
import { Difficulty, MathChallenge, MathExercisesState, OperationType } from '../types/mathExercises.types';
import { generateChallenges, OPERATION_SYMBOLS } from '../constants/mathExercises.config';

export function useMathExercises(
  difficulty: Difficulty,
  count: number = 1,
  operationType?: OperationType // 👈 nuevo parámetro
) {
  const [challenges, setChallenges] = useState<MathChallenge[]>(() =>
    generateChallenges(difficulty, count, operationType) // 👈 se pasa aquí
  );

  const [state, setState] = useState<MathExercisesState>({
    currentChallengeIndex: 0,
    userInput: '',
    hasError: false,
    completedIndexes: [],
    isCompleted: false,
  });

  const current = challenges[state.currentChallengeIndex];

  const expectedAnswer = current
    ? (current.displayAnswer ?? String(current.answer))
    : '';

  const handleInputChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setState(prev => ({ ...prev, userInput: cleaned, hasError: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    const userVal = parseInt(state.userInput, 10);
    const expectedVal = parseInt(expectedAnswer, 10);

    if (isNaN(userVal) || userVal !== expectedVal) {
      setState(prev => ({ ...prev, hasError: true }));
      return;
    }

    const newCompleted = [...state.completedIndexes, state.currentChallengeIndex];
    const nextIndex = state.currentChallengeIndex + 1;

    if (nextIndex >= challenges.length) {
      setState(prev => ({
        ...prev,
        completedIndexes: newCompleted,
        isCompleted: true,
        hasError: false,
      }));
    } else {
      setState({
        currentChallengeIndex: nextIndex,
        userInput: '',
        hasError: false,
        completedIndexes: newCompleted,
        isCompleted: false,
      });
    }
  }, [state, expectedAnswer, challenges.length]);

  const handleReplace = useCallback(() => {
    setChallenges(generateChallenges(difficulty, count, operationType)); // 👈 también aquí
    setState({
      currentChallengeIndex: 0,
      userInput: '',
      hasError: false,
      completedIndexes: [],
      isCompleted: false,
    });
  }, [difficulty, count, operationType]);

  const operationSymbol = current ? OPERATION_SYMBOLS[current.operation] : '';

  return {
    challenges,
    state,
    current,
    expectedAnswer,
    operationSymbol,
    handleInputChange,
    handleConfirm,
    handleReplace,
  };
}