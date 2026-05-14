import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../navigation/MissionsNavigator';

// Palabras
import { useWordCompletionStore } from '../wordCompletion/store/wordCompletionStore';
import { DIFFICULTY_STYLES as WORD_DIFFICULTY_STYLES } from '../wordCompletion/constants/wordCompletion.config';

// Matemáticas
import { useMathExercisesStore } from '../Math Exercises/store/mathExercisesStore';
import { DIFFICULTY_STYLES as MATH_DIFFICULTY_STYLES } from '../Math Exercises/constants/mathExercises.config';

// Movimiento
import { useMovementMissionStore } from '../MovementMission/store/movementMissionStore';
import {
  DIFFICULTY_COLORS as MOVEMENT_DIFFICULTY_COLORS,
  DIFFICULTY_LABELS as MOVEMENT_DIFFICULTY_LABELS,
} from '../MovementMission/constants/movementConstants';

// Colores
import { useColoredFiguresStore } from '../ColoredFigures/store/ColoredFiguresStore';
import { DIFFICULTY_STYLES as COLOR_DIFFICULTY_STYLES } from '../ColoredFigures/constants/ColoredFigure.config';

type Difficulty = 'easy' | 'medium' | 'hard';

type NavigationProp = NativeStackNavigationProp<
  MissionsStackParamList,
  'MissionSelector'
>;

const MOVEMENT_BG_COLORS: Record<Difficulty, string> = {
  easy: '#1A3D2B',
  medium: '#3D2E0A',
  hard: '#3D1010',
};

export default function MissionSelectorScreen() {
  const navigation = useNavigation<NavigationProp>();

  // Config de palabras
  const { config: wordConfig } = useWordCompletionStore();
  const wordStyle = WORD_DIFFICULTY_STYLES[wordConfig.difficulty];

  // Config de matemáticas
  const { config: mathConfig } = useMathExercisesStore();
  const mathStyle = MATH_DIFFICULTY_STYLES[mathConfig.difficulty];

  // Config de movimiento
  const { userConfig: movementConfig } = useMovementMissionStore();

  const movementStyle = {
    label: MOVEMENT_DIFFICULTY_LABELS[movementConfig.difficulty].toUpperCase(),
    accentColor: MOVEMENT_DIFFICULTY_COLORS[movementConfig.difficulty],
    bgColor: MOVEMENT_BG_COLORS[movementConfig.difficulty],
  };

  // Config de colores
  const { config: colorConfig } = useColoredFiguresStore();
  const colorStyle = COLOR_DIFFICULTY_STYLES[colorConfig.difficulty];

  const colorLevelLabel =
    colorConfig.difficulty === 'easy'
      ? 'NORMAL'
      : colorStyle.label;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Selecciona una misión</Text>

        {/* ── Misión de palabras ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Misión de palabras</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('ConfigWordCompletionMission', {})}
          >
            <Text style={styles.btnText}>Configurar misión de palabras</Text>
          </TouchableOpacity>

          <Text style={styles.summary}>
            {wordStyle.label} · {wordConfig.quantity} vec
            {wordConfig.quantity > 1 ? 'es' : ''}
          </Text>

          <TouchableOpacity
            style={[
              styles.executeBtn,
              {
                backgroundColor: wordStyle.bgColor,
                borderColor: wordStyle.accentColor + '50',
              },
            ]}
            onPress={() =>
              navigation.navigate('WordCompletionMissionScreen', {
                difficulty: wordConfig.difficulty,
                quantity: wordConfig.quantity,
              })
            }
          >
            <Text
              style={[
                styles.executeBtnText,
                { color: wordStyle.accentColor },
              ]}
            >
              Ejecutar misión de palabras
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Misión de matemáticas ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Misión de matemáticas</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('ConfigMathMission', {})}
          >
            <Text style={styles.btnText}>Configurar misión de matemáticas</Text>
          </TouchableOpacity>

          <Text style={styles.summary}>
            {mathStyle.label} · {mathConfig.quantity} vec
            {mathConfig.quantity > 1 ? 'es' : ''}
          </Text>

          <TouchableOpacity
            style={[
              styles.executeBtn,
              {
                backgroundColor: mathStyle.bgColor,
                borderColor: mathStyle.accentColor + '50',
              },
            ]}
            onPress={() =>
              navigation.navigate('MathMissionScreen', {
                difficulty: mathConfig.difficulty,
                quantity: mathConfig.quantity,
                operationType: mathConfig.operationType,
              })
            }
          >
            <Text
              style={[
                styles.executeBtnText,
                { color: mathStyle.accentColor },
              ]}
            >
              Ejecutar misión de matemáticas
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Misión de movimientos ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Misión de movimientos</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('ConfigMovementMission')}
          >
            <Text style={styles.btnText}>Configurar misión de movimientos</Text>
          </TouchableOpacity>

          <Text style={styles.summary}>
            {movementStyle.label} · {movementConfig.quantity} vec
            {movementConfig.quantity > 1 ? 'es' : ''}
          </Text>

          <TouchableOpacity
            style={[
              styles.executeBtn,
              {
                backgroundColor: movementStyle.bgColor,
                borderColor: movementStyle.accentColor + '50',
              },
            ]}
            onPress={() =>
              navigation.navigate('MovementMissionScreen', {
                difficulty: movementConfig.difficulty,
                quantity: movementConfig.quantity,
              })
            }
          >
            <Text
              style={[
                styles.executeBtnText,
                { color: movementStyle.accentColor },
              ]}
            >
              Ejecutar misión de movimientos
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Misión de colores ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Misión de colores</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              navigation.navigate('ConfigColoredFiguresMission', {})
            }
          >
            <Text style={styles.btnText}>Configurar misión de colores</Text>
          </TouchableOpacity>

          <Text style={styles.summary}>
            {colorLevelLabel} · {colorConfig.quantity} vec
            {colorConfig.quantity > 1 ? 'es' : ''}
          </Text>

          <TouchableOpacity
            style={[
              styles.executeBtn,
              {
                backgroundColor: colorStyle.bgColor,
                borderColor: colorStyle.accentColor + '50',
              },
            ]}
            onPress={() =>
              navigation.navigate('ColoredFiguresMissionScreen', {
                difficulty: colorConfig.difficulty,
                quantity: colorConfig.quantity,
              })
            }
          >
            <Text
              style={[
                styles.executeBtnText,
                { color: colorStyle.accentColor },
              ]}
            >
              Ejecutar misión de colores
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 18,
    flexGrow: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },

  btn: {
    backgroundColor: '#1A6EF5',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },

  executeBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },

  executeBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },

  summary: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});