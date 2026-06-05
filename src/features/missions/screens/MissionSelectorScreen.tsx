import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { Colors } from '../../../shared/theme/colors';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { MissionsStackParamList } from '../navigation/MissionsNavigator';
import { useWordCompletionStore } from '../wordCompletion/store/wordCompletionStore';
import { useMathExercisesStore } from '../Math Exercises/store/mathExercisesStore';
import { useMovementMissionStore } from '../MovementMission/store/movementMissionStore';
import { useColoredFiguresStore } from '../ColoredFigures/store/ColoredFiguresStore';
import { useColorFindStore } from '../ColorFind/store/colorFindStore';
import { usePairsMissionStore } from '../ParesMission/store/paresMissionStore';
import { ObjectBankService } from '../ObjectRecognition/services/objectBank.service';
import { useObjectRecognitionStore } from '../ObjectRecognition/store/objectRecognitionStore';
import { RecognizableObject } from '../ObjectRecognition/types/objectRecognition.types';
import { useTriviaStore } from '../Trivia/store/triviaStore';

type Difficulty = 'easy' | 'medium' | 'hard';
type NavigationProp = NativeStackNavigationProp<MissionsStackParamList, 'MissionSelector'>;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const OBJECT_DIFFICULTY_QUANTITY: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function difficultyLabel(difficulty: Difficulty, isSpanish: boolean) {
  if (difficulty === 'easy') return isSpanish ? 'FACIL' : 'EASY';
  if (difficulty === 'medium') return isSpanish ? 'MEDIO' : 'MEDIUM';
  return isSpanish ? 'DIFICIL' : 'HARD';
}

function formatQuantity(quantity: number, isSpanish: boolean) {
  return isSpanish
    ? `${quantity} veces`
    : `${quantity} times`;
}

function MissionPracticeCard({
  title,
  summary,
  icon,
  tint,
  onPress,
  disabled,
}: {
  title: string;
  summary: string;
  icon: IconName;
  tint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: disabled ? colors.borderMuted : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.84}
      disabled={disabled}
    >
      <View style={[styles.iconWrap, { backgroundColor: tint + '1A' }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>

      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.summary, { color: colors.textSecondary }]}>
          {summary}
        </Text>
      </View>

      <Text style={[styles.actionText, { color: tint }]}>
        {isSpanish ? 'Practicar' : 'Practice'}
      </Text>
    </TouchableOpacity>
  );
}

export default function MissionSelectorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, statusBarStyle } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';

  const { config: wordConfig } = useWordCompletionStore();
  const { config: mathConfig } = useMathExercisesStore();
  const { userConfig: movementConfig } = useMovementMissionStore();
  const { config: colorConfig } = useColoredFiguresStore();
  const { config: colorFindConfig } = useColorFindStore();
  const { config: pairsConfig } = usePairsMissionStore();
  const { config: objectConfig } = useObjectRecognitionStore();
  const { config: triviaConfig } = useTriviaStore();

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

  const missionColors = Colors.missionColors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isSpanish ? 'Practica misiones' : 'Practice missions'}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isSpanish
            ? 'Prueba cada mision antes de usarla en una alarma. Configura, practica y vuelve cuando quieras para aprender como funciona sin quedar bloqueado.'
            : 'Try each mission before using it in an alarm. Configure, practice, and go back whenever you want so you can learn without getting locked in.'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MissionPracticeCard
          title={isSpanish ? 'Completar palabras' : 'Complete words'}
          summary={`${difficultyLabel(wordConfig.difficulty, isSpanish)} - ${formatQuantity(wordConfig.quantity, isSpanish)}`}
          icon="text-outline"
          tint={missionColors.wordCompletion}
          onPress={() => navigation.navigate('ConfigWordCompletionMission', { practice: true })}
        />

        <MissionPracticeCard
          title={isSpanish ? 'Matematicas' : 'Math'}
          summary={`${difficultyLabel(mathConfig.difficulty, isSpanish)} - ${formatQuantity(mathConfig.quantity, isSpanish)}`}
          icon="calculator-outline"
          tint={missionColors.math}
          onPress={() => navigation.navigate('ConfigMathMission', { practice: true })}
        />

        <MissionPracticeCard
          title={isSpanish ? 'Movimiento' : 'Movement'}
          summary={`${difficultyLabel(movementConfig.difficulty, isSpanish)} - ${formatQuantity(movementConfig.quantity, isSpanish)}`}
          icon="footsteps-outline"
          tint={missionColors.physical}
          onPress={() => navigation.navigate('ConfigMovementMission', { practice: true })}
        />

        <MissionPracticeCard
          title={isSpanish ? 'Figuras y colores' : 'Shapes and colors'}
          summary={`${difficultyLabel(colorConfig.difficulty, isSpanish)} - ${formatQuantity(colorConfig.quantity, isSpanish)}`}
          icon="color-palette-outline"
          tint={missionColors.color}
          onPress={() => navigation.navigate('ConfigColoredFiguresMission', { practice: true })}
        />

        <MissionPracticeCard
          title={isSpanish ? 'Color diferente' : 'Different color'}
          summary={`${difficultyLabel(colorFindConfig.difficulty, isSpanish)} - ${formatQuantity(colorFindConfig.quantity, isSpanish)}`}
          icon="grid-outline"
          tint={missionColors.colorFind}
          onPress={() => navigation.navigate('ConfigColorFindMission', { practice: true })}
        />

        <MissionPracticeCard
          title={isSpanish ? 'Detectar objetos' : 'Detect objects'}
          summary={
            isSpanish
              ? `${difficultyLabel(objectConfig.difficulty, true)} - reconoce ${OBJECT_DIFFICULTY_QUANTITY[objectConfig.difficulty]} de ${objectPoolCount}`
              : `${difficultyLabel(objectConfig.difficulty, false)} - recognize ${OBJECT_DIFFICULTY_QUANTITY[objectConfig.difficulty]} of ${objectPoolCount}`
          }
          icon="scan-outline"
          tint={missionColors.photo}
          disabled={objectPoolCount === 0}
          onPress={() => navigation.navigate('ConfigObjectRecognitionMission', { practice: true })}
        />

        <MissionPracticeCard
          title={isSpanish ? 'Cultura general' : 'General knowledge'}
          summary={
            isSpanish
              ? `${difficultyLabel(triviaConfig.difficulty, true)} - ${triviaConfig.targetScore} puntos - ${triviaConfig.categoryIds.length} bancos`
              : `${difficultyLabel(triviaConfig.difficulty, false)} - ${triviaConfig.targetScore} points - ${triviaConfig.categoryIds.length} banks`
          }
          icon="help-circle-outline"
          tint={missionColors.trivia}
          onPress={() => navigation.navigate('ConfigTriviaMission', { practice: true })}
        />

        <MissionPracticeCard
          title={isSpanish ? 'Encontrar pares' : 'Find pairs'}
          summary={`${difficultyLabel(pairsConfig.difficulty, isSpanish)} - ${formatQuantity(pairsConfig.quantity, isSpanish)}`}
          icon="albums-outline"
          tint={missionColors.memory}
          onPress={() => navigation.navigate('ConfigParesMission', { practice: true })}
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
    paddingBottom: 32,
    gap: 12,
  },
  header: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 42,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  card: {
    minHeight: 76,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  summary: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
