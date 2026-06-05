// src/features/missions/ColoredFigures/screens/ColoredMissionConfigScreen.tsx
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

import { useColoredFiguresStore } from '../store/ColoredFiguresStore';
import {
  DIFFICULTY_STYLES,
  COLORS_BY_DIFFICULTY,
  PREVIEW_BY_DIFFICULTY,
} from '../constants/ColoredFigure.config';
import {
  Difficulty,
  ColoredFigureChallenge,
} from '../types/ColoredFigures.types';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ConfigColoredFiguresMission'
>;

const LEVELS: Difficulty[] = [
  'easy',
  'medium',
  'hard',
];

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

function translateColorName(
  colorName: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return colorName;
  }

  const normalized = colorName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const colorsMap: Record<string, string> = {
    rojo: 'Red',
    azul: 'Blue',
    verde: 'Green',
    amarillo: 'Yellow',
    naranja: 'Orange',
    morado: 'Purple',
    violeta: 'Violet',
    rosado: 'Pink',
    rosa: 'Pink',
    blanco: 'White',
    negro: 'Black',
    gris: 'Gray',
    cafe: 'Brown',
    marron: 'Brown',
    celeste: 'Light blue',
  };

  return colorsMap[normalized] ?? colorName;
}

function PreviewFigure({
  figure,
  color,
  size,
}: {
  figure: string;
  color: string;
  size: number;
}) {
  if (figure === 'circle') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    );
  }

  if (figure === 'square') {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: 6,
        }}
      />
    );
  }

  if (figure === 'rectangle') {
    return (
      <View
        style={{
          width: size * 1.6,
          height: size * 0.9,
          backgroundColor: color,
          borderRadius: 6,
        }}
      />
    );
  }

  if (figure === 'diamond') {
    return (
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          backgroundColor: color,
          transform: [
            {
              rotate: '45deg',
            },
          ],
          borderRadius: 4,
        }}
      />
    );
  }

  if (figure === 'triangle') {
    return (
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.6,
          borderRightWidth: size * 0.6,
          borderBottomWidth: size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
    );
  }

  return null;
}

export function ColoredMissionConfigScreen({
  navigation,
  route,
}: Props) {
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
  } = useColoredFiguresStore();

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
    preview,
    setPreview,
  ] = useState<ColoredFigureChallenge>(
    PREVIEW_BY_DIFFICULTY[
      route.params?.difficulty ??
        config.difficulty
    ],
  );

  const [
    colorsOfLevel,
    setColorsOfLevel,
  ] = useState(
    COLORS_BY_DIFFICULTY[
      route.params?.difficulty ??
        config.difficulty
    ],
  );

  useEffect(() => {
    setPreview(
      PREVIEW_BY_DIFFICULTY[difficulty],
    );

    setColorsOfLevel(
      COLORS_BY_DIFFICULTY[difficulty],
    );
  }, [
    difficulty,
  ]);

  const difficultyStyle =
    DIFFICULTY_STYLES[difficulty];
  const previewBgColor =
    isDark ? colors.white : Colors.bgCard;

  const sliderIdx =
    LEVELS.indexOf(difficulty);

  const handleSave = () => {
    setConfig({
      difficulty,
      quantity,
    });

    if (route.params?.practice) {
      navigation.navigate('ColoredFiguresMissionScreen', {
        difficulty,
        quantity,
        practice: true,
      });
      return;
    }

    const savedInAlarmConfig =
      completeAlarmMissionConfigSession(
        route.params?.alarmConfigSessionId,
        {
          type: 'color',
          difficulty: toAlarmDifficulty(difficulty),
          quantity,
        },
      );

    if (savedInAlarmConfig) {
      navigation.goBack();

      return;
    }

    navigation.navigate('MissionSelector');
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
            name="color-palette-outline"
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
              ? 'MISIÓN\nFIGURAS Y COLORES'
              : 'MISSION\nSHAPES AND COLORS'}
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
            ? 'Ejemplo — ¿De qué color es esta figura?'
            : 'Example — What color is this shape?'}
        </Text>

        <View
          style={[
            styles.previewBox,
            {
              backgroundColor:
                previewBgColor,
              borderColor:
                difficultyStyle.accentColor + '40',
            },
          ]}
        >
          <PreviewFigure
            figure={preview.figure}
            color={preview.hex}
            size={80}
          />

          <Text
            style={[
              styles.previewAnswer,
              {
                color:
                  difficultyStyle.accentColor,
              },
            ]}
          >
            {isSpanish
              ? `Respuesta: ${translateColorName(
                  preview.colorDisplayName,
                  true,
                )}`
              : `Answer: ${translateColorName(
                  preview.colorDisplayName,
                  false,
                )}`}
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
            ? 'Colores de este nivel'
            : 'Colors in this level'}
        </Text>

        <View style={styles.colorsGrid}>
          {colorsOfLevel.map((item) => {
            const needsBorder =
              item.hex === '#EFEFEF' ||
              item.hex === '#FFFF00' ||
              item.hex.toLowerCase() === '#ffffff';

            return (
              <View
                key={item.hex}
                style={styles.colorItem}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: item.hex,
                      borderColor: needsBorder
                        ? colors.border
                        : 'transparent',
                    },
                    needsBorder &&
                      styles.swatchBorder,
                  ]}
                />

                <Text
                  style={[
                    styles.colorLabel,
                    {
                      color:
                        difficultyStyle.accentColor,
                    },
                  ]}
                >
                  {translateColorName(
                    item.colorDisplayName,
                    isSpanish,
                  )}
                </Text>
              </View>
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
            {isSpanish ? ' veces' : ' times'}
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
                : 'Confirmar'
              : route.params?.practice
                ? 'Try'
                : 'Confirm'}
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
    fontWeight: Typography.sectionTitle.fontWeight,
    marginBottom: 6,
  },

  subLabel: {
    fontSize: 12,
    marginBottom: 8,
  },

  previewBox: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 0.5,
    gap: 16,
    minHeight: 160,
  },

  previewAnswer: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
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

  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },

  colorItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
  },

  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  swatchBorder: {
    borderWidth: 1,
  },

  colorLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  quantityBox: {
    borderRadius: Layout.controlRadius,
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
