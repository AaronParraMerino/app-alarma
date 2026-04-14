import { useState, useCallback } from 'react';
import { WordChallenge, WordCompletionState, Difficulty } from '../types/wordCompletion.types';
import { generateMission } from '../constants/wordCompletion.constants';

export function useWordCompletionMission(difficulty: Difficulty) {
  const [challenges, setChallenges] = useState<WordChallenge[]>(() =>
    generateMission(difficulty)
  );

  const [state, setState] = useState<WordCompletionState>({
    currentChallengeIndex: 0,
    userInput: '',
    hasError: false,
    completedIndexes: [],
    isCompleted: false,
  });

  const currentChallenge = challenges[state.currentChallengeIndex];

  const expectedAnswer = currentChallenge
    ? currentChallenge.missingIndexes
        .map((i) => currentChallenge.word[i])
        .join('')
    : '';

  const handleInputChange = useCallback((text: string) => {
    setState((prev) => ({ ...prev, userInput: text.toUpperCase(), hasError: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.userInput.trim().toUpperCase() !== expectedAnswer) {
      setState((prev) => ({ ...prev, hasError: true }));
      return;
    }

    const newCompleted = [...state.completedIndexes, state.currentChallengeIndex];
    const nextIndex = state.currentChallengeIndex + 1;

    if (nextIndex >= challenges.length) {
      setState((prev) => ({
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
    setChallenges(generateMission(difficulty));
    setState({
      currentChallengeIndex: 0,
      userInput: '',
      hasError: false,
      completedIndexes: [],
      isCompleted: false,
    });
  }, [difficulty]);

  return {
    challenges,
    state,
    currentChallenge,
    expectedAnswer,
    handleInputChange,
    handleConfirm,
    handleReplace,
  };
}
