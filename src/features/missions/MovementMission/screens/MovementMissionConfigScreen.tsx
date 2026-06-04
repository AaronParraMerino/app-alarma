// src/features/missions/MovementMission/components/MovementMissionConfigScreen.tsx
import React, {
  useState,
} from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { Colors } from '../../../../shared/theme/colors';

import {
  MovementDifficulty,
  MovementMissionUserConfig,
} from '../types/movement.types';
import {
  ALL_MOVEMENT_STEPS,
  DIFFICULTY_STYLES,
  MAX_QUANTITY,
  MIN_QUANTITY,
  MOVEMENT_EXAMPLES,
} from '../constants/movementConstants';
import { MOVEMENT_IMAGES } from '../constants/movementAssets';

interface MovementMissionConfigScreenProps {
  onConfirm: (
    config: MovementMissionUserConfig,
  ) => void;
  onBack?: () => void;
  initialDifficulty?: MovementDifficulty;
  initialQuantity?: number;
  confirmLabel?: string;
}

const LEVELS: MovementDifficulty[] = [
  'easy',
  'medium',
  'hard',
];

function getDifficultyLabel(
  difficulty: MovementDifficulty,
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

function getDifficultyTitle(
  difficulty: MovementDifficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish
      ? 'FÁCIL'
      : 'EASY';
  }

  if (difficulty === 'medium') {
    return isSpanish
      ? 'MEDIO'
      : 'MEDIUM';
  }

  return isSpanish
    ? 'DIFÍCIL'
    : 'HARD';
}

function translateMovementLabel(
  label: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return label;
  }

  const normalized = label
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    );

  if (
    normalized.includes('agitar') ||
    normalized.includes('sacudir')
  ) {
    return 'Shake the phone';
  }

  if (
    normalized.includes('arriba') ||
    normalized.includes('levantar')
  ) {
    return 'Move up';
  }

  if (
    normalized.includes('abajo') ||
    normalized.includes('bajar')
  ) {
    return 'Move down';
  }

  if (
    normalized.includes('izquierda')
  ) {
    return 'Move left';
  }

  if (
    normalized.includes('derecha')
  ) {
    return 'Move right';
  }

  if (
    normalized.includes('girar') ||
    normalized.includes('rotar')
  ) {
    return 'Rotate the phone';
  }

  if (
    normalized.includes('inclinar')
  ) {
    return 'Tilt the phone';
  }

  if (
    normalized.includes('caminar') ||
    normalized.includes('pasos')
  ) {
    return 'Walk';
  }

  if (
    normalized.includes('saltar') ||
    normalized.includes('salto')
  ) {
    return 'Jump';
  }

  return label;
}

