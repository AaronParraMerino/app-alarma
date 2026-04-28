import { useState, useCallback, useEffect } from 'react';
import { Difficulty, WordChallenge, WordCompletionState } from '../types/wordCompletion.types';
import { generateChallenges } from '../constants/wordCompletion.config';

const INITIAL_STATE: WordCompletionState = {
  currentChallengeIndex: 0,
  userInput: '',
  hasError: false,
  completedIndexes: [],
  isCompleted: false,
};

/**
 * Hook principal que maneja la logica del juego de completar palabras.
 * Controla:
 * generación de retos
 * estado del usuario
 * validación de respuestas
 * progreso del flujo
 */
export function useWordCompletion(difficulty: Difficulty) {
  const [challenges, setChallenges] = useState<WordChallenge[]>(() =>
    generateChallenges(difficulty)
  );

  const [state, setState] = useState<WordCompletionState>(INITIAL_STATE);

  /**
   * Cuando la dificultad cambia (por bajada automática),
   * regenera las palabras del banco correcto y resetea el estado
   */
  useEffect(() => {
    setChallenges(generateChallenges(difficulty));
    setState(INITIAL_STATE);
  }, [difficulty]);

  const current = challenges[state.currentChallengeIndex];

  const expectedAnswer = current
    ? current.missingIndexes.map(i => current.word[i]).join('')
    : '';

  /**
   * Maneja cambios en el input del usuario
   * Normaliza a mayúsculas
   * Resetea estado de error
   */
  const handleInputChange = useCallback((text: string) => {
    setState(prev => ({ ...prev, userInput: text.toUpperCase(), hasError: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.userInput.trim() !== expectedAnswer) {
      setState(prev => ({ ...prev, hasError: true }));
      return;
    }
    const newCompleted = [...state.completedIndexes, state.currentChallengeIndex];
    const nextIndex = state.currentChallengeIndex + 1;

    if (nextIndex >= challenges.length) {
      setState(prev => ({ ...prev, completedIndexes: newCompleted, isCompleted: true, hasError: false }));
    } else {
      setState({ currentChallengeIndex: nextIndex, userInput: '', hasError: false, completedIndexes: newCompleted, isCompleted: false });
    }
  }, [state, expectedAnswer, challenges.length]);

  const handleReplace = useCallback(() => {
    setChallenges(generateChallenges(difficulty));
    setState(INITIAL_STATE);
  }, [difficulty]);

  return { challenges, state, current, expectedAnswer, handleInputChange, handleConfirm, handleReplace };
}
