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
    titleEs: 'Pruebas Matematicas',
    titleEn: 'Math tests',
    descriptionEs: 'Ejercicios numericos con operaciones configurables.',
    descriptionEn: 'Numeric exercises with configurable operations.',
  },
  {
    titleEs: 'Completa palabras',
    titleEn: 'Complete words',
    descriptionEs: 'Palabras con letras ocultas para completar.',
    descriptionEn: 'Words with hidden letters to complete.',
  },
  {
    titleEs: 'Movimiento',
    titleEn: 'Movement',
    descriptionEs: 'Completar acciones fisicas con el telefono.',
    descriptionEn: 'Complete physical actions with the phone.',
  },
  {
    titleEs: 'Figuras y colores',
    titleEn: 'Shapes and colors',
    descriptionEs: 'Identificar el color correcto de una figura.',
    descriptionEn: 'Identify the correct color of a shape.',
  },
  {
    titleEs: 'Color diferente',
    titleEn: 'Different color',
    descriptionEs: 'Encontrar el cuadro distinto dentro de la grilla.',
    descriptionEn: 'Find the different tile in the grid.',
  },
  {
    titleEs: 'Encontrar pares',
    titleEn: 'Find pairs',
    descriptionEs: 'Resolver un tablero de memoria emparejando cartas.',
    descriptionEn: 'Solve a memory board by matching cards.',
  },
  {
    titleEs: 'Detectar objetos',
    titleEn: 'Detect objects',
    descriptionEs: 'Validar objetos con la camara cuando suena la alarma.',
    descriptionEn: 'Validate objects with the camera when the alarm rings.',
  },
  {
    titleEs: 'Cultura general',
    titleEn: 'General knowledge',
    descriptionEs: 'Responder preguntas de conocimiento general por categorias.',
    descriptionEn: 'Answer general knowledge questions by category.',
  },
] as const;
