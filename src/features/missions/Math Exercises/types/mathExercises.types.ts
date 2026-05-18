export type Difficulty = 'easy' | 'medium' | 'hard';
export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division';

// Tipo para una expresión generada por plantilla
export interface GeneratedExpression {
  expression: string;  // texto a mostrar: "(4−2) × (3+5)"
  answer: string;      // resultado: "16"
  operation: OperationType;
  difficulty: Difficulty;
}

// Tipo para los previews del config screen
export interface ComplexPreview {
  expression: string;
  answer: string;
}

// Se mantiene para compatibilidad con el resto del código
export interface MathChallenge {
  operation: OperationType;
  num1: number;
  num2: number;
  answer: number;
  // Nuevos campos opcionales para expresiones complejas
  expression?: string;
  displayAnswer?: string;
}

export interface MathExercisesConfig {
  difficulty: Difficulty;
  quantity: number;
  operationType: OperationType;
}

export interface MathExercisesState {
  currentChallengeIndex: number;
  userInput: string;
  hasError: boolean;
  completedIndexes: number[];
  isCompleted: boolean;
}