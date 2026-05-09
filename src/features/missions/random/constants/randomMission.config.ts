import { RandomMissionConfig } from '../types/randomMission.types';

export const RANDOM_MISSION_DEFAULT_CONFIG: RandomMissionConfig = {
  difficulty: 'medium',
  quantity: 3,
  missionCount: 1,
};

export const RANDOM_MISSION_MIN_QUANTITY = 1;
export const RANDOM_MISSION_MAX_QUANTITY = 9;
export const RANDOM_MISSION_MIN_COUNT = 1;
export const RANDOM_MISSION_MAX_COUNT = 5;

export const RANDOM_AVAILABLE_MISSIONS = [
  {
    title: 'Pruebas Matematicas',
    description: 'Ejercicios numericos con operaciones configurables.',
  },
  {
    title: 'Completa palabras',
    description: 'Palabras con letras ocultas para completar.',
  },
] as const;
