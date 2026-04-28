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
    maxNumber: 50,
    operationTypes: ['addition', 'subtraction', 'multiplication'],
  },
  hard: {
    label: 'DIFÍCIL',
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
    maxNumber: 100,
    operationTypes: ['addition', 'subtraction', 'multiplication', 'division'],
  },
};

export const OPERATION_SYMBOLS: Record<OperationType, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rd(min: number, max: number): number {
  const steps = (max - min) / 0.5;
  return min + Math.floor(Math.random() * (steps + 1)) * 0.5;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─────────────────────────────────────────────
// PLANTILLAS
// ─────────────────────────────────────────────

const TEMPLATES: Record<OperationType, Record<Difficulty, Array<() => ComplexPreview>>> = {

  addition: {
    easy: [
      () => {
        const a = ri(1, 9), b = ri(1, 9), c = ri(1, 9), d = ri(1, 9);
        return { expression: `(${a} − ${b}) + (${c} + ${d})`, answer: fmt(round2((a - b) + (c + d))) };
      },
      () => {
        const a = ri(2, 9), b = ri(1, a - 1), c = ri(1, 9), d = ri(1, 9);
        return { expression: `(${a} + ${b}) + (${c} − ${d})`, answer: fmt(round2((a + b) + (c - d))) };
      },
      () => {
        const a = ri(1, 9), b = ri(1, 9), c = ri(1, 9);
        return { expression: `(${a} + ${b}) + ${c}`, answer: fmt(round2(a + b + c)) };
      },
    ],
    medium: [
      () => {
        const a = rd(1, 5), b = rd(1, 5), c = rd(1, 5), d = rd(1, 5), e = ri(2, 6), f = ri(2, 6);
        return {
          expression: `(${fmt(a)} + ${fmt(b)}) + (${fmt(c)} + ${fmt(d)}) × (${e} + ${f})`,
          answer: fmt(round2((a + b) + (c + d) * (e + f))),
        };
      },
      () => {
        const a = rd(2, 8), b = rd(1, 4), c = ri(2, 5), d = ri(1, 4);
        return {
          expression: `(${fmt(a)} ÷ ${fmt(b)}) + (${c} × ${d})`,
          answer: fmt(round2((a / b) + (c * d))),
        };
      },
      () => {
        const a = rd(1, 5), b = rd(1, 5), c = rd(1, 5), d = ri(2, 5);
        return {
          expression: `(${fmt(a)} + ${fmt(b)}) + (${fmt(c)} × ${d})`,
          answer: fmt(round2((a + b) + (c * d))),
        };
      },
    ],
    hard: [
      () => {
        const a = rd(2, 6), b = rd(1, 4), c = rd(2, 6), d = rd(1, 4);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `(${fmt(a)} + ${fmt(b)})² + (${fmt(c)} + ${fmt(d)}) + √${sq}`,
          answer: fmt(round2(Math.pow(a + b, 2) + (c + d) + Math.sqrt(sq))),
        };
      },
      () => {
        const a = rd(2, 6), b = rd(1, 4), c = ri(2, 5), d = rd(1, 5), e = rd(1, 5);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `(${fmt(a)} + ${fmt(b)}) ÷ ${c} + (${fmt(d)} + ${fmt(e)}) + √${sq}`,
          answer: fmt(round2((a + b) / c + (d + e) + Math.sqrt(sq))),
        };
      },
      () => {
        const a = rd(1, 5), b = rd(1, 5), c = rd(1, 5), d = rd(1, 5);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `(${fmt(a)} + ${fmt(b)})² + √${sq} + (${fmt(c)} + ${fmt(d)})`,
          answer: fmt(round2(Math.pow(a + b, 2) + Math.sqrt(sq) + (c + d))),
        };
      },
    ],
  },

  subtraction: {
    easy: [
      () => {
        const a = ri(4, 9), b = ri(1, 3), c = ri(4, 9), d = ri(1, 3);
        return { expression: `(${a} + ${b}) − (${c} − ${d})`, answer: fmt(round2((a + b) - (c - d))) };
      },
      () => {
        const c = ri(1, 3), d = ri(1, 3);
        const a = ri(c + d + 2, 9), b = ri(1, 2);
        return { expression: `(${a} − ${b}) − (${c} + ${d})`, answer: fmt(round2((a - b) - (c + d))) };
      },
      () => {
        const c = ri(1, 5);
        const a = ri(3, 9), b = ri(2, 9);
        const product = a * b;
        return { expression: `(${a} × ${b}) − ${c}`, answer: fmt(round2(product - c)) };
      },
    ],
    medium: [
      () => {
        const a = rd(4, 9), b = rd(1, 3), c = rd(1, 3), d = rd(1, 2), e = ri(2, 3);
        return {
          expression: `(${fmt(a)} − ${fmt(b)}) − (${fmt(c)} + ${fmt(d)}) × ${e}`,
          answer: fmt(round2((a - b) - (c + d) * e)),
        };
      },
      () => {
        const a = rd(4, 9), b = rd(1, 4), c = rd(1, 5), d = rd(1, 5);
        return {
          expression: `(${fmt(a)} × ${fmt(b)}) − (${fmt(c)} + ${fmt(d)})`,
          answer: fmt(round2((a * b) - (c + d))),
        };
      },
      () => {
        const a = rd(6, 12), b = rd(1, 4), c = ri(2, 4), d = rd(1, 3);
        return {
          expression: `(${fmt(a)} − ${fmt(b)}) ÷ ${c} − ${fmt(d)}`,
          answer: fmt(round2((a - b) / c - d)),
        };
      },
    ],
    hard: [
      () => {
        const a = rd(4, 8), b = rd(1, 2), c = ri(2, 4);
        const sq = [4, 9][ri(0, 1)];
        return {
          expression: `(${fmt(a)} − ${fmt(b)})² ÷ ${c} − √${sq}`,
          answer: fmt(round2(Math.pow(a - b, 2) / c - Math.sqrt(sq))),
        };
      },
      () => {
        const a = rd(4, 9), b = rd(1, 3), c = rd(1, 3), d = rd(1, 2);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `√${sq} + (${fmt(a)} − ${fmt(b)})² − (${fmt(c)} + ${fmt(d)})`,
          answer: fmt(round2(Math.sqrt(sq) + Math.pow(a - b, 2) - (c + d))),
        };
      },
      () => {
        const a = rd(5, 10), b = rd(1, 3), c = ri(2, 4), d = rd(2, 5), e = rd(1, 2);
        return {
          expression: `((${fmt(a)} − ${fmt(b)}) ÷ ${c})² − (${fmt(d)} − ${fmt(e)})`,
          answer: fmt(round2(Math.pow((a - b) / c, 2) - (d - e))),
        };
      },
    ],
  },

  multiplication: {
    easy: [
      () => {
        const a = ri(2, 5), b = ri(2, 5), c = ri(2, 5), d = ri(2, 5);
        return { expression: `(${a} − ${b < a ? b : 1}) × (${c} + ${d})`, answer: fmt(round2((a - (b < a ? b : 1)) * (c + d))) };
      },
      () => {
        const a = ri(2, 9), b = ri(2, 9), c = ri(1, 5);
        return { expression: `(${a} + ${b}) × ${c}`, answer: fmt(round2((a + b) * c)) };
      },
      () => {
        const a = ri(2, 6), b = ri(2, 6), c = ri(2, 6), d = ri(2, 6);
        return { expression: `(${a} × ${b}) × (${c} − ${d < c ? d : 1})`, answer: fmt(round2(a * b * (c - (d < c ? d : 1)))) };
      },
    ],
    medium: [
      () => {
        const a = rd(2, 5), b = rd(1, 3), c = ri(2, 5), d = ri(2, 5);
        return {
          expression: `(${fmt(a)} + ${fmt(b)}) × (${c} + ${d})`,
          answer: fmt(round2((a + b) * (c + d))),
        };
      },
      () => {
        const a = rd(2, 6), b = rd(1, 3), c = rd(2, 5), d = ri(2, 4);
        return {
          expression: `(${fmt(a)} × ${fmt(b)}) × (${fmt(c)} + ${d})`,
          answer: fmt(round2((a * b) * (c + d))),
        };
      },
      () => {
        const a = rd(4, 8), b = ri(2, 4), c = rd(2, 5), d = rd(1, 3);
        return {
          expression: `(${fmt(a)} ÷ ${b}) × (${fmt(c)} + ${fmt(d)})`,
          answer: fmt(round2((a / b) * (c + d))),
        };
      },
    ],
    hard: [
      () => {
        const a = rd(2, 5), b = rd(1, 3), c = rd(1, 4), d = rd(1, 3);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `(${fmt(a)} − ${fmt(b)})² × √${sq} + (${fmt(c)} × ${fmt(d)})`,
          answer: fmt(round2(Math.pow(a - b, 2) * Math.sqrt(sq) + c * d)),
        };
      },
      () => {
        const a = rd(2, 4), b = rd(1, 3), c = ri(2, 4), d = rd(1, 4), e = rd(1, 3);
        return {
          expression: `(${fmt(a)} + ${fmt(b)})² × ${c} − (${fmt(d)} + ${fmt(e)})`,
          answer: fmt(round2(Math.pow(a + b, 2) * c - (d + e))),
        };
      },
      () => {
        const a = rd(2, 5), b = rd(1, 3), c = rd(2, 4), d = rd(1, 3);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `√${sq} × (${fmt(a)} + ${fmt(b)})² ÷ (${fmt(c)} − ${fmt(d)})`,
          answer: fmt(round2(Math.sqrt(sq) * Math.pow(a + b, 2) / (c - d))),
        };
      },
    ],
  },

  division: {
    easy: [
      () => {
        const c = ri(2, 5), d = ri(2, 5), divisor = ri(2, 4);
        const num = c * divisor;
        return { expression: `(${num} + ${d}) ÷ ${divisor}`, answer: fmt(round2((num + d) / divisor)) };
      },
      () => {
        const a = ri(2, 5), b = ri(2, 4), divisor = ri(2, 4);
        const num = a * divisor;
        return { expression: `(${num} − ${b}) ÷ ${divisor}`, answer: fmt(round2((num - b) / divisor)) };
      },
      () => {
        const a = ri(2, 4), b = ri(2, 4), c = ri(2, 4);
        return { expression: `(${a} × ${b}) ÷ ${c}`, answer: fmt(round2((a * b) / c)) };
      },
    ],
    medium: [
      () => {
        const a = rd(4, 9), b = rd(1, 3), c = ri(2, 4), d = rd(1, 4), e = ri(2, 4);
        return {
          expression: `(${fmt(a)} − ${fmt(b)}) ÷ ${c} + (${fmt(d)} × ${e})`,
          answer: fmt(round2((a - b) / c + d * e)),
        };
      },
      () => {
        const a = rd(6, 12), b = ri(2, 4), c = rd(2, 5), d = rd(1, 3);
        return {
          expression: `(${fmt(a)} ÷ ${b}) + (${fmt(c)} − ${fmt(d)})`,
          answer: fmt(round2(a / b + (c - d))),
        };
      },
      () => {
        const a = rd(4, 9), b = rd(1, 4), c = ri(2, 4), d = rd(2, 5), e = ri(2, 4);
        return {
          expression: `(${fmt(a)} + ${fmt(b)}) ÷ ${c} × (${fmt(d)} ÷ ${e})`,
          answer: fmt(round2(((a + b) / c) * (d / e))),
        };
      },
    ],
    hard: [
      () => {
        const a = rd(4, 9), b = rd(1, 4), c = ri(2, 5);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `(${fmt(a)} + ${fmt(b)}) ÷ ${c} + (${fmt(a)} + ${fmt(b)})² + √${sq}`,
          answer: fmt(round2((a + b) / c + Math.pow(a + b, 2) + Math.sqrt(sq))),
        };
      },
      () => {
        const a = rd(4, 8), b = rd(1, 4), c = ri(2, 4), d = rd(2, 6), e = rd(1, 3);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `((${fmt(a)} − ${fmt(b)}) ÷ ${c})² + √${sq} − (${fmt(d)} + ${fmt(e)})`,
          answer: fmt(round2(Math.pow((a - b) / c, 2) + Math.sqrt(sq) - (d + e))),
        };
      },
      () => {
        const a = rd(3, 7), b = rd(1, 3), c = ri(2, 4), d = rd(1, 4);
        const sq = [4, 9, 16, 25][ri(0, 3)];
        return {
          expression: `√${sq} ÷ ${c} + (${fmt(a)} − ${fmt(b)})² × ${fmt(d)}`,
          answer: fmt(round2(Math.sqrt(sq) / c + Math.pow(a - b, 2) * d)),
        };
      },
    ],
  },
};

// ─────────────────────────────────────────────
// EXAMPLE_PREVIEWS
// ─────────────────────────────────────────────
export const EXAMPLE_PREVIEWS: Record<Difficulty, ComplexPreview[]> = {
  easy: [{ expression: '(4 − 2) × (3 + 5)', answer: '16' }],
  medium: [{ expression: '(3.50 + 2.50) + (2.5 + 5.5) × (3 + 5)', answer: '70' }],
  hard: [{ expression: '(5.50 + 3.50) ÷ 3 + (2.5 + 5.5)² + √9', answer: '70.33' }],
};

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL — siempre retorna positivo
// ─────────────────────────────────────────────
export function generateExpression(
  difficulty: Difficulty,
  operationType: OperationType
): GeneratedExpression {
  const group = TEMPLATES[operationType][difficulty];

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

export function generateChallenges(difficulty: Difficulty, count: number = 1): MathChallenge[] {
  const style = DIFFICULTY_STYLES[difficulty];
  const operations = style.operationTypes;
  const result: MathChallenge[] = [];

  for (let i = 0; i < count; i++) {
    const op = operations[Math.floor(Math.random() * operations.length)];
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