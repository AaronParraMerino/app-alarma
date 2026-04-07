export const Colors = {

  // ── Fondos ──────────────────────────────────────────────
  bg:              '#0D0F14',   // fondo principal
  bgCard:          '#12161F',   // tarjetas
  bgCardActive:    '#1A2030',   // tarjeta seleccionada/activa
  bgElevated:      '#1E2535',   // modales, bottom sheets

  // ── Azules principales (de tu paleta) ───────────────────
  primary:         '#0077B6',   // acción principal, botones
  primaryLight:    '#b8ddf0',   // hover, estados suaves
  primaryPale:     '#e8f4fb',   // fondos de badge, chips
  primaryDeep:     '#004f7c',   // pressed, sombras de botón

  // ── Acentos y resaltes ──────────────────────────────────
  accent:          '#0077B6',   // alias de primary para compatibilidad
  accentGlow:      'rgba(0, 119, 182, 0.20)',  // glow/halo en elementos activos
  accentLight:     '#b8ddf0',

  // ── Semánticos ──────────────────────────────────────────
  success:         '#34d399',   // alarma activa, sync OK
  successDim:      'rgba(52, 211, 153, 0.14)',
  warning:         '#fbbf24',   // advertencias
  warningDim:      'rgba(251, 191, 36, 0.14)',
  danger:          '#e85555',   // eliminar, error
  dangerDim:       'rgba(232, 85, 85, 0.14)',
  purple:          '#c4b5fd',   // misiones memoria
  purpleDim:       'rgba(196, 181, 253, 0.14)',

  // ── Texto ───────────────────────────────────────────────
  text:            '#F0F2F7',   // texto principal
  textSecondary:   '#8A93B2',   // subtítulos, labels
  textMuted:       '#4A5068',   // placeholders, hints
  textAccent:      '#b8ddf0',   // texto resaltado con color de paleta

  // ── Bordes ──────────────────────────────────────────────
  border:          '#1F2436',   // borde base
  borderFocus:     '#0077B6',   // borde cuando hay foco
  borderMuted:     '#161A23',   // borde muy sutil

  // ── Misiones ────────────────────────────────────────────
  missionColors: {
    math:     '#fbbf24',   // amarillo dorado
    memory:   '#c4b5fd',   // lavanda
    physical: '#34d399',   // verde menta
    photo:    '#f472b6',   // rosa
    trivia:   '#0077B6',   // azul principal
    writing:  '#fb923c',   // naranja
    color:    '#e85555',   // rojo
    shapes:   '#22d3ee',   // cyan
    sequence: '#a78bfa',   // violeta
  } as Record<string, string>,

  // ── Utilidad ────────────────────────────────────────────
  white:    '#FFFFFF',
  black:    '#000000',
  cream:    '#f0ede8',   // de tu paleta, usar en detalles decorativos

} as const;

// Tipo inferido para usar en componentes
export type AppColors = typeof Colors;