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
  { label: string; color: string; textColor: string; detail: string }
> = {
  easy: {
    label: 'Facil',
    color: Colors.success,
    textColor: Colors.bg,
    detail: 'Retos cortos para apagar rapido.',
  },
  medium: {
    label: 'Medio',
    color: Colors.warning,
    textColor: Colors.bg,
    detail: 'Equilibrio entre rapidez y concentracion.',
  },
  hard: {
    label: 'Dificil',
    color: Colors.danger,
    textColor: Colors.bg,
    detail: 'Mayor esfuerzo para despertar bien.',
  },
};

const MISSION_ICONS = ['calculator-outline', 'text-outline'] as const;

export function RandomMissionConfig({
  initialDifficulty = RANDOM_MISSION_DEFAULT_CONFIG.difficulty,
  initialQuantity = RANDOM_MISSION_DEFAULT_CONFIG.quantity,
  initialMissionCount = RANDOM_MISSION_DEFAULT_CONFIG.missionCount,
  maxMissionCount = RANDOM_MISSION_MAX_COUNT,
  onBack,
  onSave,
  saveLabel = 'Confirmar',
}: Props) {
  const [difficulty, setDifficulty] = useState<RandomMissionDifficulty>(initialDifficulty);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [missionCount, setMissionCount] = useState(
    Math.min(Math.max(initialMissionCount, RANDOM_MISSION_MIN_COUNT), maxMissionCount),
  );

  const selected = DIFFICULTY_META[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);
  const countOptions = Array.from(
    { length: Math.max(RANDOM_MISSION_MIN_COUNT, maxMissionCount) },
    (_, index) => index + 1,
  );

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {onBack ? (
          <BackButton style={styles.backButton} onPress={onBack} />
        ) : null}

        <View style={styles.headerPill}>
          <Text style={styles.headerText}>MISION{'\n'}ALEATORIA</Text>
        </View>

        <Text style={styles.sectionLabel}>Como funciona</Text>
        <Text style={styles.description}>
          Al sonar la alarma se elegiran misiones disponibles al azar con la dificultad
          y cantidad que configures aqui.
        </Text>

        <View style={styles.missionList}>
          {RANDOM_AVAILABLE_MISSIONS.map((mission, index) => (
            <View key={mission.title} style={styles.missionRow}>
              <View style={[styles.iconWrap, { borderColor: selected.color + '77' }]}>
                <Ionicons name={MISSION_ICONS[index]} size={22} color={selected.color} />
              </View>
              <View style={styles.missionCopy}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDescription}>{mission.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Misiones aleatorias</Text>
        <Text style={styles.description}>
          {missionCount} mision{missionCount === 1 ? '' : 'es'} al sonar la alarma.
        </Text>
        <View style={styles.countGrid}>
          {countOptions.map(option => {
            const active = missionCount === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.countButton,
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
                    active && { color: selected.textColor },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Seleccione la dificultad</Text>
        <Text style={[styles.difficultyHint, { color: selected.color }]}>
          {selected.detail}
        </Text>

        <View style={styles.sliderWrapper}>
          <View style={styles.trackBg}>
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
                      backgroundColor: sliderIdx >= index ? selected.color : Colors.bgElevated,
                      borderColor: sliderIdx >= index ? selected.color : Colors.textMuted,
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
                    difficulty === level && { color: selected.color, fontWeight: '800' },
                  ]}
                >
                  {DIFFICULTY_META[level].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Retos por mision</Text>
        <View style={styles.quantityRow}>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityNum}>{quantity}</Text>
            <View style={styles.arrows}>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setQuantity(value => Math.min(RANDOM_MISSION_MAX_QUANTITY, value + 1))}
                activeOpacity={0.85}
              >
                <Text style={styles.arrowText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setQuantity(value => Math.max(RANDOM_MISSION_MIN_QUANTITY, value - 1))}
                activeOpacity={0.85}
              >
                <Text style={styles.arrowText}>-</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.vecesText}>veces</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: selected.color }]}
          onPress={() => onSave({ difficulty, quantity, missionCount })}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: selected.textColor }]}>{saveLabel}</Text>
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
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  headerText: {
    color: Colors.white,
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
  arrowText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '800' },
  vecesText: { fontSize: 15, color: Colors.textSecondary },
  spacer: { flex: 1, minHeight: 14 },
  confirmBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmText: { fontSize: 16, fontWeight: '800' },
});
