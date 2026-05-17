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
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useMathExercisesStore } from '../store/mathExercisesStore';
import { DIFFICULTY_STYLES, OPERATION_SYMBOLS, generateExpression } from '../constants/mathExercises.config';
import { Difficulty, OperationType, GeneratedExpression } from '../types/mathExercises.types';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ConfigMathMission'>;

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];
const OPERATIONS: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division'];

const OPERATION_LABELS: Record<OperationType, string> = {
  addition: 'Suma',
  subtraction: 'Resta',
  multiplication: 'Multiplicación',
  division: 'División',
};

function toAlarmDifficulty(difficulty: Difficulty) {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

export function MathMissionConfigScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const { config, setConfig } = useMathExercisesStore();

  const [difficulty, setDifficulty] = useState<Difficulty>(
    route.params?.difficulty ?? config.difficulty
  );
  const [quantity, setQuantity] = useState(route.params?.quantity ?? config.quantity);
  const [operationType, setOperationType] = useState<OperationType>(
    route.params?.operationType ?? config.operationType
  );

  const [preview, setPreview] = useState<GeneratedExpression>(
    generateExpression(
      route.params?.difficulty ?? config.difficulty,
      route.params?.operationType ?? config.operationType
    )
  );

  useEffect(() => {
    setPreview(generateExpression(difficulty, operationType));
  }, [difficulty, operationType]);

  const style = DIFFICULTY_STYLES[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);

  const handleSave = () => {
    setConfig({ difficulty, quantity, operationType });

    completeAlarmMissionConfigSession(
      route.params?.alarmConfigSessionId,
      {
        type: 'math',
        difficulty: toAlarmDifficulty(difficulty),
        quantity,
        operationType,
      },
    );

    // ✅ Solo guarda y vuelve, el botón "Ejecutar" está en el selector
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton style={styles.backButton} onPress={() => navigation.goBack()} />

        <View style={styles.headerPill}>
          <Text style={styles.headerText}>MISIÓN{'\n'}MATEMÁTICAS</Text>
        </View>

        <Text style={styles.sectionLabel}>Seleccione la dificultad</Text>
        <Text style={styles.subLabel}>Ejemplo</Text>

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
                      backgroundColor: difficulty === lvl ? style.accentColor : Colors.bgElevated,
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
          <Text style={styles.vecesText}> {quantity === 1 ? 'vez' : 'veces'}</Text>
        </View>

        <View style={styles.spacer} />

        {/* ✅ Color refleja dificultad, texto dice Guardar */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: style.textColor }]}>
            Guardar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 32,
    gap: 12,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 2,
  },
  headerPill: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  headerText: {
    color: Colors.white,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionLabel: { fontSize: Typography.sectionTitle.fontSize, color: Colors.text, marginBottom: 6 },
  subLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  previewBox: {
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.bgElevated,
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
  labelText: { fontSize: 13, color: Colors.textMuted },
  divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: 16 },
  operationsGrid: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  operationBtn: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  operationText: { fontSize: 24, fontWeight: '700', color: Colors.text },
  operationLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 2 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  quantityNum: { fontSize: 22, fontWeight: '500', color: Colors.text, minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 11, color: Colors.textSecondary },
  vecesText: { fontSize: 15, color: Colors.textSecondary },
  spacer: { flex: 1 },
  confirmBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmText: { fontSize: 16, fontWeight: '500' },
});
