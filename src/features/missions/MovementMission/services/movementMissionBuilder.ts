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
} from '../constants/movementConstants';

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildStep(type: MovementType, index: number): MovementStep {
  const base = ALL_MOVEMENT_STEPS[type];
  return {
    ...base,
    id: `step_${index}_${Date.now()}`,
    completed: false,
  };
}

export function buildMovementMissionConfig(
  userConfig: MovementMissionUserConfig,
): MovementMissionConfig {
  const { difficulty, quantity } = userConfig;

  let steps: MovementStep[] = [];
  let totalDuration = 0;
  let requiresContinuity = false;
  let requiresOrder = false;

  switch (difficulty) {
    case 'easy': {
      // Single random movement, repeated `quantity` times (1–3)
      const type = randomFrom(EASY_STEP_POOL);
      for (let i = 0; i < quantity; i++) {
        steps.push(buildStep(type, i));
      }
      totalDuration = steps.reduce((acc, s) => acc + s.durationSeconds, 0);
      requiresContinuity = false;
      requiresOrder = false;
      break;
    }

    case 'medium': {
      // 2–3 different movements per round, `quantity` rounds
      const pool = [...MEDIUM_STEP_POOL];
      const perRound = 2;
      for (let round = 0; round < quantity; round++) {
        const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, perRound);
        shuffled.forEach((type, i) => {
          steps.push(buildStep(type, round * perRound + i));
        });
      }
      totalDuration = steps.reduce((acc, s) => acc + s.durationSeconds + 5, 0); // 5s between steps
      requiresContinuity = true;
      requiresOrder = false;
      break;
    }

    case 'hard': {
      // Random sequence of `quantity + 2` different steps, must follow order
      const count = Math.min(quantity + 2, HARD_STEP_POOL.length);
      const shuffled = [...HARD_STEP_POOL].sort(() => Math.random() - 0.5).slice(0, count);
      steps = shuffled.map((type, i) => buildStep(type, i));
      totalDuration = steps.reduce((acc, s) => acc + s.durationSeconds + 3, 0);
      requiresContinuity = true;
      requiresOrder = true;
      break;
    }
  }

  return {
    difficulty,
    steps,
    totalDurationSeconds: totalDuration,
    requiresContinuity,
    requiresOrder,
  };
}