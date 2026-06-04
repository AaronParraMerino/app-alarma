import { MissionType } from '../../alarm/types/alarm.types';

export const MISSION_LABELS: Record<MissionType, string> = {
  random: 'Aleatorio',
  math: 'Matematicas',
  memory: 'Memoria',
  physical: 'Fisico',
  photo: 'Objetos',
  trivia: 'Trivia',
  writing: 'Escritura',
  color: 'Colores',
  colorFind: 'Color diferente',
  shapes: 'Figuras',
  sequence: 'Secuencia',
  wordCompletion: 'Palabras',
};

export const MISSION_ICONS: Record<MissionType, string> = {
  random: 'RND',
  math: '+',
  memory: 'MEM',
  physical: 'RUN',
  photo: 'OBJ',
  trivia: '?',
  writing: 'TXT',
  color: 'CLR',
  colorFind: 'KUBE',
  shapes: 'FIG',
  sequence: '123',
  wordCompletion: 'ABC',
};

export const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
export const DAY_LABELS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const DIFFICULTY_LABELS = {
  easy: 'Facil',
  normal: 'Medio',
  hard: 'Dificil',
};
