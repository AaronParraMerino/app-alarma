import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MovementDifficulty, MovementMissionUserConfig } from '../types/movement.types';
import {
  ALL_MOVEMENT_STEPS,
  DIFFICULTY_STYLES,
  MAX_QUANTITY,
  MIN_QUANTITY,
  MOVEMENT_EXAMPLES,
} from '../constants/movementConstants';
import { MOVEMENT_IMAGES } from '../constants/movementAssets';

interface MovementMissionConfigScreenProps {
  onConfirm: (config: MovementMissionUserConfig) => void;
  initialDifficulty?: MovementDifficulty;
  initialQuantity?: number;
}

const LEVELS: MovementDifficulty[] = ['easy', 'medium', 'hard'];

// Pantalla para elegir dificultad y cantidad de movimientos
export function MovementMissionConfigScreen({
  onConfirm,
  initialDifficulty = 'easy',
  initialQuantity = 3,
}: MovementMissionConfigScreenProps) {
  const { width, height } = useWindowDimensions();
  const [difficulty, setDifficulty] = useState<MovementDifficulty>(initialDifficulty);
  const [quantity, setQuantity] = useState(
    Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, initialQuantity)),
  );

  const style = DIFFICULTY_STYLES[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);
  // Ejemplos visuales segun la dificultad seleccionada.
  const examples = MOVEMENT_EXAMPLES[difficulty].map(type => ALL_MOVEMENT_STEPS[type]);

  const isSmall = width < 360;
  const isShort = height < 680;
  const fontBase = isSmall ? 12 : 14;
  const pillPadV = isShort ? 7 : 10;
  const sectionGap = isShort ? 10 : 16;
  const previewMin = isShort ? 90 : 110;

  // La cantidad se limita entre el minimo y maximo permitidos
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: isSmall ? 14 : 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerPill, { paddingVertical: pillPadV, marginBottom: sectionGap }]}>
          <Text style={[styles.headerText, { fontSize: isSmall ? 12 : 14 }]}>
            MISION{'\n'}DE MOVIMIENTO
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { fontSize: fontBase, marginBottom: 6 }]}>
          Seleccione la dificultad
        </Text>
        <Text style={[styles.subLabel, { fontSize: isSmall ? 11 : 12 }]}>Ejemplo</Text>

        <View
          style={[
            styles.previewBox,
            {
              minHeight: previewMin,
              marginBottom: sectionGap,
              borderColor: style.accentColor + '40',
            },
          ]}
        >
          <Text style={[styles.previewTitle, { color: style.accentColor }]}>
            {style.label}
          </Text>

          <View style={styles.exampleRow}>
            {examples.map((step, index) => (
              <View key={`${step.type}-${index}`} style={styles.exampleItem}>
                <Image
                  source={MOVEMENT_IMAGES[step.type]}
                  style={styles.exampleImage}
                  resizeMode="contain"
                />
                <Text numberOfLines={2} style={styles.exampleLabel}>
                  {step.label}
                </Text>
              </View>
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
                  backgroundColor: style.accentColor,
                },
              ]}
            />
            {LEVELS.map((level, index) => (
              <TouchableOpacity
                key={level}
                style={[styles.thumbHit, { left: `${(index / 2) * 100}%` as any }]}
                onPress={() => setDifficulty(level)}
              >
                <View
                  style={[
                    styles.thumb,
                    {
                      backgroundColor: sliderIdx >= index ? style.accentColor : '#2a2a2a',
                      borderColor: sliderIdx >= index ? style.accentColor : '#444',
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sliderLabels}>
            {LEVELS.map(level => (
              <TouchableOpacity key={level} onPress={() => setDifficulty(level)} style={styles.labelBtn}>
                <Text
                  style={[
                    styles.labelText,
                    { fontSize: isSmall ? 11 : 13 },
                    difficulty === level && { color: style.accentColor, fontWeight: '500' },
                  ]}
                >
                  {DIFFICULTY_STYLES[level].label.charAt(0) +
                    DIFFICULTY_STYLES[level].label.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { marginVertical: sectionGap }]} />

        <Text style={[styles.sectionLabel, { fontSize: fontBase, marginBottom: 6 }]}>
          Seleccione la cantidad
        </Text>
        <View style={styles.quantityRow}>
          <View style={[styles.quantityBox, { paddingVertical: isShort ? 8 : 10 }]}>
            <Text style={[styles.quantityNum, { fontSize: isSmall ? 18 : 22 }]}>
              {quantity}
            </Text>
            <View style={styles.arrows}>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))}
                style={styles.arrowBtn}
              >
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.max(MIN_QUANTITY, q - 1))}
                style={styles.arrowBtn}
              >
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.vecesText, { fontSize: isSmall ? 13 : 15 }]}>veces</Text>
        </View>

        <View style={{ height: isShort ? 16 : 32 }} />

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { backgroundColor: style.accentColor, height: isShort ? 46 : 52 },
          ]}
          onPress={() => onConfirm({ difficulty, quantity })}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: style.textColor, fontSize: isSmall ? 14 : 16 }]}>
            Confirmar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flexGrow: 1, paddingTop: 70, paddingBottom: 24 },
  headerPill: {
    backgroundColor: '#1A6EF5',
    borderRadius: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  headerText: { color: '#E0E7FF', fontWeight: '500', textAlign: 'center', letterSpacing: 0.5 },
  sectionLabel: { color: '#E0E7FF' },
  subLabel: { color: '#AAAAAA', marginBottom: 8 },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12 },
  exampleRow: { flexDirection: 'row', gap: 8, width: '100%', justifyContent: 'center' },
  exampleItem: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  exampleImage: { width: 90, height: 90 },
  exampleLabel: { color: '#1F2937', fontSize: 11, textAlign: 'center', lineHeight: 14, fontWeight: '600' },
  sliderWrapper: {},
  trackBg: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    marginHorizontal: 10,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  trackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  thumbHit: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    top: -13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  labelBtn: { flex: 1, alignItems: 'center' },
  labelText: { color: '#667788' },
  divider: { height: 0.5, backgroundColor: '#1E1E1E' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: '#1A2A3A',
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#2A4A6A',
  },
  quantityNum: { fontWeight: '500', color: '#E0E7FF', minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 11, color: '#AAAAAA' },
  vecesText: { color: '#AAAAAA' },
  confirmBtn: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontWeight: '500' },
});
