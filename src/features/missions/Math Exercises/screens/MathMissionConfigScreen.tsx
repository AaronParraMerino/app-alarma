// src/features/missions/Math Exercises/screens/MathMissionConfigScreen.tsx
import React, {
  useEffect,
  useState,
} from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { Colors } from '../../../../shared/theme/colors';

import { useMathExercisesStore } from '../store/mathExercisesStore';
import {
  DIFFICULTY_STYLES,
  OPERATION_SYMBOLS,
  generateExpression,
} from '../constants/mathExercises.config';
import {
  Difficulty,
  OperationType,
  GeneratedExpression,
} from '../types/mathExercises.types';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ConfigMathMission'
>;

const LEVELS: Difficulty[] = [
  'easy',
  'medium',
  'hard',
];

const OPERATIONS: OperationType[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

const OPERATION_LABELS_ES: Record<
  OperationType,
  string
> = {
  addition: 'Suma',
  subtraction: 'Resta',
  multiplication: 'Multiplicación',
  division: 'División',
};

const OPERATION_LABELS_EN: Record<
  OperationType,
  string
> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
};

function toAlarmDifficulty(
  difficulty: Difficulty,
) {
  if (difficulty === 'medium') {
    return 'normal';
  }

  return difficulty;
}

function getDifficultyLabel(
  difficulty: Difficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish
      ? 'Fácil'
      : 'Easy';
  }

  if (difficulty === 'medium') {
    return isSpanish
      ? 'Medio'
      : 'Medium';
  }

  return isSpanish
    ? 'Difícil'
    : 'Hard';
}

function getOperationLabel(
  operation: OperationType,
  isSpanish: boolean,
): string {
  return isSpanish
    ? OPERATION_LABELS_ES[operation]
    : OPERATION_LABELS_EN[operation];
}

