import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { useMathExercisesStore } from '../store/mathExercisesStore';
import { DIFFICULTY_STYLES, OPERATION_SYMBOLS, generateExpression } from '../constants/mathExercises.config';
import { Difficulty, OperationType, GeneratedExpression } from '../types/mathExercises.types';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ConfigMathMission'>;

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];
const OPERATIONS: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division'];

const OPERATION_LABELS: Record<OperationType, string> = {
  addition: 'Suma',
  subtraction: 'Resta',
  multiplication: 'Multiplicación',
  division: 'División',
};

export function MathMissionConfigScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const { config, setConfig } = useMathExercisesStore();

  const [difficulty, setDifficulty] = useState<Difficulty>(
    route.params?.difficulty ?? config.difficulty
  );
  const [quantity, setQuantity] = useState(config.quantity);
  const [operationType, setOperationType] = useState<OperationType>(
    route.params?.operationType ?? config.operationType
  );

  // ✅ Preview dinámico según nivel + operación
  const [preview, setPreview] = useState<GeneratedExpression>(
    generateExpression(
      route.params?.difficulty ?? config.difficulty,
      route.params?.operationType ?? config.operationType
    )
  );

  // ✅ Se regenera cuando cambia nivel o botón de operación
  useEffect(() => {
    setPreview(generateExpression(difficulty, operationType));
  }, [difficulty, operationType]);

  const style = DIFFICULTY_STYLES[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);

  const handleSave = () => {
    setConfig({ difficulty, quantity, operationType });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerPill}>
          <Text style={styles.headerText}>MISIÓN{'\n'}MATEMÁTICAS</Text>
        </View>

        <Text style={styles.sectionLabel}>Seleccione la dificultad</Text>
        <Text style={styles.subLabel}>Ejemplo</Text>

        {/* ✅ Preview dinámico */}
        <View style={styles.previewBox}>
          <Text
            style={[
              styles.previewExpression,
              { color: '#000000', fontSize: width < 380 ? 13 : 15 },
            ]}
          >
            {preview.expression} ={' '}
            <Text style={{ fontWeight: '700' }}>{preview.answer}</Text>
          </Text>
        </View>

        <View style={styles.sliderWrapper}>
          <View style={styles.trackBg}>
            <View
              style={[
                styles.trackFill,
                { width: `${(sliderIdx / 2) * 100}%`, backgroundColor: style.accentColor },
              ]}
            />
            {LEVELS.map((lvl, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.thumbHit, { left: `${(i / 2) * 100}%` }]}
                onPress={() => setDifficulty(lvl)}
              >
                <View
                  style={[
                    styles.thumb,
                    {
                      backgroundColor: difficulty === lvl ? style.accentColor : '#444444',
                      borderColor: style.accentColor,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sliderLabels}>
            {LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={styles.labelBtn}
                onPress={() => setDifficulty(lvl)}
              >
                <Text
                  style={[
                    styles.labelText,
                    difficulty === lvl && { color: style.accentColor, fontWeight: '600' },
                  ]}
                >
                  {DIFFICULTY_STYLES[lvl].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Seleccione tipo de operación</Text>
        <View style={styles.operationsGrid}>
          {OPERATIONS.map((op) => (
            <TouchableOpacity
              key={op}
              style={[
                styles.operationBtn,
                operationType === op && {
                  backgroundColor: style.accentColor,
                  borderColor: style.accentColor,
                },
              ]}
              onPress={() => setOperationType(op)}
            >
              <Text
                style={[
                  styles.operationText,
                  operationType === op && { color: style.textColor },
                ]}
              >
                {OPERATION_SYMBOLS[op]}
              </Text>
              <Text
                style={[
                  styles.operationLabel,
                  operationType === op && { color: style.textColor },
                ]}
              >
                {OPERATION_LABELS[op]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Seleccione la cantidad</Text>
        <View style={styles.quantityRow}>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityNum}>{quantity}</Text>
            <View style={styles.arrows}>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setQuantity(Math.min(quantity + 1, 9))}
              >
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setQuantity(Math.max(quantity - 1, 1))}
              >
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.vecesText}>veces</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: style.textColor }]}>Confirmar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 20 },
  scroll: { paddingVertical: 32, gap: 12, paddingBottom: 40 },
  headerPill: {
    backgroundColor: '#1A6EF5',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  headerText: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionLabel: { fontSize: 14, color: '#E0E7FF', marginBottom: 6 },
  subLabel: { fontSize: 12, color: '#AAAAAA', marginBottom: 8 },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    marginBottom: 20,
  },
  previewExpression: {
    fontWeight: '500',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  sliderWrapper: { marginBottom: 8 },
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
  labelText: { fontSize: 13, color: '#667788' },
  divider: { height: 0.5, backgroundColor: '#1E1E1E', marginVertical: 16 },
  operationsGrid: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  operationBtn: {
    flex: 1,
    backgroundColor: '#1A2A3A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#2A4A6A',
  },
  operationText: { fontSize: 24, fontWeight: '700', color: '#E0E7FF' },
  operationLabel: { fontSize: 9, color: '#AAAAAA', marginTop: 2 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: '#1A2A3A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#2A4A6A',
  },
  quantityNum: { fontSize: 22, fontWeight: '500', color: '#E0E7FF', minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 11, color: '#AAAAAA' },
  vecesText: { fontSize: 15, color: '#AAAAAA' },
  spacer: { flex: 1 },
  confirmBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmText: { fontSize: 16, fontWeight: '500' },
});