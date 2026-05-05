import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, useWindowDimensions, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Difficulty } from '../types/wordCompletion.types';
import {
  DIFFICULTY_STYLES, EXAMPLE_PREVIEWS,
  MIN_QUANTITY, MAX_QUANTITY, DEFAULT_CONFIG,
} from '../constants/wordCompletion.config';
import { WordDisplay } from '../components/WordDisplay';
import { useWordCompletionStore } from '../store/wordCompletionStore';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';

type Props = NativeStackScreenProps<MissionsStackParamList, 'ConfigWordCompletionMission'>;

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard'];

export function WordCompletionConfigScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const { config, setConfig } = useWordCompletionStore();
  const [difficulty, setDifficulty] = useState<Difficulty>(
    route.params?.difficulty ?? config.difficulty
  );
  const [quantity, setQuantity] = useState(config.quantity);

  const style = DIFFICULTY_STYLES[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);
  const previews = EXAMPLE_PREVIEWS[difficulty];

  // Escalas responsivas
  const isSmall    = width < 360;
  const isShort    = height < 680;
  const fontBase   = isSmall ? 12 : 14;
  const pillPadV   = isShort ? 7 : 10;
  const sectionGap = isShort ? 10 : 16;
  const previewMin = previews.length > 1 ? (isShort ? 90 : 110) : (isShort ? 60 : 72);

  /**
   * Guarda configuración final en store global
   * y regresa a la pantalla anterior
   */
  const handleSave = () => {
    setConfig({ difficulty, quantity });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: isSmall ? 14 : 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerPill, { paddingVertical: pillPadV, marginBottom: sectionGap }]}>
          <Text style={[styles.headerText, { fontSize: isSmall ? 12 : 14 }]}>
            MISIÓN{'\n'}COMPLETAR PALABRAS
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { fontSize: fontBase, marginBottom: 6 }]}>
          Seleccione la dificultad
        </Text>
        <Text style={[styles.subLabel, { fontSize: isSmall ? 11 : 12 }]}>Ejemplo</Text>

        {/* Preview de palabras segun dificultad */}
        <View style={[styles.previewBox, { minHeight: previewMin, marginBottom: sectionGap }]}>
          {previews.map((challenge, idx) => (
            <View key={idx} style={idx > 0 ? { marginTop: 10 } : undefined}>
              <WordDisplay
                challenge={challenge}
                accentColor={style.accentColor}
                accentBg={style.bgColor}
                letterSize={isSmall ? 18 : width < 400 ? 20 : 24}
                textColor="#000000"
              />
            </View>
          ))}
        </View>

        <View style={[styles.sliderWrapper, { marginBottom: isShort ? 4 : 8 }]}>
          <View style={styles.trackBg}>
            <View style={[
              styles.trackFill,
              { width: `${(sliderIdx / 2) * 100}%`, backgroundColor: style.accentColor },
            ]} />
            {LEVELS.map((lvl, i) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.thumbHit, { left: `${(i / 2) * 100}%` as any }]}
                onPress={() => setDifficulty(lvl)}
              >
                <View style={[
                  styles.thumb,
                  {
                    backgroundColor: sliderIdx >= i ? style.accentColor : '#2a2a2a',
                    borderColor: sliderIdx >= i ? style.accentColor : '#444',
                  },
                ]} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sliderLabels}>
            {LEVELS.map((lvl) => (
              <TouchableOpacity key={lvl} onPress={() => setDifficulty(lvl)} style={styles.labelBtn}>
                <Text style={[
                  styles.labelText,
                  { fontSize: isSmall ? 11 : 13 },
                  difficulty === lvl && { color: style.accentColor, fontWeight: '500' },
                ]}>
                  {DIFFICULTY_STYLES[lvl].label.charAt(0) + DIFFICULTY_STYLES[lvl].label.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.divider, { marginVertical: sectionGap }]} />

        <Text style={[styles.sectionLabel, { fontSize: fontBase, marginBottom: 6 }]}>
          Seleccione la cantidad
        </Text>
        <View style={styles.quantityRow}>
          <View style={[styles.quantityBox, { paddingVertical: isShort ? 8 : 10 }]}>
            <Text style={[styles.quantityNum, { fontSize: isSmall ? 18 : 22 }]}>{quantity}</Text>
            <View style={styles.arrows}>
              <TouchableOpacity onPress={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))} style={styles.arrowBtn}>
                <Text style={styles.arrowText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setQuantity(q => Math.max(MIN_QUANTITY, q - 1))} style={styles.arrowBtn}>
                <Text style={styles.arrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.vecesText, { fontSize: isSmall ? 13 : 15 }]}>veces</Text>
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
            Confirmar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flexGrow: 1, paddingTop: 70, paddingBottom: 24 },
  headerPill: {
    backgroundColor: '#1A6EF5', borderRadius: 24,
    paddingHorizontal: 24, alignItems: 'center', marginTop: 8,
  },
  headerText: { color: '#E0E7FF', fontWeight: '500', textAlign: 'center', letterSpacing: 0.5 },
  sectionLabel: { color: '#E0E7FF' },
  subLabel: { color: '#AAAAAA', marginBottom: 8 },
  previewBox: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sliderWrapper: {},
  trackBg: {
    height: 4, backgroundColor: '#2a2a2a', borderRadius: 2,
    marginHorizontal: 10, position: 'relative',
    justifyContent: 'center', marginBottom: 14,
  },
  trackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  thumbHit: {
    position: 'absolute', width: 30, height: 30,
    marginLeft: -15, top: -13, alignItems: 'center', justifyContent: 'center',
  },
  thumb: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  labelBtn: { flex: 1, alignItems: 'center' },
  labelText: { color: '#667788' },
  divider: { height: 0.5, backgroundColor: '#1E1E1E' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: '#1A2A3A', borderRadius: 10, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 0.5, borderColor: '#2A4A6A',
  },
  quantityNum: { fontWeight: '500', color: '#E0E7FF', minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 11, color: '#AAAAAA' },
  vecesText: { color: '#AAAAAA' },
  confirmBtn: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontWeight: '500' },
});
