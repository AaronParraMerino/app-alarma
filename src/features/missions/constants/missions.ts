import { MissionType } from '../../alarm/types/alarm.types';

export const MISSION_LABELS: Record<MissionType, string> = {
  math:     'Matemáticas',
  memory:   'Memoria',
  physical: 'Físico',
  photo:    'Foto',
  trivia:   'Trivia',
  writing:  'Escritura',
  color:    'Colores',
  shapes:   'Figuras',
  sequence: 'Secuencia',
};

export const MISSION_ICONS: Record<MissionType, string> = {
  math:     '➗',
  memory:   '🧩',
  physical: '🏃',
  photo:    '📷',
  trivia:   '❓',
  writing:  '✍️',
  color:    '🎨',
  shapes:   '⬡',
  sequence: '🔢',
};

export const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_LABELS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const DIFFICULTY_LABELS = {
  easy:   'Fácil',
  normal: 'Normal',
  hard:   'Difícil',
};