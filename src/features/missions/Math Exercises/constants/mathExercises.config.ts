import {
  ComplexPreview,
  Difficulty,
  GeneratedExpression,
  MathChallenge,
  OperationType,
} from '../types/mathExercises.types';

export interface DifficultyStyle {
  label: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  maxNumber: number;
  operationTypes: OperationType[];
}

export const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
  easy: {
    label: 'FÁCIL',
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
    maxNumber: 10,
    operationTypes: ['addition', 'subtraction'],
  },
  medium: {
    label: 'MEDIO',
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
    maxNumber: 20,
    operationTypes: ['addition', 'subtraction', 'multiplication'],
  },
  hard: {
    label: 'DIFÍCIL',
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
    maxNumber: 30,
    operationTypes: ['addition', 'subtraction', 'multiplication', 'division'],
  },
};

export const OPERATION_SYMBOLS: Record<OperationType, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fmt(n: number): string {
  return String(Math.round(n));
}

// ─────────────────────────────────────────────
// FÁCIL — una sola operación, números del 1 al 10
// Ejemplos: 2 + 3   |   8 − 5   |   3 × 4   |   8 ÷ 2
// ─────────────────────────────────────────────
const TEMPLATES_EASY: Record<OperationType, Array<() => ComplexPreview>> = {
  addition: [
    () => { const a = ri(1, 9), b = ri(1, 9); return { expression: `${a} + ${b}`, answer: fmt(a + b) }; },
    () => { const a = ri(1, 5), b = ri(1, 5), c = ri(1, 5); return { expression: `${a} + ${b} + ${c}`, answer: fmt(a + b + c) }; },
  ],
  subtraction: [
    () => { const b = ri(1, 8), a = ri(b + 1, 10); return { expression: `${a} − ${b}`, answer: fmt(a - b) }; },
    () => { const c = ri(1, 4), b = ri(c + 1, 7), a = ri(b + 1, 10); return { expression: `${a} − ${b} − ${c}`, answer: fmt(a - b - c) }; },
  ],
  multiplication: [
    () => { const a = ri(2, 5), b = ri(2, 5); return { expression: `${a} × ${b}`, answer: fmt(a * b) }; },
    () => { const a = ri(1, 4), b = ri(2, 4), c = ri(1, 3); return { expression: `${a} × ${b} + ${c}`, answer: fmt(a * b + c) }; },
  ],
  division: [
    () => { const b = ri(2, 5), a = b * ri(1, 4); return { expression: `${a} ÷ ${b}`, answer: fmt(a / b) }; },
    () => { const b = ri(2, 4), q = ri(2, 4), a = b * q; return { expression: `${a} ÷ ${b} + ${ri(1,4)}`, answer: '' }; },
  ],
};

// Arreglo del caso especial de division easy con variable suelta
TEMPLATES_EASY.division[1] = () => {
  const b = ri(2, 4), q = ri(2, 4), a = b * q, c = ri(1, 4);
  return { expression: `${a} ÷ ${b} + ${c}`, answer: fmt(a / b + c) };
};

