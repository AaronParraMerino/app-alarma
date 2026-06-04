import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import {
  RANDOM_AVAILABLE_MISSIONS,
  RANDOM_MISSION_DEFAULT_CONFIG,
  RANDOM_MISSION_MAX_COUNT,
  RANDOM_MISSION_MAX_QUANTITY,
  RANDOM_MISSION_MIN_COUNT,
  RANDOM_MISSION_MIN_QUANTITY,
} from '../constants/randomMission.config';
import {
  RandomMissionConfig as Config,
  RandomMissionDifficulty,
} from '../types/randomMission.types';

type Props = {
  initialDifficulty?: RandomMissionDifficulty;
  initialQuantity?: number;
  initialMissionCount?: number;
  maxMissionCount?: number;
  onBack?: () => void;
  onSave: (config: Config) => void;
  saveLabel?: string;
};

const LEVELS: RandomMissionDifficulty[] = ['easy', 'medium', 'hard'];

const DIFFICULTY_META: Record<
  RandomMissionDifficulty,
  {
    labelEs: string;
    labelEn: string;
    color: string;
    textColor: string;
    detailEs: string;
    detailEn: string;
  }
> = {
  easy: {
    labelEs: 'Facil',
    labelEn: 'Easy',
    color: Colors.success,
    textColor: Colors.bg,
    detailEs: 'Retos cortos para apagar rapido.',
    detailEn: 'Short challenges to turn off quickly.',
  },
  medium: {
    labelEs: 'Medio',
    labelEn: 'Medium',
    color: Colors.warning,
    textColor: Colors.bg,
    detailEs: 'Equilibrio entre rapidez y concentracion.',
    detailEn: 'A balance between speed and focus.',
  },
  hard: {
    labelEs: 'Dificil',
    labelEn: 'Hard',
    color: Colors.danger,
    textColor: Colors.bg,
    detailEs: 'Mayor esfuerzo para despertar bien.',
    detailEn: 'More effort to wake up properly.',
  },
};

const MISSION_ICONS = [
  'calculator-outline',
  'text-outline',
  'footsteps-outline',
  'color-palette-outline',
  'grid-outline',
  'albums-outline',
  'scan-outline',
  'help-circle-outline',
] as const;

