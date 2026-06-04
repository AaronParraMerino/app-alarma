// src/features/missions/wordCompletion/screens/WordCompletionConfigScreen.tsx
import React, {
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { Colors } from '../../../../shared/theme/colors';

import { Difficulty } from '../types/wordCompletion.types';
import {
  DIFFICULTY_STYLES,
  EXAMPLE_PREVIEWS,
  MIN_QUANTITY,
  MAX_QUANTITY,
} from '../constants/wordCompletion.config';
import { WordDisplay } from '../components/WordDisplay';
import { useWordCompletionStore } from '../store/wordCompletionStore';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ConfigWordCompletionMission'
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

//Pantalla de configuración para elegir dificultad y cantidad de veces
export function WordCompletionConfigScreen({
  navigation,
  route,
}: Props) {
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

  const {
    config,
    setConfig,
  } = useWordCompletionStore();

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

  const difficultyStyle =
    DIFFICULTY_STYLES[difficulty];

  const sliderIdx =
    LEVELS.indexOf(difficulty);

  const previews =
    EXAMPLE_PREVIEWS[language][difficulty];
  const previewBgColor =
    isDark ? colors.white : Colors.bgCard;
  const previewTextColor =
    isDark ? colors.black : colors.white;

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
    previews.length > 1
      ? isShort
        ? 90
        : 110
      : isShort
        ? 60
        : 72;

  const handleSave = () => {
    setConfig({
      difficulty,
      quantity,
    });

    if (route.params?.practice) {
      navigation.navigate('WordCompletionMissionScreen', {
        difficulty,
        quantity,
        practice: true,
      });
      return;
    }

    completeAlarmMissionConfigSession(
      route.params?.alarmConfigSessionId,
      {
        type: 'wordCompletion',
        difficulty: toAlarmDifficulty(difficulty),
        quantity,
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
              paddingVertical: pillPadV,
              marginBottom: sectionGap,
            },
          ]}
        >
          <Ionicons
            name="text-outline"
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
              ? 'MISIÓN\nCOMPLETAR PALABRAS'
              : 'MISSION\nCOMPLETE WORDS'}
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
              borderColor: colors.border,
              minHeight: previewMin,
              marginBottom: sectionGap,
            },
          ]}
        >
          {previews.map(
            (
              challenge,
              index,
            ) => (
              <View
                key={index}
                style={
                  index > 0
                    ? styles.previewSpacing
                    : undefined
                }
              >
                <WordDisplay
                  challenge={challenge}
                  accentColor={
                    difficultyStyle.accentColor
                  }
                  accentBg={
                    difficultyStyle.bgColor
                  }
                  letterSize={
                    isSmall
                      ? 18
                      : width < 400
                        ? 20
                        : 24
                  }
                  textColor={previewTextColor}
                />
              </View>
            ),
          )}
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
                borderColor: colors.border,
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
          onPress={handleSave}
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
    borderWidth: 1,
  },

  previewSpacing: {
    marginTop: 10,
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