// ─────────────────────────────────────────────
// MEDIO — dos grupos simples, números del 1 al 20
// Ejemplos: (6 + 8) − (5 + 3)   |   (4 × 3) + (7 − 2)
// ─────────────────────────────────────────────
const TEMPLATES_MEDIUM: Record<OperationType, Array<() => ComplexPreview>> = {
  addition: [
    () => { const a = ri(1,15), b = ri(1,10), c = ri(1,10), d = ri(1,10); return { expression: `(${a} + ${b}) − (${c} + ${d})`, answer: fmt((a+b)-(c+d)) }; },
    () => { const a = ri(1,10), b = ri(1,10), c = ri(1,10), d = ri(1,10); return { expression: `(${a} + ${b}) + (${c} + ${d})`, answer: fmt(a+b+c+d) }; },
    () => { const a = ri(2,15), b = ri(1,10), c = ri(1,10); return { expression: `(${a} + ${b}) − ${c}`, answer: fmt(a+b-c) }; },
  ],
  subtraction: [
    () => { const c = ri(1,8), d = ri(1,8), a = ri(c+d+1,20), b = ri(1,5); return { expression: `(${a} − ${b}) − (${c} + ${d})`, answer: fmt((a-b)-(c+d)) }; },
    () => { const a = ri(5,15), b = ri(1,5), c = ri(1,8), d = ri(1,4); return { expression: `(${a} + ${b}) − (${c} − ${d})`, answer: fmt((a+b)-(c-d)) }; },
    () => { const a = ri(3,10), b = ri(1,5), c = ri(1,5); return { expression: `${a} − (${b} + ${c})`, answer: fmt(a-b-c) }; },
  ],
  multiplication: [
    () => { const a = ri(2,6), b = ri(2,6), c = ri(1,8); return { expression: `(${a} × ${b}) + ${c}`, answer: fmt(a*b+c) }; },
    () => { const a = ri(2,5), b = ri(1,6), c = ri(2,5); return { expression: `(${a} + ${b}) × ${c}`, answer: fmt((a+b)*c) }; },
    () => { const a = ri(2,5), b = ri(2,5), c = ri(1,5); return { expression: `(${a} × ${b}) − ${c}`, answer: fmt(a*b-c) }; },
  ],
  division: [
    () => { const b = ri(2,4), q = ri(2,5), a = b*q, c = ri(1,8); return { expression: `(${a} ÷ ${b}) + ${c}`, answer: fmt(a/b+c) }; },
    () => { const b = ri(2,4), q = ri(2,5), a = b*q, c = ri(1,5); return { expression: `(${a} + ${b}) ÷ ${c}`, answer: fmt((a+b)/c) }; },
    () => { const b = ri(2,4), q = ri(2,5), a = b*q, c = ri(1,6); return { expression: `${a} ÷ ${b} − ${c}`, answer: fmt(a/b-c) }; },
  ],
};

// ─────────────────────────────────────────────
// DIFÍCIL — dos grupos + una operación extra, números del 1 al 30
// Ejemplos: (6 + 7) + (2 − 1) × 4   |   (8 − 3) × 2 + (4 + 1)
// ─────────────────────────────────────────────
const TEMPLATES_HARD: Record<OperationType, Array<() => ComplexPreview>> = {
  addition: [
    () => { const a = ri(1,15), b = ri(1,10), c = ri(1,8), d = ri(1,5), e = ri(2,5); return { expression: `(${a} + ${b}) + (${c} − ${d}) × ${e}`, answer: fmt((a+b)+(c-d)*e) }; },
    () => { const a = ri(2,10), b = ri(1,8), c = ri(2,6), d = ri(1,5), e = ri(2,4); return { expression: `(${a} + ${b}) × ${e} + (${c} − ${d})`, answer: fmt((a+b)*e+(c-d)) }; },
    () => { const a = ri(1,10), b = ri(1,10), c = ri(2,5), d = ri(1,8); return { expression: `(${a} + ${b}) × ${c} − ${d}`, answer: fmt((a+b)*c-d) }; },
  ],
  subtraction: [
    () => { const a = ri(5,20), b = ri(1,8), c = ri(1,6), d = ri(1,4), e = ri(2,4); return { expression: `(${a} − ${b}) − (${c} + ${d}) × ${e}`, answer: fmt((a-b)-(c+d)*e) }; },
    () => { const a = ri(3,12), b = ri(1,5), c = ri(2,5), d = ri(2,4); return { expression: `(${a} − ${b}) × ${c} − ${d}`, answer: fmt((a-b)*c-d) }; },
    () => { const b = ri(2,4), q = ri(2,5), a = b*q, c = ri(1,8), d = ri(1,5); return { expression: `(${a} − ${b}) ÷ ${Math.min(b,q)} + (${c} − ${d})`, answer: fmt((a-b)/Math.min(b,q)+(c-d)) }; },
  ],
  multiplication: [
    () => { const a = ri(2,8), b = ri(1,6), c = ri(2,5), d = ri(1,4), e = ri(2,4); return { expression: `(${a} + ${b}) × ${e} − (${c} + ${d})`, answer: fmt((a+b)*e-(c+d)) }; },
    () => { const a = ri(2,6), b = ri(2,5), c = ri(1,5), d = ri(2,4); return { expression: `${a} × ${b} + (${c} × ${d})`, answer: fmt(a*b+c*d) }; },
    () => { const a = ri(2,6), b = ri(1,5), c = ri(2,4), d = ri(1,6); return { expression: `(${a} − ${b}) × ${c} + ${d}`, answer: fmt((a-b)*c+d) }; },
  ],
  division: [
    () => { const b = ri(2,4), q = ri(2,5), a = b*q, c = ri(1,6), d = ri(2,4); return { expression: `(${a} ÷ ${b}) + (${c} × ${d})`, answer: fmt(a/b+c*d) }; },
    () => { const b = ri(2,4), q = ri(2,6), a = b*q, c = ri(1,6), d = ri(1,5); return { expression: `(${a} + ${c}) ÷ ${b} + ${d}`, answer: fmt((a+c)/b+d) }; },
    () => { const b = ri(2,4), q = ri(2,5), a = b*q, c = ri(2,5), d = ri(1,5); return { expression: `${a} ÷ ${b} + (${c} − ${d}) × 2`, answer: fmt(a/b+(c-d)*2) }; },
  ],
};

