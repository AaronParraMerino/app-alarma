import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { PairCardTile } from '../components/PairCardTile';
import { PAIR_CARD_ASSETS } from '../constants/paresAssets';
import {
  BOARD_CELLS_BY_DIFFICULTY,
  DEFAULT_CONFIG,
  DIFFICULTY_STYLES,
  GRID_SIZE,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '../constants/paresMission.config';
import { usePairsMissionStore } from '../store/paresMissionStore';
import { PairsDifficulty } from '../types/paresMission.types';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ConfigParesMission'>;

const LEVELS: PairsDifficulty[] = ['easy', 'medium', 'hard'];

const PAIR_NAME_TRANSLATIONS: Record<string, string> = {
  arbol: 'Tree',
  astronauta: 'Astronaut',
  avion: 'Plane',
  balon: 'Ball',
  barco: 'Boat',
  bombilla: 'Light bulb',
  castillo: 'Castle',
  coche: 'Car',
  cofre: 'Chest',
  cohete: 'Rocket',
  conejo: 'Rabbit',
  corona: 'Crown',
  elefante: 'Elephant',
  estrella: 'Star',
  gato: 'Cat',
  llave: 'Key',
  manzana: 'Apple',
  perro: 'Dog',
  regalo: 'Gift',
  sol: 'Sun',
  tierra: 'Earth',
};

function getPairName(id: string, name: string, isSpanish: boolean) {
  return isSpanish ? name : PAIR_NAME_TRANSLATIONS[id] ?? name;
}

function getDifficultyLabel(difficulty: PairsDifficulty, isSpanish: boolean) {
  const labels: Record<PairsDifficulty, { es: string; en: string }> = {
    easy: { es: 'Fácil', en: 'Easy' },
    medium: { es: 'Medio', en: 'Medium' },
    hard: { es: 'Difícil', en: 'Hard' },
  };

  return labels[difficulty][isSpanish ? 'es' : 'en'];
}

// Convierte la dificultad a formato de alarma
function toAlarmDifficulty(difficulty: PairsDifficulty) {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

// Obtiene las cartas de ejemplo segun dificultad
function getPreviewCards(difficulty: PairsDifficulty) {
  const count = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 4;
  return PAIR_CARD_ASSETS.slice(0, count);
}

export function ParesMissionConfigScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const { config, setConfig } = usePairsMissionStore();
  const [difficulty, setDifficulty] = useState<PairsDifficulty>(
    route.params?.difficulty ?? config.difficulty ?? DEFAULT_CONFIG.difficulty,
  );
  const [quantity, setQuantity] = useState(
    Math.max(
      MIN_QUANTITY,
      Math.min(MAX_QUANTITY, route.params?.quantity ?? config.quantity),
    ),
  );

  const style = DIFFICULTY_STYLES[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);
  const previews = getPreviewCards(difficulty);
  const gridSize = GRID_SIZE[difficulty];
  const boardCells = BOARD_CELLS_BY_DIFFICULTY[difficulty];

  const isSmall = width < 360;
  const isShort = height < 680;
  const fontBase = isSmall ? 12 : 14;
  const pillPadV = isShort ? 7 : 10;
  const sectionGap = isShort ? 10 : 16;
  const previewMin = isShort ? 90 : 110;
  const previewSize = isShort ? 58 : 68;

  // Guarda la configuracion elegida
  const handleSave = () => {
    setConfig({ difficulty, quantity });

    completeAlarmMissionConfigSession(route.params?.alarmConfigSessionId, {
      type: 'memory',
      difficulty: toAlarmDifficulty(difficulty),
      quantity,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: isSmall ? 14 : 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton style={styles.backButton} onPress={() => navigation.goBack()} />

        <View style={[styles.headerPill, { paddingVertical: pillPadV, marginBottom: sectionGap }]}>
          <Text style={[styles.headerText, { fontSize: isSmall ? 12 : 14 }]}>
            {isSpanish ? 'MISION' : 'FIND'}{'\n'}
            {isSpanish ? 'ENCONTRAR PARES' : 'PAIRS'}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { fontSize: fontBase, marginBottom: 6 }]}>
          {isSpanish ? 'Seleccione la dificultad' : 'Select difficulty'}
        </Text>
        <Text style={[styles.subLabel, { fontSize: isSmall ? 11 : 12 }]}>
          {isSpanish ? 'Ejemplo' : 'Example'}
        </Text>

        <View
          style={[
            styles.previewBox,
            {
              minHeight: previewMin,
              marginBottom: sectionGap,
              borderColor: style.accentColor + '40',
            },
          ]}
        >
          <Text style={[styles.previewTitle, { color: style.accentColor }]}>
            {gridSize} x {gridSize} - {boardCells}{' '}
            {isSpanish ? 'casillas' : 'tiles'}
          </Text>
          <View style={styles.previewRow}>
            {previews.map(card => (
              <PairCardTile
                key={card.id}
                name={getPairName(card.id, card.name, isSpanish)}
                source={card.source}
                revealed
                accentColor={style.accentColor}
                textColor={style.textColor}
                size={previewSize}
                onPress={() => {}}
              />
            ))}
          </View>
        </View>

        <View style={[styles.sliderWrapper, { marginBottom: isShort ? 4 : 8 }]}>
          <View style={styles.trackBg}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${(sliderIdx / 2) * 100}%`,
                  backgroundColor: style.accentColor,
                },
              ]}
            />
            {LEVELS.map((level, index) => (
              <TouchableOpacity
                key={level}
                style={[styles.thumbHit, { left: `${(index / 2) * 100}%` as any }]}
                onPress={() => setDifficulty(level)}
              >
                <View
                  style={[
                    styles.thumb,
                    {
                      backgroundColor: sliderIdx >= index ? style.accentColor : Colors.bgElevated,
                      borderColor: sliderIdx >= index ? style.accentColor : Colors.textMuted,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sliderLabels}>
            {LEVELS.map(level => (
              <TouchableOpacity key={level} onPress={() => setDifficulty(level)} style={styles.labelBtn}>
                <Text
                  style={[
                    styles.labelText,
                    { fontSize: isSmall ? 11 : 13 },
                    difficulty === level && { color: style.accentColor, fontWeight: '500' },
                  ]}
                >
                  {getDifficultyLabel(level, isSpanish)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { marginVertical: sectionGap }]} />

        <Text style={[styles.sectionLabel, { fontSize: fontBase, marginBottom: 6 }]}>
          {isSpanish ? 'Seleccione la cantidad' : 'Select quantity'}
        </Text>
        <View style={styles.quantityRow}>
          <View style={[styles.quantityBox, { paddingVertical: isShort ? 8 : 10 }]}>
            <Text style={[styles.quantityNum, { fontSize: isSmall ? 18 : 22 }]}>
              {quantity}
            </Text>
            <View style={styles.arrows}>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))}
                style={styles.arrowBtn}
              >
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.max(MIN_QUANTITY, q - 1))}
                style={styles.arrowBtn}
              >
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.vecesText, { fontSize: isSmall ? 13 : 15 }]}>
            {isSpanish ? 'veces' : 'times'}
          </Text>
        </View>

        <View style={{ height: isShort ? 16 : 32 }} />

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { backgroundColor: style.accentColor, height: isShort ? 46 : 52 },
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: style.textColor, fontSize: isSmall ? 14 : 16 }]}>
            {isSpanish ? 'Confirmar' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
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
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  headerText: {
    color: Colors.white,
    fontWeight: Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionLabel: { color: Colors.text },
  subLabel: { color: Colors.textSecondary, marginBottom: 8 },
  previewBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  sliderWrapper: {},
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
  labelText: { color: Colors.textMuted },
  divider: { height: 0.5, backgroundColor: Colors.border },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Layout.controlRadius,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  quantityNum: { fontWeight: '500', color: Colors.text, minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '900' },
  vecesText: { color: Colors.textSecondary },
  confirmBtn: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontWeight: '500' },
});