export function MathMissionConfigScreen({
  navigation,
  route,
}: Props) {
  const {
    width,
  } = useWindowDimensions();

  const {
    colors,
    isDark,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish =
    language === 'es';

  const {
    config,
    setConfig,
  } = useMathExercisesStore();

  const [
    difficulty,
    setDifficulty,
  ] = useState<Difficulty>(
    route.params?.difficulty ??
      config.difficulty,
  );

  const [
    quantity,
    setQuantity,
  ] = useState(
    route.params?.quantity ??
      config.quantity,
  );

  const [
    operationType,
    setOperationType,
  ] = useState<OperationType>(
    route.params?.operationType ??
      config.operationType,
  );

  const [
    preview,
    setPreview,
  ] = useState<GeneratedExpression>(
    generateExpression(
      route.params?.difficulty ??
        config.difficulty,
      route.params?.operationType ??
        config.operationType,
    ),
  );

  useEffect(() => {
    setPreview(
      generateExpression(
        difficulty,
        operationType,
      ),
    );
  }, [
    difficulty,
    operationType,
  ]);

  const difficultyStyle =
    DIFFICULTY_STYLES[difficulty];
  const previewBgColor =
    isDark ? colors.white : Colors.bgCard;
  const previewTextColor =
    isDark ? colors.black : colors.white;

  const sliderIdx =
    LEVELS.indexOf(difficulty);

  const handleSave = () => {
    setConfig({
      difficulty,
      quantity,
      operationType,
    });

    if (route.params?.practice) {
      navigation.navigate('MathMissionScreen', {
        difficulty,
        quantity,
        operationType,
        practice: true,
      });
      return;
    }

    completeAlarmMissionConfigSession(
      route.params?.alarmConfigSessionId,
      {
        type: 'math',
        difficulty: toAlarmDifficulty(difficulty),
        quantity,
        operationType,
      },
    );

    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <BackButton
          label={
            isSpanish
              ? 'Volver'
              : 'Back'
          }
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        />

        <View
          style={[
            styles.headerPill,
            {
              backgroundColor:
                difficultyStyle.accentColor,
            },
          ]}
        >
          <Ionicons
            name="calculator-outline"
            size={24}
            color={difficultyStyle.textColor}
          />

          <Text
            style={[
              styles.headerText,
              {
                color:
                  difficultyStyle.textColor,
              },
            ]}
          >
            {isSpanish
              ? 'MISIÓN\nMATEMÁTICAS'
              : 'MISSION\nMATH'}
          </Text>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish
            ? 'Seleccione la dificultad'
            : 'Select the difficulty'}
        </Text>

        <Text
          style={[
            styles.subLabel,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {isSpanish
            ? 'Ejemplo'
            : 'Example'}
        </Text>

        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: previewBgColor,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.previewExpression,
              {
                color: previewTextColor,
                fontSize:
                  width < 380 ? 13 : 15,
              },
            ]}
          >
            {preview.expression} ={' '}
            <Text style={styles.previewAnswer}>
              {preview.answer}
            </Text>
          </Text>
        </View>

        <View style={styles.sliderWrapper}>
          <View
            style={[
              styles.trackBg,
              {
                backgroundColor:
                  colors.bgElevated,
              },
            ]}
          >
            <View
              style={[
                styles.trackFill,
                {
                  width: `${(sliderIdx / 2) * 100}%`,
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
            />

            {LEVELS.map(
              (
                level,
                index,
              ) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.thumbHit,
                    {
                      left: `${(index / 2) * 100}%`,
                    },
                  ]}
                  onPress={() =>
                    setDifficulty(level)
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.thumb,
                      {
                        backgroundColor:
                          difficulty === level
                            ? difficultyStyle.accentColor
                            : colors.bgElevated,
                        borderColor:
                          difficultyStyle.accentColor,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ),
            )}
          </View>

          <View style={styles.sliderLabels}>
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={styles.labelBtn}
                onPress={() =>
                  setDifficulty(level)
                }
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.labelText,
                    {
                      color:
                        difficulty === level
                          ? difficultyStyle.accentColor
                          : colors.textMuted,
                      fontWeight:
                        difficulty === level
                          ? '700'
                          : '500',
                    },
                  ]}
                >
                  {getDifficultyLabel(
                    level,
                    isSpanish,
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.border,
            },
          ]}
        />

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish
            ? 'Seleccione tipo de operación'
            : 'Select operation type'}
        </Text>

        <View style={styles.operationsGrid}>
          {OPERATIONS.map((operation) => {
            const active =
              operationType === operation;

            return (
              <TouchableOpacity
                key={operation}
                style={[
                  styles.operationBtn,
                  {
                    backgroundColor: active
                      ? difficultyStyle.accentColor
                      : colors.bgElevated,
                    borderColor: active
                      ? difficultyStyle.accentColor
                      : colors.border,
                  },
                ]}
                onPress={() =>
                  setOperationType(operation)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.operationText,
                    {
                      color: active
                        ? difficultyStyle.textColor
                        : colors.text,
                    },
                  ]}
                >
                  {OPERATION_SYMBOLS[operation]}
                </Text>

                <Text
                  style={[
                    styles.operationLabel,
                    {
                      color: active
                        ? difficultyStyle.textColor
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {getOperationLabel(
                    operation,
                    isSpanish,
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.border,
            },
          ]}
        />

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish
            ? 'Seleccione la cantidad'
            : 'Select the quantity'}
        </Text>

        <View style={styles.quantityRow}>
          <View
            style={[
              styles.quantityBox,
              {
                backgroundColor:
                  colors.bgElevated,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.quantityNum,
                {
                  color: colors.text,
                },
              ]}
            >
              {quantity}
            </Text>

            <View style={styles.arrows}>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() =>
                  setQuantity(
                    Math.min(
                      quantity + 1,
                      9,
                    ),
                  )
                }
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.arrowText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  ▲
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() =>
                  setQuantity(
                    Math.max(
                      quantity - 1,
                      1,
                    ),
                  )
                }
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.arrowText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  ▼
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={[
              styles.vecesText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {isSpanish
              ? quantity === 1
                ? ' vez'
                : ' veces'
              : quantity === 1
                ? ' time'
                : ' times'}
          </Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            {
              backgroundColor:
                difficultyStyle.accentColor,
            },
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.confirmText,
              {
                color:
                  difficultyStyle.textColor,
              },
            ]}
          >
            {isSpanish
              ? route.params?.practice
                ? 'Probar'
                : 'Guardar'
              : route.params?.practice
                ? 'Try'
                : 'Save'}
          </Text>
        </TouchableOpacity>
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
    gap: 12,
    paddingBottom: 40,
  },

  backButton: {
    marginBottom: 2,
  },

  headerPill: {
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },

  headerText: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  sectionLabel: {
    fontSize: Typography.sectionTitle.fontSize,
    marginBottom: 6,
    fontWeight: Typography.sectionTitle.fontWeight,
  },

  subLabel: {
    fontSize: 12,
    marginBottom: 8,
  },

  previewBox: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    marginBottom: 20,
    borderWidth: 1,
  },

  previewExpression: {
    fontWeight: '500',
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  previewAnswer: {
    fontWeight: '700',
  },

  sliderWrapper: {
    marginBottom: 8,
  },

  trackBg: {
    height: 4,
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
    fontSize: 13,
  },

  divider: {
    height: 0.5,
    marginVertical: 16,
  },

  operationsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },

  operationBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },

  operationText: {
    fontSize: 24,
    fontWeight: '700',
  },

  operationLabel: {
    fontSize: 9,
    marginTop: 2,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  quantityBox: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
  },

  quantityNum: {
    fontSize: 22,
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
  },

  vecesText: {
    fontSize: 15,
  },

  spacer: {
    flex: 1,
  },

  confirmBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  confirmText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
