import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Difficulty, FigureType } from '../types/ColoredFigures.types';
import { DIFFICULTY_STYLES } from '../constants/ColoredFigure.config';
import { useColoredFigures } from '../hooks/useColoredFigures';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { ReplaceButton } from './ReplaceButton';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
}

export function ColoredFiguresMission({ difficulty, quantity, onComplete, alarmLabel }: Props) {
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>(difficulty);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [missionCompleted, setMissionCompleted] = useState(false);

  const { current, state, handleInputChange, handleConfirm, handleReplace, reset } =
    useColoredFigures(currentDifficulty);

  const { time, day } = useCurrentTime();
  const style = DIFFICULTY_STYLES[currentDifficulty];
  const totalQuantity = Math.max(1, quantity);

  const handleSubmit = () => {
    const result = handleConfirm();
    if (result === null) return;
    if (!result) {
      setErrorCount(prev => prev + 1);
      return;
    }
    const nextCompleted = completedCount + 1;
    setCompletedCount(nextCompleted);
    setErrorCount(0);
    if (nextCompleted >= totalQuantity) {
      setMissionCompleted(true);
      return;
    }
    setTimeout(() => { reset(); }, 500);
  };

  const handleDifficultyDown = (next: Difficulty) => {
    setCurrentDifficulty(next);
    setErrorCount(0);
  };

  const renderFigure = (figure: FigureType, color: string) => {
    if (figure === 'circle') return <View style={[styles.figureBase, styles.circle, { backgroundColor: color }]} />;
    if (figure === 'square') return <View style={[styles.figureBase, styles.square, { backgroundColor: color }]} />;
    if (figure === 'rectangle') return <View style={[styles.rectangle, { backgroundColor: color }]} />;
    if (figure === 'diamond') return <View style={[styles.diamond, { backgroundColor: color }]} />;
    return <View style={[styles.triangle, { borderBottomColor: color }]} />;
  };

  if (missionCompleted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>Misión completada</Text>
          <Text style={styles.completedText}>
            Respondiste correctamente {totalQuantity} de {totalQuantity} figuras.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onComplete}>
            <Text style={styles.primaryBtnText}>Finalizar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.day}>{day}</Text>
            {alarmLabel ? <Text style={styles.alarmLabel}>{alarmLabel}</Text> : null}
          </View>

          <View style={[styles.badge, { backgroundColor: style.bgColor }]}>
            <Text style={[styles.badgeText, { color: style.accentColor }]}>{style.label}</Text>
          </View>

          <Text style={styles.progress}>Figura {completedCount + 1} de {totalQuantity}</Text>

          <View style={styles.card}>
            <Text style={styles.instruction}>Escribe el color de la figura</Text>
            <View style={styles.figureContainer}>
              {renderFigure(current.figure, current.hex)}
            </View>

            <TextInput
              value={state.userInput}
              onChangeText={handleInputChange}
              placeholder="Ej: rojo"
              placeholderTextColor="#556677"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, state.hasError ? styles.inputError : null, state.isCompleted ? styles.inputSuccess : null]}
              onSubmitEditing={handleSubmit}
            />

            {state.hasError ? <Text style={styles.errorText}>Color incorrecto. Intenta nuevamente.</Text> : null}
            {state.isCompleted ? <Text style={styles.successText}>Correcto.</Text> : null}

            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: style.accentColor }]} onPress={handleSubmit}>
              <Text style={styles.confirmBtnText}>Confirmar</Text>
            </TouchableOpacity>

            <ReplaceButton
              difficulty={currentDifficulty}
              errorCount={errorCount}
              onReplace={handleReplace}
              onDifficultyDown={handleDifficultyDown}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 36, paddingBottom: 24 },
  header: { alignItems: 'center', marginBottom: 16 },
  time: { fontSize: 42, fontWeight: '700', color: '#FFFFFF' },
  day: { fontSize: 14, color: '#8EA4B8', marginTop: 2 },
  alarmLabel: { fontSize: 12, color: '#556677', marginTop: 4 },
  badge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginBottom: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  progress: { textAlign: 'center', color: '#8EA4B8', fontSize: 13, marginBottom: 18 },
  card: { backgroundColor: '#111A24', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#1C2A38' },
  instruction: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  figureContainer: { height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  figureBase: { width: 120, height: 120, borderWidth: 1, borderColor: '#FFFFFF30' },
  circle: { borderRadius: 60 },
  square: { borderRadius: 12 },
  rectangle: { width: 150, height: 95, borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF30' },
  diamond: { width: 110, height: 110, borderRadius: 12, transform: [{ rotate: '45deg' }], borderWidth: 1, borderColor: '#FFFFFF30' },
  triangle: { width: 0, height: 0, borderLeftWidth: 70, borderRightWidth: 70, borderBottomWidth: 130, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  input: { height: 50, borderRadius: 14, backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#1C2A38', color: '#FFFFFF', paddingHorizontal: 14, fontSize: 15, marginBottom: 10 },
  inputError: { borderColor: '#F87171' },
  inputSuccess: { borderColor: '#4ADE80' },
  errorText: { color: '#F87171', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  successText: { color: '#4ADE80', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  confirmBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  confirmBtnText: { color: '#0D0D0D', fontSize: 15, fontWeight: '700' },
  completedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  completedTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 10 },
  completedText: { color: '#8EA4B8', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { backgroundColor: '#1A6EF5', height: 52, borderRadius: 14, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});