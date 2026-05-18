import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { Colors } from '../../../shared/theme/colors';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Level = 'easy' | 'normal' | 'hard';

interface LevelConfig {
  badge: string;
  label: string;
  accent: string;
  badgeBg: string;
  cardBg: string;
  cardBorder: string;
  hintLabel: string;
  problem: string;
  placeholder: string;
  submitBg: string;
  submitText: string;
  dotsFilled: number;
  decimal: boolean;
  answer: number;
}

// ─── Configuración de niveles ─────────────────────────────────────────────────

const LEVEL_CONFIG: Record<Level, LevelConfig> = {
  easy: {
    badge: 'Nivel fácil',
    label: 'Fácil',
    accent: '#52b788',
    badgeBg: '#1b4332',
    cardBg: 'rgba(82,183,136,0.10)',
    cardBorder: 'rgba(82,183,136,0.22)',
    hintLabel: '+  −  ×  ÷  · 2 dígitos',
    problem: '47 × 8 = ?',
    placeholder: '___',
    submitBg: '#2d6a4f',
    submitText: '#b7e4c7',
    dotsFilled: 1,
    decimal: false,
    answer: 376,
  },
  normal: {
    badge: 'Nivel normal',
    label: 'Normal',
    accent: Colors.primary,
    badgeBg: '#1c1255',
    cardBg: 'rgba(167,139,250,0.09)',
    cardBorder: 'rgba(167,139,250,0.25)',
    hintLabel: 'paréntesis + operadores combinados',
    problem: '(3 + 7 − 2) × 6 = ?',
    placeholder: '__',
    submitBg: Colors.primary,
    submitText: Colors.white,
    dotsFilled: 3,
    decimal: false,
    answer: 48,
  },
  hard: {
    badge: 'Nivel difícil',
    label: 'Difícil',
    accent: '#f87171',
    badgeBg: '#3b1515',
    cardBg: 'rgba(248,113,113,0.08)',
    cardBorder: 'rgba(248,113,113,0.22)',
    hintLabel: 'doble paréntesis · decimales',
    problem: '((3.50 + 2.50) / 3)\n+ (2 + 5) × (3 × 5) = ?',
    placeholder: '___.___',
    submitBg: '#991b1b',
    submitText: '#fee2e2',
    dotsFilled: 5,
    decimal: true,
    answer: 107,
  },
};