const TEMPLATES = {
  easy:   TEMPLATES_EASY,
  medium: TEMPLATES_MEDIUM,
  hard:   TEMPLATES_HARD,
};

export const EXAMPLE_PREVIEWS: Record<Difficulty, ComplexPreview[]> = {
  easy:   [{ expression: '2 + 3', answer: '5' }],
  medium: [{ expression: '(6 + 8) − (5 + 3)', answer: '6' }],
  hard:   [{ expression: '(6 + 7) + (2 − 1) × 4', answer: '17' }],
};

export function generateExpression(
  difficulty: Difficulty,
  operationType: OperationType
): GeneratedExpression {
  const group = TEMPLATES[difficulty][operationType];

  let expression: string = '';
  let answer: string = '';
  let attempts = 0;

  do {
    const templateFn = group[Math.floor(Math.random() * group.length)];
    ({ expression, answer } = templateFn());
    attempts++;
  } while (parseFloat(answer) <= 0 && attempts < 20);

  return { expression, answer, operation: operationType, difficulty };
}

export function generateExpressions(
  difficulty: Difficulty,
  operationType: OperationType,
  count: number = 1
): GeneratedExpression[] {
  const result: GeneratedExpression[] = [];
  for (let i = 0; i < count; i++) {
    result.push(generateExpression(difficulty, operationType));
  }
  return result;
}

export function generateChallenges(
  difficulty: Difficulty,
  count: number = 1,
  operationType?: OperationType
): MathChallenge[] {
  const style = DIFFICULTY_STYLES[difficulty];
  const operations = style.operationTypes;
  const result: MathChallenge[] = [];

  for (let i = 0; i < count; i++) {
    const op = operationType ?? operations[Math.floor(Math.random() * operations.length)];
    const generated = generateExpression(difficulty, op);
    result.push({
      operation: op,
      num1: 0,
      num2: 0,
      answer: parseFloat(generated.answer) || 0,
      expression: generated.expression,
      displayAnswer: generated.answer,
    });
  }
  return result;
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 9;
export const DEFAULT_CONFIG = {
  difficulty: 'easy' as Difficulty,
  quantity: 3,
  operationType: 'addition' as OperationType,
};