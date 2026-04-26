import { useState, useCallback } from 'react';
import { Difficulty, MathChallenge, MathExercisesState } from '../types/mathExercises.types';
import { generateChallenges, OPERATION_SYMBOLS } from '../constants/mathExercises.config';

export function useMathExercises(difficulty: Difficulty, count: number = 1) {
  const [challenges, setChallenges] = useState<MathChallenge[]>(() =>
    generateChallenges(difficulty, count)
  );

  const [state, setState] = useState<MathExercisesState>({
    currentChallengeIndex: 0,
    userInput: '',
    hasError: false,
    completedIndexes: [],
    isCompleted: false,
  });

  const current = challenges[state.currentChallengeIndex];

  // ✅ Usa displayAnswer si existe, si no usa answer numérico
  const expectedAnswer = current
    ? (current.displayAnswer ?? String(current.answer))
    : '';

  const handleInputChange = useCallback((text: string) => {
    // ✅ Permite dígitos y punto decimal
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setState(prev => ({ ...prev, userInput: cleaned, hasError: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    // ✅ Compara valores numéricos para evitar diferencias de formato
    const userVal = parseFloat(state.userInput);
    const expectedVal = parseFloat(expectedAnswer);

    if (isNaN(userVal) || Math.abs(userVal - expectedVal) > 0.01) {
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
    setChallenges(generateChallenges(difficulty, count));
    setState({
      currentChallengeIndex: 0,
      userInput: '',
      hasError: false,
      completedIndexes: [],
      isCompleted: false,
    });
  }, [difficulty, count]);

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