const KEYPAD_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '⌫'],
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MathChallengeScreen() {
  const [level, setLevel] = useState<Level>('easy');
  const [inputVal, setInputVal] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLabel, setSubmitLabel] = useState('Confirmar respuesta');
  const [inputBorderColor, setInputBorderColor] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cfg = LEVEL_CONFIG[level];

  // Hora en vivo
  const [clock, setClock] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setClock(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Resetear input al cambiar nivel
  useEffect(() => {
    setInputVal('');
    setSubmitLabel('Confirmar respuesta');
    setInputBorderColor(null);
  }, [level]);

  // ── Teclado ──────────────────────────────────────────────────────────────────

  const pressKey = (key: string) => {
    if (key === '⌫') {
      setInputVal((v) => v.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (!cfg.decimal) return;
      if (inputVal.includes('.')) return;
      setInputVal((v) => v + '.');
      return;
    }
    if (inputVal.length >= 10) return;
    setInputVal((v) => v + key);
  };

  // ── Verificar respuesta ───────────────────────────────────────────────────────

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const checkAnswer = () => {
    const userVal = parseFloat(inputVal);
    if (isNaN(userVal)) {
      setInputBorderColor(Colors.danger);
      shake();
      setTimeout(() => setInputBorderColor(null), 700);
      return;
    }
    if (Math.abs(userVal - cfg.answer) < 0.01) {
      setInputBorderColor(cfg.accent);
      setSubmitLabel('✓ ¡Correcto!');
      setTimeout(() => {
        setInputBorderColor(null);
        setSubmitLabel('Confirmar respuesta');
        setInputVal('');
      }, 1400);
    } else {
      setInputBorderColor(Colors.danger);
      shake();
      setTimeout(() => {
        setInputBorderColor(null);
        setInputVal('');
      }, 700);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* Badge de nivel */}
      <TouchableOpacity
        style={[styles.levelBadge, { backgroundColor: cfg.badgeBg, borderColor: cfg.accent + '44' }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.levelBadgeText, { color: cfg.accent }]}>{cfg.badge}</Text>
        <Text style={[styles.levelBadgeArrow, { color: cfg.accent }]}>▼</Text>
      </TouchableOpacity>

      {/* Hora */}
      <Text style={styles.alarmTime}>{clock}</Text>
      <Text style={styles.alarmLabel}>despierta resolviendo</Text>

      {/* Puntos de progreso */}
      <View style={styles.progressRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < cfg.dotsFilled
                ? { backgroundColor: cfg.accent }
                : styles.dotEmpty,
            ]}
          />
        ))}
      </View>

      {/* Card matemática */}
      <View
        style={[
          styles.mathCard,
          { backgroundColor: cfg.cardBg, borderColor: cfg.cardBorder },
        ]}
      >
        <Text style={[styles.mathInstruction, { color: cfg.accent }]}>
          Resuelve para apagar la alarma
        </Text>

        {/* Hint pill */}
        <View style={[styles.hintPill, { backgroundColor: cfg.accent + '26' }]}>
          <Text style={[styles.hintText, { color: cfg.accent }]}>{cfg.hintLabel}</Text>
        </View>

        {/* Problema */}
        <Text style={styles.mathProblem}>{cfg.problem}</Text>

        {/* Input */}
        <Animated.View
          style={[
            styles.mathInputWrap,
            { borderColor: inputBorderColor ?? 'rgba(255,255,255,0.15)' },
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          <Text style={[styles.mathInputText, !inputVal && styles.mathInputPlaceholder]}>
            {inputVal || cfg.placeholder}
          </Text>
        </Animated.View>
      </View>

      {/* Teclado numérico */}
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key) => {
              const isAction = key === '⌫';
              const isDecimalOff = key === '.' && !cfg.decimal;
              const isDecimalOn = key === '.' && cfg.decimal;

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    isAction && styles.keyAction,
                  ]}
                  onPress={() => pressKey(key)}
                  activeOpacity={isDecimalOff ? 1 : 0.6}
                  disabled={isDecimalOff}
                >
                  <Text
                    style={[
                      styles.keyText,
                      isAction && styles.keyTextAction,
                      isDecimalOff && styles.keyTextDecimalOff,
                      isDecimalOn && { color: cfg.accent, fontWeight: '600' },
                    ]}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Botón confirmar */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: cfg.submitBg }]}
        onPress={checkAnswer}
        activeOpacity={0.85}
      >
        <Text style={[styles.submitText, { color: cfg.submitText }]}>{submitLabel}</Text>
      </TouchableOpacity>

      {/* Modal selector de nivel */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Seleccionar nivel</Text>

            {(['easy', 'normal', 'hard'] as Level[]).map((lvl) => {
              const c = LEVEL_CONFIG[lvl];
              const isActive = lvl === level;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.levelOption,
                    isActive && {
                      backgroundColor: c.badgeBg,
                      borderColor: c.accent + '55',
                    },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    setTimeout(() => setLevel(lvl), 160);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.levelOptionLeft}>
                    <View style={[styles.levelDot, { backgroundColor: c.accent }]} />
                    <View>
                      <Text
                        style={[
                          styles.levelOptionName,
                          { color: isActive ? c.accent : Colors.text },
                        ]}
                      >
                        {c.label}
                      </Text>
                      <Text style={styles.levelOptionHint}>{c.hintLabel}</Text>
                    </View>
                  </View>
                  {isActive && (
                    <Text style={[styles.levelCheck, { color: c.accent }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },

  // Badge nivel
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  levelBadgeArrow: {
    fontSize: 8,
    opacity: 0.65,
  },

  // Hora
  alarmTime: {
    fontSize: 64,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: 2,
    lineHeight: 72,
  },
  alarmLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 14,
  },

  // Progreso
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Card matemática
  mathCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  mathInstruction: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  hintPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '500',
  },
  mathProblem: {
    fontSize: 26,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  mathInputWrap: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  mathInputText: {
    fontSize: 20,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  mathInputPlaceholder: {
    color: 'rgba(255,255,255,0.25)',
  },

  // Teclado
  keypad: {
    width: '100%',
    gap: 6,
    marginBottom: 14,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  key: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  keyAction: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  keyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  keyTextAction: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  keyTextDecimalOff: {
    color: 'rgba(255,255,255,0.2)',
  },

  // Botón confirmar
  submitBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  levelOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelOptionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  levelOptionHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  levelCheck: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalCancel: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});