// src/features/missions/screens/MissionSelectorScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { MissionsStackParamList } from '../navigation/MissionsNavigator';

// Palabras
import { useWordCompletionStore } from '../wordCompletion/store/wordCompletionStore';
import { DIFFICULTY_STYLES as WORD_DIFFICULTY_STYLES } from '../wordCompletion/constants/wordCompletion.config';
import { usePairsMissionStore } from '../ParesMission/store/paresMissionStore';
import { DIFFICULTY_STYLES as PAIRS_DIFFICULTY_STYLES } from '../ParesMission/constants/paresMission.config';

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

// Objetos
import { ObjectBankService } from '../ObjectRecognition/services/objectBank.service';
import { useObjectRecognitionStore } from '../ObjectRecognition/store/objectRecognitionStore';
import { RecognizableObject } from '../ObjectRecognition/types/objectRecognition.types';

type Difficulty = 'easy' | 'medium' | 'hard';

type NavigationProp = NativeStackNavigationProp<
  MissionsStackParamList,
  'MissionSelector'
>;

const MOVEMENT_BG_COLORS: Record<Difficulty, string> = {
  easy: Colors.successDim,
  medium: Colors.warningDim,
  hard: Colors.dangerDim,
};

const OBJECT_DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'FACIL',
  medium: 'MEDIO',
  hard: 'DIFICIL',
};

const OBJECT_DIFFICULTY_QUANTITY: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const OBJECT_DIFFICULTY_STYLES: Record<
  Difficulty,
  { accentColor: string; bgColor: string }
> = {
  easy: {
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
  },
  medium: {
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
  },
  hard: {
    accentColor: '#F87171',
    bgColor: '#3D1010',
  },
};

export default function MissionSelectorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, statusBarStyle } = useAppTheme();

  // Config de palabras
  const { config: wordConfig } = useWordCompletionStore();
  const wordStyle = WORD_DIFFICULTY_STYLES[wordConfig.difficulty];

  // Config de pares
  const { config: pairsConfig } = usePairsMissionStore();
  const pairsStyle = PAIRS_DIFFICULTY_STYLES[pairsConfig.difficulty];

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

  // Config de objetos
  const { config: objectConfig } = useObjectRecognitionStore();
  const [objectBank, setObjectBank] = useState<RecognizableObject[]>([]);

  useEffect(() => {
    setObjectBank(ObjectBankService.getEnabled());
  }, []);

  const selectedObjects = useMemo(
    () =>
      objectBank.filter((object) =>
        objectConfig.targetObjectIds.includes(object.id),
      ),
    [objectBank, objectConfig.targetObjectIds],
  );

  const objectPoolCount = selectedObjects.length || objectBank.length;
  const objectStyle = OBJECT_DIFFICULTY_STYLES[objectConfig.difficulty];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Selecciona una misión
        </Text>

        {/* ── Misión de palabras ── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Misión de palabras
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ConfigWordCompletionMission', {})}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>
              Configurar misión de palabras
            </Text>
          </TouchableOpacity>

          <Text style={[styles.summary, { color: colors.textSecondary }]}>
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
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Misión de matemáticas
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ConfigMathMission', {})}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>
              Configurar misión de matemáticas
            </Text>
          </TouchableOpacity>

          <Text style={[styles.summary, { color: colors.textSecondary }]}>
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
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Misión de movimientos
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ConfigMovementMission')}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>
              Configurar misión de movimientos
            </Text>
          </TouchableOpacity>

          <Text style={[styles.summary, { color: colors.textSecondary }]}>
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
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Misión de colores
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() =>
              navigation.navigate('ConfigColoredFiguresMission', {})
            }
          >
            <Text style={[styles.btnText, { color: colors.white }]}>
              Configurar misión de colores
            </Text>
          </TouchableOpacity>

          <Text style={[styles.summary, { color: colors.textSecondary }]}>
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

        {/* ── Misión de objetos ── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Misión de objetos
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ConfigObjectRecognitionMission')}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>
              Configurar objeto
            </Text>
          </TouchableOpacity>

          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {OBJECT_DIFFICULTY_LABELS[objectConfig.difficulty]} -{' '}
            {OBJECT_DIFFICULTY_QUANTITY[objectConfig.difficulty]} de{' '}
            {objectPoolCount} al azar
          </Text>

          <TouchableOpacity
            style={[
              styles.executeBtn,
              {
                backgroundColor: objectStyle.bgColor,
                borderColor: objectStyle.accentColor + '50',
                opacity: objectPoolCount === 0 ? 0.45 : 1,
              },
            ]}
            onPress={() =>
              navigation.navigate('ObjectRecognitionMissionScreen', {
                difficulty: objectConfig.difficulty,
                targetObjectIds:
                  selectedObjects.length > 0
                    ? selectedObjects.map((object) => object.id)
                    : objectBank.map((object) => object.id),
              })
            }
            disabled={objectPoolCount === 0}
          >
            <Text
              style={[
                styles.executeBtnText,
                { color: objectStyle.accentColor },
              ]}
            >
              Ejecutar misión de objetos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mision encontrar pares */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Mision encontrar pares
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ConfigParesMission', {})}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>
              Configurar encontrar pares
            </Text>
          </TouchableOpacity>

          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {pairsStyle.label} - {pairsConfig.quantity} vec
            {pairsConfig.quantity > 1 ? 'es' : ''}
          </Text>

          <TouchableOpacity
            style={[
              styles.executeBtn,
              {
                backgroundColor: pairsStyle.bgColor,
                borderColor: pairsStyle.accentColor + '50',
              },
            ]}
            onPress={() =>
              navigation.navigate('ParesMissionScreen', {
                difficulty: pairsConfig.difficulty,
                quantity: pairsConfig.quantity,
              })
            }
          >
            <Text
              style={[
                styles.executeBtnText,
                { color: pairsStyle.accentColor },
              ]}
            >
              Ejecutar encontrar pares
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
  },

  scroll: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 32,
    gap: 18,
    flexGrow: 1,
  },

  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    marginBottom: 6,
    textAlign: 'center',
  },

  card: {
    borderRadius: Layout.cardRadius,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },

  btn: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
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
    textAlign: 'center',
  },
});
