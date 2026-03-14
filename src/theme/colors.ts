export const Colors = {
  // Fondo principal oscuro (alarma = noche)
  bg: '#0D0F14',
  bgCard: '#161A23',
  bgCardActive: '#1C2130',

  // Acento principal — azul eléctrico
  accent: '#4F8EF7',
  accentLight: '#7AAFF9',
  accentDim: 'rgba(79,142,247,0.18)',

  // Estado enabled/disabled
  success: '#34D399',
  successDim: 'rgba(52,211,153,0.15)',
  muted: '#3A3F4E',

  // Texto
  textPrimary: '#F0F2F7',
  textSecondary: '#7A8099',
  textMuted: '#4A5068',

  // Bordes
  border: '#1F2436',
  borderFocus: '#4F8EF7',

  // Misiones — colores por tipo
  missionColors: {
    math:     '#F59E0B',
    memory:   '#8B5CF6',
    physical: '#10B981',
    photo:    '#EC4899',
    trivia:   '#3B82F6',
    writing:  '#F97316',
    color:    '#EF4444',
    shapes:   '#06B6D4',
    sequence: '#A78BFA',
  } as Record<string, string>,

  white: '#FFFFFF',
  black: '#000000',
} as const;