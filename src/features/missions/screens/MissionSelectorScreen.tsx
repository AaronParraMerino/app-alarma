import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../navigation/MissionsNavigator';

// Palabras
import { useWordCompletionStore } from '../wordCompletion/store/wordCompletionStore';
import { DIFFICULTY_STYLES as WORD_DIFFICULTY_STYLES } from '../wordCompletion/constants/wordCompletion.config';

// Matemáticas
import { useMathExercisesStore } from '../Math Exercises/store/mathExercisesStore';
import { DIFFICULTY_STYLES as MATH_DIFFICULTY_STYLES } from '../Math Exercises/constants/mathExercises.config';

type NavigationProp = NativeStackNavigationProp<MissionsStackParamList, 'MissionSelector'>;

export default function MissionSelectorScreen() {
  const navigation = useNavigation<NavigationProp>();

  // Config de palabras
  const { config: wordConfig } = useWordCompletionStore();
  const wordStyle = WORD_DIFFICULTY_STYLES[wordConfig.difficulty];

  // Config de matemáticas ✅
  const { config: mathConfig } = useMathExercisesStore();
  const mathStyle = MATH_DIFFICULTY_STYLES[mathConfig.difficulty];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Selecciona una misión</Text>

        {/* ── Misión de palabras ── */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('ConfigWordCompletionMission', {})}
        >
          <Text style={styles.btnText}>Configurar misión de palabras</Text>
        </TouchableOpacity>

        <Text style={styles.summary}>
          {wordStyle.label}  ·  {wordConfig.quantity} vec{wordConfig.quantity > 1 ? 'es' : ''}
        </Text>

        <TouchableOpacity
          style={[styles.executeBtn, { backgroundColor: wordStyle.bgColor, borderColor: wordStyle.accentColor + '50' }]}
          onPress={() =>
            navigation.navigate('WordCompletionMissionScreen', {
              difficulty: wordConfig.difficulty,
              quantity:   wordConfig.quantity,
            })
          }
        >
          <Text style={[styles.executeBtnText, { color: wordStyle.accentColor }]}>
            Ejecutar misión de palabras
          </Text>
        </TouchableOpacity>

        {/* ── Separador ── */}
        <View style={styles.divider} />

        {/* ── Misión de matemáticas ── */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('ConfigMathMission', {})}
        >
          <Text style={styles.btnText}>Configurar misión de matemáticas</Text>
        </TouchableOpacity>

        {/* ✅ Usa mathStyle para label y cantidad */}
        <Text style={styles.summary}>
          {mathStyle.label}  ·  {mathConfig.quantity} vec{mathConfig.quantity > 1 ? 'es' : ''}
        </Text>

        {/* ✅ Botón pintado con el color de la dificultad de matemáticas */}
        <TouchableOpacity
          style={[styles.executeBtn, { backgroundColor: mathStyle.bgColor, borderColor: mathStyle.accentColor + '50' }]}
          onPress={() =>
            navigation.navigate('MathMissionScreen', {
              difficulty:    mathConfig.difficulty,
              quantity:      mathConfig.quantity,
              operationType: mathConfig.operationType,
            })
          }
        >
          <Text style={[styles.executeBtnText, { color: mathStyle.accentColor }]}>
            Ejecutar misión de matemáticas
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: '#0D0D0D',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    gap: 12,
    flexGrow: 1,
  },
  title: {
    fontSize: 20, fontWeight: '500', color: '#FFFFFF',
    marginBottom: 8, textAlign: 'center',
  },
  btn: {
    backgroundColor: '#1A6EF5', borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  executeBtn: {
    borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5,
  },
  executeBtnText: { fontSize: 15, fontWeight: '500' },
  summary: { fontSize: 12, color: '#556677', textAlign: 'center' },
  divider: {
    height: 1, backgroundColor: '#1C2A38', marginVertical: 8,
  },
});