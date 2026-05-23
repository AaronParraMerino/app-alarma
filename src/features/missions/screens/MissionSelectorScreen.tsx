// src/features/missions/screens/MissionSelectorScreen.tsx
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
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

import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { MissionsStackParamList } from '../navigation/MissionsNavigator';

import { useWordCompletionStore } from '../wordCompletion/store/wordCompletionStore';
import { DIFFICULTY_STYLES as WORD_DIFFICULTY_STYLES } from '../wordCompletion/constants/wordCompletion.config';

import { useMathExercisesStore } from '../Math Exercises/store/mathExercisesStore';
import { DIFFICULTY_STYLES as MATH_DIFFICULTY_STYLES } from '../Math Exercises/constants/mathExercises.config';

import { useMovementMissionStore } from '../MovementMission/store/movementMissionStore';
import {
  DIFFICULTY_STYLES as MOVEMENT_DIFFICULTY_STYLES,
} from '../MovementMission/constants/movementConstants';

import { useColoredFiguresStore } from '../ColoredFigures/store/ColoredFiguresStore';
import { DIFFICULTY_STYLES as COLOR_DIFFICULTY_STYLES } from '../ColoredFigures/constants/ColoredFigure.config';

import { useColorFindStore } from '../ColorFind/store/colorFindStore';
import { DIFFICULTY_STYLES as COLOR_FIND_DIFFICULTY_STYLES } from '../ColorFind/constants/colorFind.config';

import { ObjectBankService } from '../ObjectRecognition/services/objectBank.service';
import { useObjectRecognitionStore } from '../ObjectRecognition/store/objectRecognitionStore';
import { RecognizableObject } from '../ObjectRecognition/types/objectRecognition.types';

import { usePairsMissionStore } from '../ParesMission/store/paresMissionStore';
import { DIFFICULTY_STYLES as PAIRS_DIFFICULTY_STYLES } from '../ParesMission/constants/paresMission.config';

type Difficulty = 'easy' | 'medium' | 'hard';

type NavigationProp = NativeStackNavigationProp<
  MissionsStackParamList,
  'MissionSelector'
>;

const OBJECT_DIFFICULTY_LABELS_ES: Record<Difficulty, string> = {
  easy: 'FÁCIL',
  medium: 'MEDIO',
  hard: 'DIFÍCIL',
};

const OBJECT_DIFFICULTY_LABELS_EN: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const OBJECT_DIFFICULTY_QUANTITY: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const OBJECT_DIFFICULTY_STYLES: Record<
  Difficulty,
  {
    accentColor: string;
    bgColor: string;
  }
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

function translateDifficultyLabel(
  label: string,
  isSpanish: boolean,
): string {
  const normalized = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('facil') || normalized.includes('easy')) {
    return isSpanish ? 'FÁCIL' : 'EASY';
  }

  if (
    normalized.includes('medio') ||
    normalized.includes('normal') ||
    normalized.includes('medium')
  ) {
    return isSpanish ? 'MEDIO' : 'MEDIUM';
  }

  if (normalized.includes('dificil') || normalized.includes('hard')) {
    return isSpanish ? 'DIFÍCIL' : 'HARD';
  }

  return label;
}

function formatQuantity(
  quantity: number,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return `${quantity} vez${quantity === 1 ? '' : 'es'}`;
  }

  return `${quantity} time${quantity === 1 ? '' : 's'}`;
}

function getObjectDifficultyLabel(
  difficulty: Difficulty,
  isSpanish: boolean,
): string {
  return isSpanish
    ? OBJECT_DIFFICULTY_LABELS_ES[difficulty]
    : OBJECT_DIFFICULTY_LABELS_EN[difficulty];
}

