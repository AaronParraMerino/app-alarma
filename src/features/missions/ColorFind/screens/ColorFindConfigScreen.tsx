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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { Colors } from '../../../../shared/theme/colors';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ColorFindGrid } from '../components/ColorFindGrid';
import {
  DEFAULT_CONFIG,
  DIFFICULTY_STYLES,
  EXAMPLE_PREVIEWS,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '../constants/colorFind.config';
import { useColorFindStore } from '../store/colorFindStore';
import { Difficulty } from '../types/colorFind.types';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ConfigColorFindMission'>;

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

function toAlarmDifficulty(difficulty: Difficulty) {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

function getDifficultyDisplayLabel(difficulty: Difficulty, isSpanish: boolean): string {
  if (difficulty === 'easy') {
    return isSpanish ? 'Facil' : 'Easy';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'Medio' : 'Medium';
  }

  return isSpanish ? 'Dificil' : 'Hard';
}

export function ColorFindConfigScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const { colors, isDark, statusBarStyle } = useAppTheme();
  const { language } = useTranslation();
  const { config, setConfig } = useColorFindStore();
  const [difficulty, setDifficulty] = useState<Difficulty>(
    route.params?.difficulty ?? config.difficulty ?? DEFAULT_CONFIG.difficulty,
  );
  const [quantity, setQuantity] = useState(
    route.params?.quantity ?? config.quantity ?? DEFAULT_CONFIG.quantity,
  );

  const style = DIFFICULTY_STYLES[difficulty];
  const previewBgColor = isDark ? colors.white : Colors.bgCard;
  const sliderIdx = LEVELS.indexOf(difficulty);
  const preview = EXAMPLE_PREVIEWS[difficulty];
  const isSmall = width < 360;
  const isShort = height < 680;
  const isSpanish = language === 'es';
  const fontBase = isSmall ? 12 : 14;
  const pillPadV = isShort ? 7 : 10;
  const sectionGap = isShort ? 10 : 16;

  const handleSave = () => {
    setConfig({ difficulty, quantity });

    if (route.params?.practice) {
      navigation.navigate('ColorFindMissionScreen', {
        difficulty,
        quantity,
        practice: true,
      });
      return;
    }

    const savedInAlarmConfig = completeAlarmMissionConfigSession(
      route.params?.alarmConfigSessionId,
      {
        type: 'colorFind',
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: isSmall ? 14 : 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton style={styles.backButton} onPress={() => navigation.goBack()} />

        <View
          style={[
            styles.headerPill,
            {
              backgroundColor: style.accentColor,
              paddingVertical: pillPadV,
              marginBottom: sectionGap,
            },
          ]}
        >
          <Ionicons
            name="grid-outline"
            size={24}
            color={style.textColor}
          />

          <Text
            style={[
              styles.headerText,
              {
                color: style.textColor,
                fontSize: isSmall ? 12 : 14,
              },
            ]}
          >
            {isSpanish ? 'MISION' : 'MISSION'}
            {'\n'}
            {isSpanish ? 'COLOR DIFERENTE' : 'DIFFERENT COLOR'}
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
          {isSpanish ? 'Seleccione la dificultad' : 'Select difficulty'}
        </Text>
        <Text
          style={[
            styles.subLabel,
            {
              color: colors.textSecondary,
              fontSize: isSmall ? 11 : 12,
            },
          ]}
        >
          {isSpanish ? 'Ejemplo - toca el cuadro marcado' : 'Example - tap the marked square'}
        </Text>

        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: previewBgColor,
              marginBottom: sectionGap,
              borderColor: style.accentColor + '40',
            },
          ]}
        >
          <Text style={[styles.previewTitle, { color: style.accentColor }]}>
            {style.gridSize * style.gridSize} {isSpanish ? 'cuadros' : 'squares'}
          </Text>
          <ColorFindGrid
            challenge={preview}
            accentColor={style.accentColor}
            revealOdd
            compact
          />
        </View>

        <View style={[styles.sliderWrapper, { marginBottom: isShort ? 4 : 8 }]}>
          <View style={[styles.trackBg, { backgroundColor: colors.bgElevated }]}>
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
                      backgroundColor: sliderIdx >= index ? style.accentColor : colors.bgElevated,
                      borderColor: sliderIdx >= index ? style.accentColor : colors.textMuted,
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
                    difficulty !== level && { color: colors.textMuted },
                  ]}
                >
                  {getDifficultyDisplayLabel(level, isSpanish)}
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
          {isSpanish ? 'Seleccione la cantidad' : 'Select quantity'}
        </Text>
        <View style={styles.quantityRow}>
          <View
            style={[
              styles.quantityBox,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.border,
                paddingVertical: isShort ? 8 : 10,
              },
            ]}
          >
            <Text
              style={[
                styles.quantityNum,
                {
                  color: colors.text,
                  fontSize: isSmall ? 18 : 22,
                },
              ]}
            >
              {quantity}
            </Text>
            <View style={styles.arrows}>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))}
                style={styles.arrowBtn}
              >
                <Text style={[styles.arrowText, { color: colors.textSecondary }]}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.max(MIN_QUANTITY, q - 1))}
                style={styles.arrowBtn}
              >
                <Text style={[styles.arrowText, { color: colors.textSecondary }]}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text
            style={[
              styles.vecesText,
              {
                color: colors.textSecondary,
                fontSize: isSmall ? 13 : 15,
              },
            ]}
          >
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
  safe: { flex: 1 },
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
    fontWeight: Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sectionLabel: {},
  subLabel: { marginBottom: 8 },
  previewBox: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12 },
  sliderWrapper: {},
  trackBg: {
    height: 4,
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
  labelText: {},
  divider: { height: 0.5 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    borderRadius: Layout.controlRadius,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
  },
  quantityNum: { fontWeight: '500', minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 13, fontWeight: '900' },
  vecesText: {},
  confirmBtn: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontWeight: '500' },
});
