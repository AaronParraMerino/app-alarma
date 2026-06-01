import React, {
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { Colors } from '../../../../shared/theme/colors';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';

import {
  DEFAULT_TRIVIA_CONFIG,
  TRIVIA_CATEGORIES,
  TRIVIA_DIFFICULTY_STYLES,
  TRIVIA_POINTS,
  getTriviaQuestions,
} from '../constants/trivia.config';
import { useTriviaStore } from '../store/triviaStore';
import { TriviaQuestionService } from '../services/triviaQuestion.service';
import {
  TriviaCategory,
  TriviaDifficulty,
} from '../types/trivia.types';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ConfigTriviaMission'
>;

const LEVELS: TriviaDifficulty[] = [
  'easy',
  'medium',
  'hard',
];
const MIN_CUSTOM_QUESTIONS = 5;

function toAlarmDifficulty(
  difficulty: TriviaDifficulty,
) {
  return difficulty === 'medium'
    ? 'normal'
    : difficulty;
}

function levelLabel(
  level: TriviaDifficulty,
  isSpanish: boolean,
) {
  if (level === 'easy') {
    return isSpanish ? 'Fácil' : 'Easy';
  }

  if (level === 'medium') {
    return isSpanish ? 'Medio' : 'Medium';
  }

  return isSpanish ? 'Difícil' : 'Hard';
}

export function TriviaConfigScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
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
  } = useTriviaStore();
  const customQuestionCount =
    TriviaQuestionService.getAll().filter(
      (question) =>
        question.category === 'custom',
    ).length;
  const canSelectCustom =
    customQuestionCount >=
    MIN_CUSTOM_QUESTIONS;

  const [
    difficulty,
    setDifficulty,
  ] = useState<TriviaDifficulty>(
    route.params?.difficulty ??
      config.difficulty,
  );
  const [
    categoryIds,
    setCategoryIds,
  ] = useState<TriviaCategory[]>(() => {
    const initialCategoryIds =
      route.params?.categoryIds ??
      config.categoryIds;

    return canSelectCustom
      ? initialCategoryIds
      : initialCategoryIds.filter(
          (categoryId) =>
            categoryId !== 'custom',
        );
  });
  const [
    targetScore,
    setTargetScore,
  ] = useState(
    route.params?.targetScore ??
      config.targetScore ??
      DEFAULT_TRIVIA_CONFIG.targetScore,
  );
  const [
    targetScoreTapCount,
    setTargetScoreTapCount,
  ] = useState(0);
  const [
    targetScoreModalVisible,
    setTargetScoreModalVisible,
  ] = useState(false);
  const [
    customFormVisible,
    setCustomFormVisible,
  ] = useState(false);
  const [
    customPrompt,
    setCustomPrompt,
  ] = useState('');
  const [
    customOptions,
    setCustomOptions,
  ] = useState([
    '',
    '',
    '',
    '',
  ]);
  const [
    customCorrectIndexes,
    setCustomCorrectIndexes,
  ] = useState<number[]>([]);
  const [
    customWrittenAnswers,
    setCustomWrittenAnswers,
  ] = useState('');
  const [
    customFeedback,
    setCustomFeedback,
  ] = useState('');

  const difficultyStyle =
    TRIVIA_DIFFICULTY_STYLES[difficulty];
  const availableQuestionCount =
    getTriviaQuestions(categoryIds).length;
  const canSave =
    categoryIds.length > 0 &&
    availableQuestionCount > 0;
  const completedOptions =
    customOptions
      .map((option, index) => ({
        option: option.trim(),
        index,
      }))
      .filter((item) => item.option.length > 0);
  const validCorrectIndexes =
    customCorrectIndexes.filter((index) =>
      completedOptions.some(
        (item) => item.index === index,
      ),
    );
  const customAnswers =
    customWrittenAnswers
      .split(',')
      .map((answer) => answer.trim())
      .filter(Boolean);
  const canAddQuestion =
    customPrompt.trim().length > 0 &&
    completedOptions.length >= 2 &&
    validCorrectIndexes.length > 0 &&
    customAnswers.length > 0;

  const toggleCategory = (
    category: TriviaCategory,
  ) => {
    if (
      category === 'custom' &&
      !canSelectCustom
    ) {
      return;
    }

    setCategoryIds((current) =>
      current.includes(category)
        ? current.filter(
            (item) => item !== category,
          )
        : [
            ...current,
            category,
          ],
    );
  };

  const changeTargetScore = (delta: number) => {
    setTargetScore((current) =>
      Math.min(
        100,
        Math.max(5, current + delta),
      ),
    );
  };

  const handleTargetScoreTap = () => {
    setTargetScoreTapCount((current) => {
      const nextCount = current + 1;

      if (nextCount >= 5) {
        setTargetScoreModalVisible(true);
        return 0;
      }

      return nextCount;
    });
  };

  const updateCustomOption = (
    index: number,
    value: string,
  ) => {
    setCustomOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? value
          : option,
      ),
    );
  };

  const toggleCorrectOption = (
    index: number,
  ) => {
    setCustomCorrectIndexes((current) =>
      current.includes(index)
        ? current.filter(
            (item) => item !== index,
          )
        : [
            ...current,
            index,
          ],
    );
  };

  const addCustomQuestion = () => {
    if (!canAddQuestion) {
      return;
    }

    const optionMap = new Map<number, number>();
    completedOptions.forEach(
      (item, cleanIndex) => {
        optionMap.set(item.index, cleanIndex);
      },
    );

    TriviaQuestionService.create({
      category: 'custom',
      promptEs: customPrompt.trim(),
      promptEn: customPrompt.trim(),
      optionsEs: completedOptions.map(
        (item) => item.option,
      ),
      optionsEn: completedOptions.map(
        (item) => item.option,
      ),
      correctOptionIndexes:
        validCorrectIndexes.map(
          (index) =>
            optionMap.get(index) ?? 0,
        ),
      acceptedAnswersEs: customAnswers,
      acceptedAnswersEn: customAnswers,
    });

    const nextCustomQuestionCount =
      customQuestionCount + 1;
    const customUnlocked =
      nextCustomQuestionCount >=
      MIN_CUSTOM_QUESTIONS;

    if (customUnlocked) {
      setCategoryIds((current) =>
        current.includes('custom')
          ? current
          : [
              ...current,
              'custom',
            ],
      );
    }
    setCustomPrompt('');
    setCustomOptions([
      '',
      '',
      '',
      '',
    ]);
    setCustomCorrectIndexes([]);
    setCustomWrittenAnswers('');
    setCustomFeedback(
      customUnlocked
        ? isSpanish
          ? 'Pregunta agregada. Personalizada ya esta habilitada.'
          : 'Question added. Custom is now enabled.'
        : isSpanish
          ? `Pregunta agregada. Faltan ${MIN_CUSTOM_QUESTIONS - nextCustomQuestionCount} para habilitar Personalizada.`
          : `Question added. ${MIN_CUSTOM_QUESTIONS - nextCustomQuestionCount} more needed to enable Custom.`,
    );
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    const nextConfig = {
      difficulty,
      categoryIds,
      targetScore,
    };

    setConfig(nextConfig);

    if (route.params?.practice) {
      navigation.navigate('TriviaMissionScreen', {
        ...nextConfig,
        practice: true,
      });
      return;
    }

    completeAlarmMissionConfigSession(
      route.params?.alarmConfigSessionId,
      {
        type: 'trivia',
        difficulty:
          toAlarmDifficulty(difficulty),
        triviaCategoryIds: categoryIds,
        triviaTargetScore: targetScore,
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
          label={isSpanish ? 'Volver' : 'Back'}
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
            name="help-circle-outline"
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
              ? 'MISIÓN\nCULTURA GENERAL'
              : 'MISSION\nGENERAL KNOWLEDGE'}
          </Text>
        </View>

        <View
          style={[
            styles.previewBox,
            {
              borderColor:
                difficultyStyle.accentColor +
                '55',
              backgroundColor:
                difficultyStyle.bgColor,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleTargetScoreTap}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              isSpanish
                ? 'Puntos para completar'
                : 'Points to complete'
            }
          >
            <Text
              style={[
                styles.previewScore,
                {
                  color:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              {targetScore}
            </Text>
          </TouchableOpacity>
          <Text style={styles.previewLabel}>
            {isSpanish
              ? 'puntos para completar'
              : 'points to complete'}
          </Text>
          <Text style={styles.previewNote}>
            {isSpanish
              ? `${TRIVIA_POINTS[difficulty]} puntos por pregunta`
              : `${TRIVIA_POINTS[difficulty]} points per question`}
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
            ? 'Dificultad'
            : 'Difficulty'}
        </Text>

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
                  width: `${
                    (LEVELS.indexOf(
                      difficulty,
                    ) /
                      2) *
                    100
                  }%`,
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
            />

            {LEVELS.map((level, index) => {
              const active =
                difficulty === level;

              return (
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
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.thumb,
                      {
                        borderColor:
                          difficultyStyle.accentColor,
                        backgroundColor: active
                          ? difficultyStyle.accentColor
                          : colors.bgElevated,
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sliderLabels}>
            {LEVELS.map((level) => {
              const active =
                difficulty === level;

              return (
                <TouchableOpacity
                  key={level}
                  style={styles.labelButton}
                  onPress={() =>
                    setDifficulty(level)
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.labelText,
                      {
                        color: active
                          ? difficultyStyle.accentColor
                          : colors.textMuted,
                        fontWeight: active
                          ? '700'
                          : '500',
                      },
                    ]}
                  >
                    {levelLabel(
                      level,
                      isSpanish,
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
            ? 'Bancos de preguntas'
            : 'Question banks'}
        </Text>

        <View style={styles.categoryList}>
          {TRIVIA_CATEGORIES.map(
            (category) => {
              const isLockedCustom =
                category.id === 'custom' &&
                !canSelectCustom;
              const active =
                categoryIds.includes(
                  category.id,
                ) && !isLockedCustom;
              const categoryLabel =
                isSpanish
                  ? category.labelEs
                  : category.labelEn;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.category,
                    {
                      borderColor: active
                        ? difficultyStyle.accentColor
                        : colors.border,
                      backgroundColor: active
                        ? difficultyStyle.bgColor
                        : colors.bgCard,
                    },
                  ]}
                  onPress={() =>
                    toggleCategory(
                      category.id,
                    )
                  }
                  accessibilityState={{
                    checked: active,
                    disabled: isLockedCustom,
                  }}
                  activeOpacity={0.84}
                >
                  <Ionicons
                    name={
                      active
                        ? 'checkbox'
                        : 'square-outline'
                    }
                    size={20}
                    color={
                      active
                        ? difficultyStyle.accentColor
                        : colors.textMuted
                    }
                  />
                  <Ionicons
                    name={category.icon}
                    size={19}
                    color={
                      active
                        ? difficultyStyle.accentColor
                        : isLockedCustom
                          ? colors.textMuted
                          : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: isLockedCustom
                          ? colors.textMuted
                          : colors.text,
                      },
                    ]}
                  >
                    {isLockedCustom
                      ? `${categoryLabel} (${customQuestionCount}/${MIN_CUSTOM_QUESTIONS})`
                      : categoryLabel}
                  </Text>

                  {category.id === 'custom' ? (
                    <TouchableOpacity
                      style={[
                        styles.customToggle,
                        {
                          borderColor:
                            difficultyStyle.accentColor,
                          backgroundColor:
                            customFormVisible
                              ? difficultyStyle.bgColor
                              : colors.bgElevated,
                        },
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        setCustomFormVisible(
                          (visible) => !visible,
                        );
                        setCustomFeedback('');
                      }}
                      activeOpacity={0.84}
                    >
                      <Ionicons
                        name={
                          customFormVisible
                            ? 'remove-outline'
                            : 'add-outline'
                        }
                        size={16}
                        color={
                          difficultyStyle.accentColor
                        }
                      />
                      <Text
                        style={[
                          styles.customToggleText,
                          {
                            color:
                              difficultyStyle.accentColor,
                          },
                        ]}
                      >
                        {isSpanish
                          ? 'Agregar'
                          : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              );
            },
          )}
        </View>

        <Text
          style={[
            styles.bankNote,
            {
              color: canSave
                ? colors.textSecondary
                : colors.danger,
            },
          ]}
        >
          {canSave
            ? isSpanish
              ? `${availableQuestionCount} preguntas disponibles en los bancos seleccionados.`
              : `${availableQuestionCount} questions available in selected banks.`
            : isSpanish
              ? 'Selecciona al menos un banco de preguntas.'
              : 'Select at least one question bank.'}
        </Text>

        <Modal
          visible={targetScoreModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() =>
            setTargetScoreModalVisible(false)
          }
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() =>
              setTargetScoreModalVisible(false)
            }
          >
            <Pressable
              style={[
                styles.pointsModalCard,
                {
                  backgroundColor:
                    colors.bgCard,
                  borderColor: colors.border,
                },
              ]}
              onPress={(event) =>
                event.stopPropagation()
              }
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeading}>
                  <Ionicons
                    name="trophy-outline"
                    size={22}
                    color={
                      difficultyStyle.accentColor
                    }
                  />
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {isSpanish
                      ? 'Configurar puntos'
                      : 'Configure points'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() =>
                    setTargetScoreModalVisible(
                      false,
                    )
                  }
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.targetRow,
                  {
                    borderColor:
                      difficultyStyle.accentColor +
                      '55',
                    backgroundColor:
                      difficultyStyle.bgColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.targetLabel,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {isSpanish
                    ? 'Puntos para completar'
                    : 'Points to complete'}
                </Text>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[
                      styles.stepButton,
                      {
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      changeTargetScore(-5)
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={colors.text}
                    />
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.targetValue,
                      {
                        color:
                          difficultyStyle.accentColor,
                      },
                    ]}
                  >
                    {targetScore}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.stepButton,
                      {
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      changeTargetScore(5)
                    }
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalDoneButton,
                  {
                    backgroundColor:
                      difficultyStyle.accentColor,
                  },
                ]}
                onPress={() =>
                  setTargetScoreModalVisible(false)
                }
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.modalDoneText,
                    {
                      color:
                        difficultyStyle.textColor,
                    },
                  ]}
                >
                  {isSpanish ? 'Listo' : 'Done'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {customFormVisible ? (
          <Modal
            visible={customFormVisible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={() =>
              setCustomFormVisible(false)
            }
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() =>
                setCustomFormVisible(false)
              }
            >
              <Pressable
                style={[
                  styles.questionModalCard,
                  {
                    backgroundColor:
                      colors.bgCard,
                    borderColor:
                      colors.border,
                  },
                ]}
                onPress={(event) =>
                  event.stopPropagation()
                }
              >
                <ScrollView
                  contentContainerStyle={
                    styles.customForm
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                  keyboardShouldPersistTaps="handled"
                >
                  <View
                    style={styles.modalHeader}
                  >
                    <Text
                      style={[
                        styles.customTitle,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {isSpanish
                        ? 'Nueva pregunta'
                        : 'New question'}
                    </Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() =>
                        setCustomFormVisible(
                          false,
                        )
                      }
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={
                          colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <TextInput
              style={[
                styles.customInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.bgElevated,
                },
              ]}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder={
                isSpanish
                  ? 'Escribe la pregunta'
                  : 'Write the question'
              }
              placeholderTextColor={
                colors.textMuted
              }
              multiline
                  />

                  <Text
              style={[
                styles.customFieldLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isSpanish
                ? 'Opciones. Marca las correctas.'
                : 'Options. Select correct ones.'}
                  </Text>

                  {customOptions.map(
              (option, index) => (
                <View
                  key={`option-${index}`}
                  style={styles.customOptionRow}
                >
                  <TouchableOpacity
                    style={styles.correctSelector}
                    onPress={() =>
                      toggleCorrectOption(index)
                    }
                    activeOpacity={0.84}
                  >
                    <Ionicons
                      name={
                        customCorrectIndexes.includes(
                          index,
                        )
                          ? 'checkbox'
                          : 'square-outline'
                      }
                      size={22}
                      color={
                        customCorrectIndexes.includes(
                          index,
                        )
                          ? difficultyStyle.accentColor
                          : colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.customOptionInput,
                      {
                        color: colors.text,
                        borderColor:
                          colors.border,
                        backgroundColor:
                          colors.bgElevated,
                      },
                    ]}
                    value={option}
                    onChangeText={(value) =>
                      updateCustomOption(
                        index,
                        value,
                      )
                    }
                    placeholder={`${isSpanish ? 'Opción' : 'Option'} ${index + 1}`}
                    placeholderTextColor={
                      colors.textMuted
                    }
                  />
                </View>
              ),
                  )}

                  <TextInput
              style={[
                styles.customInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.bgElevated,
                },
              ]}
              value={customWrittenAnswers}
              onChangeText={
                setCustomWrittenAnswers
              }
              placeholder={
                isSpanish
                  ? 'Respuestas escritas válidas, separadas por coma'
                  : 'Valid written answers, separated by commas'
              }
              placeholderTextColor={
                colors.textMuted
              }
                  />

                  {customFeedback ? (
              <Text
                style={[
                  styles.customFeedback,
                  {
                    color:
                      difficultyStyle.accentColor,
                  },
                ]}
              >
                {customFeedback}
              </Text>
                  ) : null}

                  <TouchableOpacity
              style={[
                styles.addQuestionButton,
                {
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
                !canAddQuestion &&
                  styles.disabledButton,
              ]}
              onPress={addCustomQuestion}
              disabled={!canAddQuestion}
              activeOpacity={0.85}
                  >
                    <Text
                style={[
                  styles.addQuestionText,
                  {
                    color:
                      difficultyStyle.textColor,
                  },
                ]}
                    >
                      {isSpanish
                        ? 'Guardar pregunta'
                        : 'Save question'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        ) : null}

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor:
                difficultyStyle.accentColor,
            },
            !canSave &&
              styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.saveText,
              {
                color:
                  difficultyStyle.textColor,
              },
            ]}
          >
            {route.params?.practice
              ? isSpanish
                ? 'Probar'
                : 'Try'
              : isSpanish
                ? 'Guardar'
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
    paddingTop: 24,
    paddingBottom: 32,
    gap: 14,
  },
  headerPill: {
    minHeight: 64,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  previewBox: {
    minHeight: 118,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  previewScore: {
    fontSize: 40,
    fontWeight: '900',
  },
  previewLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  previewNote: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  sectionLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: '800',
    marginTop: 4,
  },
  sliderWrapper: {
    marginBottom: 4,
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
  labelButton: {
    flex: 1,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  modalHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalHeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsModalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  targetRow: {
    minHeight: 66,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  targetLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetValue: {
    minWidth: 34,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalDoneButton: {
    minHeight: 47,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneText: {
    fontSize: 14,
    fontWeight: '900',
  },
  categoryList: {
    gap: 8,
  },
  category: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  bankNote: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  customToggle: {
    minHeight: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  customToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  customForm: {
    padding: 16,
    gap: 10,
  },
  questionModalCard: {
    width: '100%',
    maxWidth: 410,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
  },
  customTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  customFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  customInput: {
    minHeight: 48,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
  },
  customOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  correctSelector: {
    width: 28,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customOptionInput: {
    flex: 1,
    minHeight: 45,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 11,
    fontSize: 14,
    fontWeight: '600',
  },
  customFeedback: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  addQuestionButton: {
    minHeight: 48,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  addQuestionText: {
    fontSize: 14,
    fontWeight: '900',
  },
  saveButton: {
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.45,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '900',
  },
});
