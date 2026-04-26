import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Difficulty } from '../types/mathExercises.types';
import { DIFFICULTY_STYLES } from '../constants/mathExercises.config';
import { useMathExercises } from '../hooks/useMathExercises';

interface Props {
  difficulty: Difficulty;
  quantity: number;
  onComplete: () => void;
  alarmLabel?: string;
}

export function MathExercisesMission({ difficulty, quantity, onComplete, alarmLabel }: Props) {
  const { width } = useWindowDimensions();
  const [missionCount, setMissionCount] = React.useState(0);

  const style = DIFFICULTY_STYLES[difficulty];
  const { state, current, handleInputChange, handleConfirm, handleReplace } =
    useMathExercises(difficulty, 1);

  React.useEffect(() => {
    if (!state.isCompleted) return;
    const next = missionCount + 1;
    if (next >= quantity) {
      onComplete();
    } else {
      setMissionCount(next);
      handleReplace();
    }
  }, [state.isCompleted]);

  // ✅ Muestra expression compleja si existe, si no el formato simple
  const displayExpression = current?.expression
    ? current.expression
    : current
    ? `${current.num1} ${current.operation} ${current.num2}`
    : '...';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.screen}>
          <View
            style={[
              styles.pill,
              { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' },
            ]}
          >
            <Text style={[styles.pillText, { color: style.accentColor }]}>
              {style.label}
            </Text>
          </View>

          <View style={styles.timeBlock}>
            <Text style={[styles.time, { fontSize: width < 380 ? 44 : 52 }]}>05:30</Text>
            <Text style={styles.dateLabel}>Miércoles — Hora de levantarse</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.body}>
            <Text style={styles.instruction}>Resuelve la operación matemática</Text>

            <View
              style={[
                styles.mathBox,
                { backgroundColor: style.bgColor, borderColor: style.accentColor + '30' },
              ]}
            >
              {/* ✅ Expresión compleja */}
              <Text
                style={[
                  styles.mathExpression,
                  { color: style.accentColor, fontSize: width < 380 ? 22 : 26 },
                ]}
              >
                {displayExpression} = ?
              </Text>
            </View>

            <Text style={[styles.hint, { color: style.accentColor + '80' }]}>
              Ingresa tu respuesta numérica
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: state.hasError ? '#F87171' : style.accentColor + '60',
                  color: style.accentColor,
                  fontSize: width < 380 ? 18 : 22,
                },
              ]}
              value={state.userInput}
              onChangeText={handleInputChange}
              placeholder="0"
              placeholderTextColor="#334455"
              keyboardType="decimal-pad"
              maxLength={8}
            />

            {state.hasError && (
              <Text style={styles.errorText}>Respuesta incorrecta, intenta de nuevo</Text>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, { color: style.textColor }]}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  pill: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  pillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeBlock: { alignItems: 'center', paddingVertical: 10 },
  time: { fontWeight: '500', color: '#FFFFFF', letterSpacing: -1, lineHeight: 56 },
  dateLabel: { fontSize: 12, color: '#556677', marginTop: 2 },
  divider: { height: 0.5, backgroundColor: '#1E1E1E', marginHorizontal: 16, marginVertical: 10 },
  body: { flex: 1, paddingHorizontal: 18, paddingBottom: 16 },
  instruction: { fontSize: 12, color: '#667788', marginBottom: 12 },
  mathBox: {
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 0.5,
  },
  mathExpression: {
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  input: {
    backgroundColor: '#161616',
    borderWidth: 0.5,
    borderRadius: 10,
    height: 52,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  errorText: { fontSize: 11, color: '#F87171', textAlign: 'center', marginBottom: 4 },
  hint: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  confirmBtn: {
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  confirmText: { fontSize: 15, fontWeight: '500' },
});