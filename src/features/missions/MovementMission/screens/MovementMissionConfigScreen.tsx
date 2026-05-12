import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';

import {
  MovementDifficulty,
  MovementMissionUserConfig,
} from '../types/movement.types';

import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
} from '../constants/movementConstants';

interface MovementMissionConfigScreenProps {
  onConfirm: (config: MovementMissionUserConfig) => void;
}

const DIFFICULTIES: MovementDifficulty[] = ['easy', 'medium', 'hard'];

const DIFFICULTY_DESCRIPTIONS: Record<MovementDifficulty, string> = {
  easy: 'Un movimiento simple y corto.\nIdeal para levantarte rápido.',
  medium: 'Movimiento continuo o una secuencia.\nEvita quedarte dormido de nuevo.',
  hard: 'Secuencias dinámicas y coordinación.\nDespierta completamente.',
};

const DIFFICULTY_ICONS: Record<MovementDifficulty, string> = {
  easy: '🚶',
  medium: '🏃',
  hard: '🏋️',
};

const DIFFICULTY_EXAMPLE_STEPS: Record<MovementDifficulty, string[]> = {
  easy: ['Agita el teléfono', 'Gira el teléfono', 'Inclina a un lado'],
  medium: ['Camina 1 minuto', 'Gira + camina', 'Mueve en varias direcciones'],
  hard: ['Serie aleatoria de movimientos', 'Caminar + giros simultáneos', 'Secuencia con tiempo límite'],
};

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 5;

const MOVEMENT_UI_COLORS = {
  easy: {
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
  },
  medium: {
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
  },
  hard: {
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
  },
} as const;