export function MovementMissionConfigScreen({
  onConfirm,
  onBack,
  initialDifficulty = 'easy',
  initialQuantity = 3,
  confirmLabel,
}: MovementMissionConfigScreenProps) {
  const {
    width,
    height,
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

  const [
    difficulty,
    setDifficulty,
  ] = useState<MovementDifficulty>(
    initialDifficulty,
  );

  const [
    quantity,
    setQuantity,
  ] = useState(
    Math.max(
      MIN_QUANTITY,
      Math.min(
        MAX_QUANTITY,
        initialQuantity,
      ),
    ),
  );

  const difficultyStyle =
    DIFFICULTY_STYLES[difficulty];
  const previewBgColor =
    isDark ? colors.white : Colors.bgCard;
  const previewTextColor =
    isDark ? colors.black : colors.white;

  const sliderIdx =
    LEVELS.indexOf(difficulty);

  const examples =
    MOVEMENT_EXAMPLES[difficulty].map(
      (type) => ALL_MOVEMENT_STEPS[type],
    );

  const isSmall =
    width < 360;

  const isShort =
    height < 680;

  const fontBase =
    isSmall ? 12 : 14;

  const pillPadV =
    isShort ? 7 : 10;

  const sectionGap =
    isShort ? 10 : 16;

  const previewMin =
    isShort ? 90 : 110;

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
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal:
              isSmall ? 14 : 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {onBack ? (
          <BackButton
            label={
              isSpanish
                ? 'Volver'
                : 'Back'
            }
            style={styles.backButton}
            onPress={onBack}
          />
        ) : null}

        <View
          style={[
            styles.headerPill,
            {
              backgroundColor:
                difficultyStyle.accentColor,
              paddingVertical: pillPadV,
              marginBottom: sectionGap,
            },
          ]}
        >
          <Ionicons
            name="footsteps-outline"
            size={24}
            color={difficultyStyle.textColor}
          />

          <Text
            style={[
              styles.headerText,
              {
                color: difficultyStyle.textColor,
                fontSize:
                  isSmall ? 12 : 14,
              },
            ]}
          >
            {isSpanish
              ? 'MISIÓN\nDE MOVIMIENTO'
              : 'MISSION\nMOVEMENT'}
          </Text>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.text,
              fontSize: fontBase,
              marginBottom: 6,
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
              fontSize:
                isSmall ? 11 : 12,
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
              borderColor:
                difficultyStyle.accentColor +
                '40',
              minHeight: previewMin,
              marginBottom: sectionGap,
            },
          ]}
        >
          <Text
            style={[
              styles.previewTitle,
              {
                color:
                  difficultyStyle.accentColor,
              },
            ]}
          >
            {getDifficultyTitle(
              difficulty,
              isSpanish,
            )}
          </Text>

          <View style={styles.exampleRow}>
            {examples.map(
              (
                step,
                index,
              ) => (
                <View
                  key={`${step.type}-${index}`}
                  style={styles.exampleItem}
                >
                  <Image
                    source={
                      MOVEMENT_IMAGES[step.type]
                    }
                    style={styles.exampleImage}
                    resizeMode="contain"
                  />

                  <Text
                    numberOfLines={2}
                    style={[
                      styles.exampleLabel,
                      {
                        color:
                          previewTextColor,
                      },
                    ]}
                  >
                    {translateMovementLabel(
                      step.label,
                      isSpanish,
                    )}
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>

        <View
          style={[
            styles.sliderWrapper,
            {
              marginBottom:
                isShort ? 4 : 8,
            },
          ]}
        >
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
                          sliderIdx >= index
                            ? difficultyStyle.accentColor
                            : colors.bgElevated,
                        borderColor:
                          sliderIdx >= index
                            ? difficultyStyle.accentColor
                            : colors.textMuted,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ),
            )}
          </View>

          <View style={styles.sliderLabels}>
            {LEVELS.map((level) => {
              const active =
                difficulty === level;

              return (
                <TouchableOpacity
                  key={level}
                  onPress={() =>
                    setDifficulty(level)
                  }
                  style={styles.labelBtn}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.labelText,
                      {
                        color: active
                          ? difficultyStyle.accentColor
                          : colors.textMuted,
                        fontSize:
                          isSmall ? 11 : 13,
                        fontWeight: active
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
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.border,
              marginVertical: sectionGap,
            },
          ]}
        />

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.text,
              fontSize: fontBase,
              marginBottom: 6,
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
                paddingVertical:
                  isShort ? 8 : 10,
              },
            ]}
          >
            <Text
              style={[
                styles.quantityNum,
                {
                  color: colors.text,
                  fontSize:
                    isSmall ? 18 : 22,
                },
              ]}
            >
              {quantity}
            </Text>

            <View style={styles.arrows}>
              <TouchableOpacity
                onPress={() =>
                  setQuantity((current) =>
                    Math.min(
                      MAX_QUANTITY,
                      current + 1,
                    ),
                  )
                }
                style={styles.arrowBtn}
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
                onPress={() =>
                  setQuantity((current) =>
                    Math.max(
                      MIN_QUANTITY,
                      current - 1,
                    ),
                  )
                }
                style={styles.arrowBtn}
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
                fontSize:
                  isSmall ? 13 : 15,
              },
            ]}
          >
            {isSpanish
              ? 'veces'
              : 'times'}
          </Text>
        </View>

        <View
          style={{
            height:
              isShort ? 16 : 32,
          }}
        />

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            {
              backgroundColor:
                difficultyStyle.accentColor,
              height:
                isShort ? 46 : 52,
            },
          ]}
          onPress={() =>
            onConfirm({
              difficulty,
              quantity,
            })
          }
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.confirmText,
              {
                color:
                  difficultyStyle.textColor,
                fontSize:
                  isSmall ? 14 : 16,
              },
            ]}
          >
            {isSpanish
              ? confirmLabel ?? 'Confirmar'
              : confirmLabel ?? 'Confirm'}
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
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },

  backButton: {
    marginBottom: 14,
  },

  headerPill: {
    borderRadius: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  headerText: {
    fontWeight:
      Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  sectionLabel: {
    fontWeight:
      Typography.sectionTitle.fontWeight,
  },

  subLabel: {
    marginBottom: 8,
  },

  previewBox: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },

  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  exampleRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },

  exampleItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },

  exampleImage: {
    width: 90,
    height: 90,
  },

  exampleLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '600',
  },

  sliderWrapper: {},

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

  labelText: {},

  divider: {
    height: 0.5,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  quantityBox: {
    borderRadius: Layout.controlRadius,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
  },

  quantityNum: {
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

  vecesText: {},

  confirmBtn: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmText: {
    fontWeight: '500',
  },
});