export function RandomMissionConfig({
  initialDifficulty = RANDOM_MISSION_DEFAULT_CONFIG.difficulty,
  initialQuantity = RANDOM_MISSION_DEFAULT_CONFIG.quantity,
  initialMissionCount = RANDOM_MISSION_DEFAULT_CONFIG.missionCount,
  maxMissionCount = RANDOM_MISSION_MAX_COUNT,
  onBack,
  onSave,
  saveLabel,
}: Props) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();
  const {
    language,
  } = useTranslation();
  const isSpanish = language === 'es';

  const [difficulty, setDifficulty] = useState<RandomMissionDifficulty>(initialDifficulty);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [missionCount, setMissionCount] = useState(
    Math.min(Math.max(initialMissionCount, RANDOM_MISSION_MIN_COUNT), maxMissionCount),
  );

  const selected = DIFFICULTY_META[difficulty];
  const confirmLabel = saveLabel ?? (isSpanish ? 'Confirmar' : 'Confirm');
  const sliderIdx = LEVELS.indexOf(difficulty);
  const countOptions = Array.from(
    { length: Math.max(RANDOM_MISSION_MIN_COUNT, maxMissionCount) },
    (_, index) => index + 1,
  );

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {onBack ? (
          <BackButton style={styles.backButton} onPress={onBack} />
        ) : null}

        <View
          style={[
            styles.headerPill,
            {
              backgroundColor: selected.color,
            },
          ]}
        >
          <Ionicons
            name="shuffle-outline"
            size={24}
            color={selected.textColor}
          />

          <Text
            style={[
              styles.headerText,
              {
                color: selected.textColor,
              },
            ]}
          >
            {isSpanish
              ? 'MISION\nALEATORIA'
              : 'RANDOM\nMISSION'}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {isSpanish ? 'Como funciona' : 'How it works'}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isSpanish
            ? 'Al sonar la alarma se elegiran misiones disponibles al azar. Cada una usara una configuracion valida segun su tipo.'
            : 'When the alarm rings, available missions will be chosen randomly. Each one will use a valid configuration for its type.'}
        </Text>

        <View style={styles.missionList}>
          {RANDOM_AVAILABLE_MISSIONS.map((mission, index) => (
            <View
              key={mission.titleEs}
              style={[
                styles.missionRow,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: colors.bg,
                    borderColor: selected.color + '77',
                  },
                ]}
              >
                <Ionicons name={MISSION_ICONS[index]} size={22} color={selected.color} />
              </View>
              <View style={styles.missionCopy}>
                <Text style={[styles.missionTitle, { color: colors.text }]}>
                  {isSpanish ? mission.titleEs : mission.titleEn}
                </Text>
                <Text style={[styles.missionDescription, { color: colors.textSecondary }]}>
                  {isSpanish ? mission.descriptionEs : mission.descriptionEn}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {isSpanish ? 'Misiones aleatorias' : 'Random missions'}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isSpanish
            ? `${missionCount} mision${missionCount === 1 ? '' : 'es'} al sonar la alarma.`
            : `${missionCount} mission${missionCount === 1 ? '' : 's'} when the alarm rings.`}
        </Text>
        <View style={styles.countGrid}>
          {countOptions.map(option => {
            const active = missionCount === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.countButton,
                  {
                    backgroundColor: colors.bgElevated,
                    borderColor: colors.border,
                  },
                  active && {
                    backgroundColor: selected.color,
                    borderColor: selected.color,
                  },
                ]}
                onPress={() => setMissionCount(option)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.countText,
                    {
                      color: colors.text,
                    },
                    active && { color: selected.textColor },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {isSpanish ? 'Seleccione la dificultad' : 'Select the difficulty'}
        </Text>
        <Text style={[styles.difficultyHint, { color: selected.color }]}>
          {isSpanish ? selected.detailEs : selected.detailEn}
        </Text>

        <View style={styles.sliderWrapper}>
          <View style={[styles.trackBg, { backgroundColor: colors.bgElevated }]}>
            <View
              style={[
                styles.trackFill,
                { width: `${(sliderIdx / 2) * 100}%`, backgroundColor: selected.color },
              ]}
            />
            {LEVELS.map((level, index) => (
              <TouchableOpacity
                key={level}
                style={[styles.thumbHit, { left: `${(index / 2) * 100}%` }]}
                onPress={() => setDifficulty(level)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.thumb,
                    {
                      backgroundColor: sliderIdx >= index ? selected.color : colors.bgElevated,
                      borderColor: sliderIdx >= index ? selected.color : colors.textMuted,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sliderLabels}>
            {LEVELS.map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => setDifficulty(level)}
                style={styles.labelBtn}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: colors.textMuted,
                    },
                    difficulty === level && { color: selected.color, fontWeight: '800' },
                  ]}
                >
                  {isSpanish ? DIFFICULTY_META[level].labelEs : DIFFICULTY_META[level].labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {isSpanish ? 'Retos por mision' : 'Challenges per mission'}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isSpanish
            ? 'Aplica a misiones con rondas. Detectar objetos y cultura general eligen objetos, categorias y meta automaticamente.'
            : 'Applies to missions with rounds. Object detection and trivia choose objects, categories, and goals automatically.'}
        </Text>
        <View style={styles.quantityRow}>
          <View
            style={[
              styles.quantityBox,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.quantityNum, { color: colors.text }]}>{quantity}</Text>
            <View style={styles.arrows}>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setQuantity(value => Math.min(RANDOM_MISSION_MAX_QUANTITY, value + 1))}
                activeOpacity={0.85}
              >
                <Text style={[styles.arrowText, { color: colors.textSecondary }]}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setQuantity(value => Math.max(RANDOM_MISSION_MIN_QUANTITY, value - 1))}
                activeOpacity={0.85}
              >
                <Text style={[styles.arrowText, { color: colors.textSecondary }]}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.vecesText, { color: colors.textSecondary }]}>
            {isSpanish ? 'veces' : 'times'}
          </Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: selected.color }]}
          onPress={() => onSave({ difficulty, quantity, missionCount })}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: selected.textColor }]}>{confirmLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
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
    marginTop: 12,
    marginBottom: 24,
  },
  headerText: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionLabel: { fontSize: Typography.sectionTitle.fontSize, color: Colors.text, marginBottom: 6 },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  missionList: { gap: 10, marginTop: 4 },
  missionRow: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  missionCopy: { flex: 1, gap: 2 },
  missionTitle: { color: Colors.text, fontSize: 13, fontWeight: '800' },
  missionDescription: { color: Colors.textSecondary, fontSize: 12, lineHeight: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  countGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  countButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  difficultyHint: { fontSize: 12, fontWeight: '700', marginBottom: 12 },
  sliderWrapper: { marginBottom: 8 },
  trackBg: {
    height: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 2,
    marginHorizontal: 10,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  trackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  thumbHit: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    top: -13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  labelBtn: { flex: 1, alignItems: 'center' },
  labelText: { fontSize: 13, color: Colors.textMuted },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityNum: { fontSize: 22, fontWeight: '700', color: Colors.text, minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '900' },
  vecesText: { fontSize: 15, color: Colors.textSecondary },
  spacer: { flex: 1, minHeight: 14 },
  confirmBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmText: { fontSize: 16, fontWeight: '800' },
});