export function MovementMissionConfigScreen({
  onConfirm,
}: MovementMissionConfigScreenProps) {
  const { width, height } = useWindowDimensions();

  const [difficulty, setDifficulty] = useState<MovementDifficulty>('easy');
  const [quantity, setQuantity] = useState(3);

  const difficultyStyle = MOVEMENT_UI_COLORS[difficulty];
  const color = difficultyStyle.accentColor;
  const sliderIdx = DIFFICULTIES.indexOf(difficulty);

  const isSmall = width < 360;
  const isShort = height < 680;

  const fontBase = isSmall ? 12 : 14;
  const pillPadV = isShort ? 7 : 10;
  const sectionGap = isShort ? 10 : 16;
  const previewMin = isShort ? 140 : 170;

  const confirmTextColor = difficulty === 'hard' ? '#FFFFFF' : '#0D0D0D';

  const handleConfirm = () => {
    onConfirm({ difficulty, quantity });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: isSmall ? 14 : 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
      <View
  style={[
    styles.headerPill,
    {
      backgroundColor: '#1A6EF5',
      borderColor: '#1A6EF5',
      paddingVertical: pillPadV,
      marginBottom: sectionGap,
    },
  ]}
>
  <Text
    style={[
      styles.headerText,
      {
        color: '#FFFFFF',
        fontSize: isSmall ? 12 : 14,
      },
    ]}
  >
    MISIÓN{'\n'}DE MOVIMIENTO
  </Text>
</View>

        <Text
          style={[
            styles.sectionLabel,
            {
              fontSize: fontBase,
              marginBottom: 6,
            },
          ]}
        >
          Seleccione la dificultad
        </Text>

        <Text style={[styles.subLabel, { fontSize: isSmall ? 11 : 12 }]}>
          Ejemplo
        </Text>

        <View
          style={[
            styles.previewBox,
            {
              minHeight: previewMin,
              marginBottom: sectionGap,
              borderColor: color + '55',
            },
          ]}
        >
          <Text style={[styles.previewIcon, { fontSize: isSmall ? 38 : 46 }]}>
            {DIFFICULTY_ICONS[difficulty]}
          </Text>

          <Text style={[styles.previewDifficulty, { color }]}>
            {DIFFICULTY_LABELS[difficulty].toUpperCase()}
          </Text>

          <Text style={styles.previewDesc}>
            {DIFFICULTY_DESCRIPTIONS[difficulty]}
          </Text>

          <View style={styles.exampleList}>
            {DIFFICULTY_EXAMPLE_STEPS[difficulty].map((ex, index) => (
              <Text key={index} style={styles.exampleItem}>
                • {ex}
              </Text>
            ))}
          </View>
        </View>

        <View style={[styles.sliderWrapper, { marginBottom: isShort ? 4 : 8 }]}>
          <View style={styles.trackBg}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${(sliderIdx / 2) * 100}%`,
                  backgroundColor: color,
                },
              ]}
            />

            {DIFFICULTIES.map((level, index) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.thumbHit,
                  {
                    left: `${(index / 2) * 100}%` as any,
                  },
                ]}
                onPress={() => setDifficulty(level)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.thumb,
                    {
                      backgroundColor:
                        sliderIdx >= index ? color : '#2A2A2A',
                      borderColor:
                        sliderIdx >= index ? color : '#444444',
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sliderLabels}>
            {DIFFICULTIES.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setDifficulty(level)}
                style={styles.labelBtn}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.labelText,
                    { fontSize: isSmall ? 11 : 13 },
                    difficulty === level && {
                      color,
                      fontWeight: '500',
                    },
                  ]}
                >
                  {DIFFICULTY_LABELS[level]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { marginVertical: sectionGap }]} />

        <Text
          style={[
            styles.sectionLabel,
            {
              fontSize: fontBase,
              marginBottom: 6,
            },
          ]}
        >
          {difficulty === 'easy'
            ? 'Seleccione las repeticiones'
            : 'Seleccione la cantidad'}
        </Text>

        <View style={styles.quantityRow}>
          <View
            style={[
              styles.quantityBox,
              {
                paddingVertical: isShort ? 8 : 10,
                borderColor: color + '55',
              },
            ]}
          >
            <Text
              style={[
                styles.quantityNum,
                {
                  color,
                  fontSize: isSmall ? 18 : 22,
                },
              ]}
            >
              {quantity}
            </Text>

            <View style={styles.arrows}>
              <TouchableOpacity
                onPress={() =>
                  setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))
                }
                style={styles.arrowBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setQuantity((q) => Math.max(MIN_QUANTITY, q - 1))
                }
                style={styles.arrowBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.vecesText, { fontSize: isSmall ? 13 : 15 }]}>
            {difficulty === 'easy'
              ? quantity === 1
                ? 'vez'
                : 'veces'
              : quantity === 1
                ? 'secuencia'
                : 'secuencias'}
          </Text>
        </View>

        <View style={{ height: isShort ? 16 : 32 }} />

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            {
              backgroundColor: color,
              height: isShort ? 46 : 52,
            },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.confirmText,
              {
                color: confirmTextColor,
                fontSize: isSmall ? 14 : 16,
              },
            ]}
          >
            Confirmar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 70,
    paddingBottom: 24,
  },
  headerPill: {
    borderRadius: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  headerText: {
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: '#E0E7FF',
  },
  subLabel: {
    color: '#AAAAAA',
    marginBottom: 8,
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    marginBottom: 8,
  },
  previewDifficulty: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  previewDesc: {
    color: '#1A1A1A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 10,
  },
  exampleList: {
    width: '100%',
    gap: 3,
  },
  exampleItem: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'center',
  },
  sliderWrapper: {},
  trackBg: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    marginHorizontal: 10,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumbHit: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    top: -13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelBtn: {
    flex: 1,
    alignItems: 'center',
  },
  labelText: {
    color: '#667788',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#1E1E1E',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBox: {
    backgroundColor: '#1A2A3A',
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
  },
  quantityNum: {
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  arrows: {
    gap: 2,
  },
  arrowBtn: {
    paddingHorizontal: 4,
  },
  arrowText: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  vecesText: {
    color: '#AAAAAA',
  },
  confirmBtn: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontWeight: '500',
  },
});