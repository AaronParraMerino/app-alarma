import React, { useState, useEffect } from 'react';
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
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { useColoredFiguresStore } from '../store/ColoredFiguresStore';
import {
  DIFFICULTY_STYLES,
  COLORS_BY_DIFFICULTY,
  PREVIEW_BY_DIFFICULTY,
} from '../constants/ColoredFigure.config';
import { Difficulty, ColoredFigureChallenge } from '../types/ColoredFigures.types';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ConfigColoredFiguresMission'>;

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

function toAlarmDifficulty(difficulty: Difficulty) {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

function PreviewFigure({ figure, color, size }: { figure: string; color: string; size: number }) {
  if (figure === 'circle')
    return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
  if (figure === 'square')
    return <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 6 }} />;
  if (figure === 'rectangle')
    return <View style={{ width: size * 1.6, height: size * 0.9, backgroundColor: color, borderRadius: 6 }} />;
  if (figure === 'diamond')
    return <View style={{ width: size * 0.7, height: size * 0.7, backgroundColor: color, transform: [{ rotate: '45deg' }], borderRadius: 4 }} />;
  if (figure === 'triangle')
    return (
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: size * 0.6, borderRightWidth: size * 0.6, borderBottomWidth: size,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
      }} />
    );
  return null;
}

export function ColoredMissionConfigScreen({ navigation, route }: Props) {
  const { config, setConfig } = useColoredFiguresStore();

  const [difficulty, setDifficulty] = useState<Difficulty>(
    route.params?.difficulty ?? config.difficulty
  );
  const [quantity, setQuantity] = useState(route.params?.quantity ?? config.quantity);

  // ✅ Reactivos al slider
  const [preview, setPreview] = useState<ColoredFigureChallenge>(
    PREVIEW_BY_DIFFICULTY[route.params?.difficulty ?? config.difficulty]
  );
  const [colorsOfLevel, setColorsOfLevel] = useState(
    COLORS_BY_DIFFICULTY[route.params?.difficulty ?? config.difficulty]
  );

  useEffect(() => {
    setPreview(PREVIEW_BY_DIFFICULTY[difficulty]);
    setColorsOfLevel(COLORS_BY_DIFFICULTY[difficulty]);
  }, [difficulty]);

  const style     = DIFFICULTY_STYLES[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);

  const handleSave = () => {
    setConfig({ difficulty, quantity });
    completeAlarmMissionConfigSession(
      route.params?.alarmConfigSessionId,
      { type: 'colored_figures' as any, difficulty: toAlarmDifficulty(difficulty), quantity },
    );
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.headerPill}>
          <Text style={styles.headerText}>MISIÓN{'\n'}FIGURAS Y COLORES</Text>
        </View>

        <Text style={styles.sectionLabel}>Seleccione la dificultad</Text>
        <Text style={styles.subLabel}>Ejemplo — ¿De qué color es esta figura?</Text>

        {/* ✅ Preview reactivo */}
        <View style={[styles.previewBox, { backgroundColor: style.bgColor, borderColor: style.accentColor + '40' }]}>
          <PreviewFigure figure={preview.figure} color={preview.hex} size={80} />
          <Text style={[styles.previewAnswer, { color: style.accentColor }]}>
            Respuesta: {preview.colorDisplayName}
          </Text>
        </View>

        {/* Slider */}
        <View style={styles.sliderWrapper}>
          <View style={styles.trackBg}>
            <View style={[styles.trackFill, {
              width: `${(sliderIdx / 2) * 100}%` as any,
              backgroundColor: style.accentColor,
            }]} />
            {LEVELS.map((lvl, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.thumbHit, { left: `${(i / 2) * 100}%` as any }]}
                onPress={() => setDifficulty(lvl)}
              >
                <View style={[
                  styles.thumb,
                  { backgroundColor: difficulty === lvl ? style.accentColor : '#444444', borderColor: style.accentColor },
                ]} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sliderLabels}>
            {LEVELS.map((lvl) => (
              <TouchableOpacity key={lvl} style={styles.labelBtn} onPress={() => setDifficulty(lvl)}>
                <Text style={[styles.labelText, difficulty === lvl && { color: style.accentColor, fontWeight: '600' }]}>
                  {DIFFICULTY_STYLES[lvl].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ✅ Colores reactivos al nivel */}
        <Text style={styles.sectionLabel}>Colores de este nivel</Text>
        <View style={styles.colorsGrid}>
          {colorsOfLevel.map((c) => (
            <View key={c.hex} style={styles.colorItem}>
              <View style={[
                styles.colorSwatch,
                { backgroundColor: c.hex },
                (c.hex === '#EFEFEF' || c.hex === '#FFFF00') && styles.swatchBorder,
              ]} />
              <Text style={[styles.colorLabel, { color: style.accentColor }]}>
                {c.colorDisplayName}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Cantidad */}
        <Text style={styles.sectionLabel}>Seleccione la cantidad</Text>
        <View style={styles.quantityRow}>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityNum}>{quantity}</Text>
            <View style={styles.arrows}>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => setQuantity(Math.min(quantity + 1, 9))}>
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => setQuantity(Math.max(quantity - 1, 1))}>
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.vecesText}> {quantity === 1 ? 'vez' : 'veces'}</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: style.textColor }]}>Guardar</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 20 },
  scroll: { paddingVertical: 32, gap: 12, paddingBottom: 40 },
  headerPill: {
    backgroundColor: '#1A6EF5', borderRadius: 24,
    paddingVertical: 10, paddingHorizontal: 24,
    alignItems: 'center', marginTop: 24, marginBottom: 24,
  },
  headerText:   { color: '#E0E7FF', fontSize: 14, fontWeight: '500', textAlign: 'center', letterSpacing: 0.5 },
  sectionLabel: { fontSize: 14, color: '#E0E7FF', marginBottom: 6 },
  subLabel:     { fontSize: 12, color: '#AAAAAA', marginBottom: 8 },
  previewBox: {
    borderRadius: 16, paddingVertical: 24, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 0.5, gap: 16, minHeight: 160,
  },
  previewAnswer: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  sliderWrapper: { marginBottom: 8 },
  trackBg: {
    height: 4, backgroundColor: '#2a2a2a', borderRadius: 2,
    marginHorizontal: 10, position: 'relative', justifyContent: 'center', marginBottom: 14,
  },
  trackFill:    { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  thumbHit:     { position: 'absolute', width: 30, height: 30, marginLeft: -15, top: -13, alignItems: 'center', justifyContent: 'center' },
  thumb:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  labelBtn:     { flex: 1, alignItems: 'center' },
  labelText:    { fontSize: 13, color: '#667788' },
  divider:      { height: 0.5, backgroundColor: '#1E1E1E', marginVertical: 16 },
  colorsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingVertical: 8 },
  colorItem:    { alignItems: 'center', gap: 6, minWidth: 60 },
  colorSwatch:  { width: 48, height: 48, borderRadius: 24 },
  swatchBorder: { borderWidth: 1, borderColor: '#555555' },
  colorLabel:   { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  quantityRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: '#1A2A3A', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 0.5, borderColor: '#2A4A6A',
  },
  quantityNum:  { fontSize: 22, fontWeight: '500', color: '#E0E7FF', minWidth: 24, textAlign: 'center' },
  arrows:       { gap: 2 },
  arrowBtn:     { paddingHorizontal: 4 },
  arrowText:    { fontSize: 11, color: '#AAAAAA' },
  vecesText:    { fontSize: 15, color: '#AAAAAA' },
  spacer:       { flex: 1 },
  confirmBtn:   { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmText:  { fontSize: 16, fontWeight: '500' },
});