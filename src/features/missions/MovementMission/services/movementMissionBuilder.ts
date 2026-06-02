import {
  MovementDifficulty,
  MovementMissionConfig,
  MovementMissionUserConfig,
  MovementStep,
  MovementType,
} from '../types/movement.types';
import {
  ALL_MOVEMENT_STEPS,
  EASY_STEP_POOL,
  HARD_STEP_POOL,
  MEDIUM_STEP_POOL,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '../constants/movementConstants';

const HARD_DURATION_MULTIPLIER = 2;
const HARD_THRESHOLD_MULTIPLIER = 1.15;
const HARD_REQUIRED_RATIO_BONUS = 0.2;
const HARD_WALK_SECONDS = 10;

// Toma movimientos aleatorios y repite el pool si hace falta
function randomList<T>(arr: T[], count: number): T[] {
  const pool = [...arr];
  const result: T[] = [];

  while (result.length < count) {
    if (pool.length === 0) {
      pool.push(...arr);
    }
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
}

// Crea un paso aplicando los ajustes de dificultad
function buildStep(
  type: MovementType,
  index: number,
  difficulty: MovementDifficulty,
): MovementStep {
  const base = ALL_MOVEMENT_STEPS[type];
  const isHard = difficulty === 'hard';
  const durationMultiplier = isHard ? HARD_DURATION_MULTIPLIER : 1;
  const threshold = isHard
    ? type === 'walk'
      ? HARD_WALK_SECONDS
      : base.threshold * HARD_THRESHOLD_MULTIPLIER
    : base.threshold;

  return {
    ...base,
    durationSeconds: Math.ceil(base.durationSeconds * durationMultiplier),
    threshold,
    label: isHard && type === 'walk'
      ? 'Camina mas pasos'
      : base.label,
    instruction: isHard && type === 'walk'
      ? 'Camina con el telefono en la mano por mas tiempo.'
      : base.instruction,
    detail: isHard && type === 'walk'
      ? 'Da aproximadamente 12 pasos reales. Estar quieto no llena el progreso.'
      : base.detail,
    requiredRatio: isHard && type !== 'walk'
      ? Math.min(base.requiredRatio + HARD_REQUIRED_RATIO_BONUS, 1)
      : base.requiredRatio,
    id: `step_${index}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    completed: false,
  };
}

// Construye la secuencia final segun dificultad y cantidad
export function buildMovementMissionConfig(
  userConfig: MovementMissionUserConfig,
): MovementMissionConfig {
  const { difficulty } = userConfig;
  const quantity = Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, userConfig.quantity));

  let steps: MovementStep[] = [];
  let requiresContinuity = false;
  let requiresOrder = false;

  if (difficulty === 'easy') {
    steps = randomList(EASY_STEP_POOL, quantity).map((type, index) =>
      buildStep(type, index, difficulty),
    );
  }

  if (difficulty === 'medium') {
    // En medio siempre empieza caminando
    steps = [buildStep('walk', 0, difficulty)];
    if (quantity > 1) {
      steps.push(
        ...randomList(MEDIUM_STEP_POOL, quantity - 1).map((type, index) =>
          buildStep(type, index + 1, difficulty),
        ),
      );
    }
    requiresContinuity = true;
  }

  if (difficulty === 'hard') {
    // En dificil alterna caminar y movimiento para evitar caminar-caminar
    const movementTypes = randomList(HARD_STEP_POOL, Math.ceil(quantity / 2));
    for (let index = 0; index < quantity; index += 1) {
      const type = index % 2 === 0
        ? 'walk'
        : movementTypes[Math.floor(index / 2)];
      steps.push(buildStep(type, index, difficulty));
    }
    requiresContinuity = true;
    requiresOrder = true;
  }

  return {
    difficulty,
    steps,
    totalDurationSeconds: steps.reduce((acc, step) => acc + step.durationSeconds, 0),
    requiresContinuity,
    requiresOrder,
  };
}