function MissionCard({
  title,
  configureLabel,
  executeLabel,
  summary,
  colors,
  buttonColor,
  buttonTextColor,
  executeBgColor,
  executeBorderColor,
  executeTextColor,
  onConfigure,
  onExecute,
  disabled = false,
}: {
  title: string;
  configureLabel: string;
  executeLabel: string;
  summary: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
  buttonColor: string;
  buttonTextColor: string;
  executeBgColor: string;
  executeBorderColor: string;
  executeTextColor: string;
  onConfigure: () => void;
  onExecute: () => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.cardTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <TouchableOpacity
        style={[
          styles.btn,
          {
            backgroundColor: buttonColor,
          },
        ]}
        onPress={onConfigure}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.btnText,
            {
              color: buttonTextColor,
            },
          ]}
        >
          {configureLabel}
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.summary,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {summary}
      </Text>

      <TouchableOpacity
        style={[
          styles.executeBtn,
          {
            backgroundColor: executeBgColor,
            borderColor: executeBorderColor,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
        onPress={onExecute}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.executeBtnText,
            {
              color: executeTextColor,
            },
          ]}
        >
          {executeLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MissionSelectorScreen() {
  const navigation = useNavigation<NavigationProp>();

  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';

  const {
    config: pairsConfig,
  } = usePairsMissionStore();

  const pairsStyle =
    PAIRS_DIFFICULTY_STYLES[pairsConfig.difficulty];

  const {
    config: wordConfig,
  } = useWordCompletionStore();

  const wordStyle =
    WORD_DIFFICULTY_STYLES[wordConfig.difficulty];

  const {
    config: mathConfig,
  } = useMathExercisesStore();

  const mathStyle =
    MATH_DIFFICULTY_STYLES[mathConfig.difficulty];

  const {
    userConfig: movementConfig,
  } = useMovementMissionStore();

  const movementStyle =
    MOVEMENT_DIFFICULTY_STYLES[
      movementConfig.difficulty
    ];

  const {
    config: colorConfig,
  } = useColoredFiguresStore();

  const colorStyle =
    COLOR_DIFFICULTY_STYLES[colorConfig.difficulty];

  const colorLevelLabel =
    colorConfig.difficulty === 'easy'
      ? isSpanish
        ? 'NORMAL'
        : 'NORMAL'
      : translateDifficultyLabel(
          colorStyle.label,
          isSpanish,
        );

  const {
    config: objectConfig,
  } = useObjectRecognitionStore();

  const [objectBank, setObjectBank] =
    useState<RecognizableObject[]>([]);

  useEffect(() => {
    setObjectBank(ObjectBankService.getEnabled());
  }, []);

  const selectedObjects = useMemo(
    () =>
      objectBank.filter((object) =>
        objectConfig.targetObjectIds.includes(object.id),
      ),
    [
      objectBank,
      objectConfig.targetObjectIds,
    ],
  );

  const objectPoolCount =
    selectedObjects.length || objectBank.length;

  const objectStyle =
    OBJECT_DIFFICULTY_STYLES[
      objectConfig.difficulty
    ];

  const wordSummary = `${translateDifficultyLabel(
    wordStyle.label,
    isSpanish,
  )} · ${formatQuantity(
    wordConfig.quantity,
    isSpanish,
  )}`;

  const mathSummary = `${translateDifficultyLabel(
    mathStyle.label,
    isSpanish,
  )} · ${formatQuantity(
    mathConfig.quantity,
    isSpanish,
  )}`;

  const movementSummary = `${translateDifficultyLabel(
    movementStyle.label,
    isSpanish,
  )} · ${formatQuantity(
    movementConfig.quantity,
    isSpanish,
  )}`;

  const colorSummary = `${colorLevelLabel} · ${formatQuantity(
    colorConfig.quantity,
    isSpanish,
  )}`;

  const {
    config: colorFindConfig,
  } = useColorFindStore();

  const colorFindStyle =
    COLOR_FIND_DIFFICULTY_STYLES[
      colorFindConfig.difficulty
    ];

  const colorFindSummary = `${translateDifficultyLabel(
    colorFindStyle.label,
    isSpanish,
  )} · ${formatQuantity(
    colorFindConfig.quantity,
    isSpanish,
  )}`;

  const pairsSummary = `${translateDifficultyLabel(
    pairsStyle.label,
    isSpanish,
  )} · ${formatQuantity(
    pairsConfig.quantity,
    isSpanish,
  )}`;

  const objectSummary = isSpanish
    ? `${getObjectDifficultyLabel(
        objectConfig.difficulty,
        true,
      )} - ${
        OBJECT_DIFFICULTY_QUANTITY[
          objectConfig.difficulty
        ]
      } de ${objectPoolCount} al azar`
    : `${getObjectDifficultyLabel(
        objectConfig.difficulty,
        false,
      )} - ${
        OBJECT_DIFFICULTY_QUANTITY[
          objectConfig.difficulty
        ]
      } of ${objectPoolCount} random`;

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
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish
            ? 'Selecciona una misión'
            : 'Select a mission'}
        </Text>

        <MissionCard
          title={
            isSpanish
              ? 'Misión de palabras'
              : 'Word mission'
          }
          configureLabel={
            isSpanish
              ? 'Configurar misión de palabras'
              : 'Configure word mission'
          }
          executeLabel={
            isSpanish
              ? 'Ejecutar misión de palabras'
              : 'Run word mission'
          }
          summary={wordSummary}
          colors={colors}
          buttonColor={colors.primary}
          buttonTextColor={colors.white}
          executeBgColor={wordStyle.bgColor}
          executeBorderColor={wordStyle.accentColor + '50'}
          executeTextColor={wordStyle.accentColor}
          onConfigure={() =>
            navigation.navigate(
              'ConfigWordCompletionMission',
              {},
            )
          }
          onExecute={() =>
            navigation.navigate(
              'WordCompletionMissionScreen',
              {
                difficulty: wordConfig.difficulty,
                quantity: wordConfig.quantity,
              },
            )
          }
        />

        <MissionCard
          title={
            isSpanish
              ? 'Misión de matemáticas'
              : 'Math mission'
          }
          configureLabel={
            isSpanish
              ? 'Configurar misión de matemáticas'
              : 'Configure math mission'
          }
          executeLabel={
            isSpanish
              ? 'Ejecutar misión de matemáticas'
              : 'Run math mission'
          }
          summary={mathSummary}
          colors={colors}
          buttonColor={colors.primary}
          buttonTextColor={colors.white}
          executeBgColor={mathStyle.bgColor}
          executeBorderColor={mathStyle.accentColor + '50'}
          executeTextColor={mathStyle.accentColor}
          onConfigure={() =>
            navigation.navigate(
              'ConfigMathMission',
              {},
            )
          }
          onExecute={() =>
            navigation.navigate(
              'MathMissionScreen',
              {
                difficulty: mathConfig.difficulty,
                quantity: mathConfig.quantity,
                operationType: mathConfig.operationType,
              },
            )
          }
        />

        <MissionCard
          title={
            isSpanish
              ? 'Misión de movimientos'
              : 'Movement mission'
          }
          configureLabel={
            isSpanish
              ? 'Configurar misión de movimientos'
              : 'Configure movement mission'
          }
          executeLabel={
            isSpanish
              ? 'Ejecutar misión de movimientos'
              : 'Run movement mission'
          }
          summary={movementSummary}
          colors={colors}
          buttonColor={colors.primary}
          buttonTextColor={colors.white}
          executeBgColor={movementStyle.bgColor}
          executeBorderColor={movementStyle.accentColor + '50'}
          executeTextColor={movementStyle.accentColor}
          onConfigure={() =>
            navigation.navigate('ConfigMovementMission')
          }
          onExecute={() =>
            navigation.navigate(
              'MovementMissionScreen',
              {
                difficulty: movementConfig.difficulty,
                quantity: movementConfig.quantity,
              },
            )
          }
        />

        <MissionCard
          title={
            isSpanish
              ? 'Misión de colores'
              : 'Color mission'
          }
          configureLabel={
            isSpanish
              ? 'Configurar misión de colores'
              : 'Configure color mission'
          }
          executeLabel={
            isSpanish
              ? 'Ejecutar misión de colores'
              : 'Run color mission'
          }
          summary={colorSummary}
          colors={colors}
          buttonColor={colors.primary}
          buttonTextColor={colors.white}
          executeBgColor={colorStyle.bgColor}
          executeBorderColor={colorStyle.accentColor + '50'}
          executeTextColor={colorStyle.accentColor}
          onConfigure={() =>
            navigation.navigate(
              'ConfigColoredFiguresMission',
              {},
            )
          }
          onExecute={() =>
            navigation.navigate(
              'ColoredFiguresMissionScreen',
              {
                difficulty: colorConfig.difficulty,
                quantity: colorConfig.quantity,
              },
            )
          }
        />

        <MissionCard
          title={
            isSpanish
              ? 'Mision de color diferente'
              : 'Different color mission'
          }
          configureLabel={
            isSpanish
              ? 'Configurar color diferente'
              : 'Configure different color'
          }
          executeLabel={
            isSpanish
              ? 'Ejecutar color diferente'
              : 'Run different color'
          }
          summary={colorFindSummary}
          colors={colors}
          buttonColor={colors.primary}
          buttonTextColor={colors.white}
          executeBgColor={colorFindStyle.bgColor}
          executeBorderColor={colorFindStyle.accentColor + '50'}
          executeTextColor={colorFindStyle.accentColor}
          onConfigure={() =>
            navigation.navigate(
              'ConfigColorFindMission',
              {},
            )
          }
          onExecute={() =>
            navigation.navigate(
              'ColorFindMissionScreen',
              {
                difficulty: colorFindConfig.difficulty,
                quantity: colorFindConfig.quantity,
              },
            )
          }
        />

        <MissionCard
          title={
            isSpanish
              ? 'Misión de objetos'
              : 'Object mission'
          }
          configureLabel={
            isSpanish
              ? 'Configurar objeto'
              : 'Configure object'
          }
          executeLabel={
            isSpanish
              ? 'Ejecutar misión de objetos'
              : 'Run object mission'
          }
          summary={objectSummary}
          colors={colors}
          buttonColor={colors.primary}
          buttonTextColor={colors.white}
          executeBgColor={objectStyle.bgColor}
          executeBorderColor={objectStyle.accentColor + '50'}
          executeTextColor={objectStyle.accentColor}
          disabled={objectPoolCount === 0}
          onConfigure={() =>
            navigation.navigate(
              'ConfigObjectRecognitionMission',
            )
          }
          onExecute={() =>
            navigation.navigate(
              'ObjectRecognitionMissionScreen',
              {
                difficulty: objectConfig.difficulty,
                targetObjectIds:
                  selectedObjects.length > 0
                    ? selectedObjects.map(
                        (object) => object.id,
                      )
                    : objectBank.map(
                        (object) => object.id,
                      ),
              },
            )
          }
        />

        <MissionCard
          title={
            isSpanish
              ? 'Misión de pares'
              : 'Pairs mission'
          }
          configureLabel={
            isSpanish
              ? 'Configurar encontrar pares'
              : 'Configure find pairs'
          }
          executeLabel={
            isSpanish
              ? 'Ejecutar encontrar pares'
              : 'Run find pairs'
          }
          summary={pairsSummary}
          colors={colors}
          buttonColor={colors.primary}
          buttonTextColor={colors.white}
          executeBgColor={pairsStyle.bgColor}
          executeBorderColor={pairsStyle.accentColor + '50'}
          executeTextColor={pairsStyle.accentColor}
          onConfigure={() =>
            navigation.navigate(
              'ConfigParesMission',
              {},
            )
          }
          onExecute={() =>
            navigation.navigate(
              'ParesMissionScreen',
              {
                difficulty: pairsConfig.difficulty,
                quantity: pairsConfig.quantity,
              },
            )
          }
        />
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
