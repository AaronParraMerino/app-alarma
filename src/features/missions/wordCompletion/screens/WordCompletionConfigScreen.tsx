import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const { config, setConfig } = useWordCompletionStore();
  const [difficulty, setDifficulty] = useState<Difficulty>(
    route.params?.difficulty ?? config.difficulty
  );
  const [quantity, setQuantity] = useState(config.quantity);

  const style = DIFFICULTY_STYLES[difficulty];
  const sliderIdx = LEVELS.indexOf(difficulty);
  const previews = EXAMPLE_PREVIEWS[difficulty];

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

      <View style={styles.headerPill}>
        <Text style={styles.headerText}>MISIÓN{'\n'}COMPLETAR PALABRAS</Text>
      </View>

      <Text style={styles.sectionLabel}>Seleccione la dificultad</Text>
      <Text style={styles.subLabel}>Ejemplo</Text>

{/* Preview de palabras segun dificultad */}
      <View style={[styles.previewBox, { minHeight: previews.length > 1 ? 110 : 72 }]}>
        {previews.map((challenge, idx) => (
          <View key={idx} style={idx > 0 ? { marginTop: 10 } : undefined}>
            <WordDisplay
              challenge={challenge}
              accentColor={style.accentColor}
              accentBg={style.bgColor}
              letterSize={width < 380 ? 20 : 24}
              textColor="#000000"
            />
          </View>
        ))}
      </View>

      <View style={styles.sliderWrapper}>
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
                difficulty === lvl && { color: style.accentColor, fontWeight: '500' },
              ]}>
                {DIFFICULTY_STYLES[lvl].label.charAt(0) + DIFFICULTY_STYLES[lvl].label.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Seleccione la cantidad</Text>
      <View style={styles.quantityRow}>
        <View style={styles.quantityBox}>
          <Text style={styles.quantityNum}>{quantity}</Text>
          <View style={styles.arrows}>
            <TouchableOpacity onPress={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))} style={styles.arrowBtn}>
              <Text style={styles.arrowText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setQuantity(q => Math.max(MIN_QUANTITY, q - 1))} style={styles.arrowBtn}>
              <Text style={styles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.vecesText}>veces</Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: style.accentColor }]}
        onPress={handleSave}
        activeOpacity={0.85}
      >
        <Text style={[styles.confirmText, { color: style.textColor }]}>Confirmar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 20, paddingTop: 32 },
  headerPill: {
    backgroundColor: '#1A6EF5',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  headerText: {
    color: '#E0E7FF', fontSize: 14, fontWeight: '500',
    textAlign: 'center', letterSpacing: 0.5,
  },
  sectionLabel: { fontSize: 14, color: '#E0E7FF', marginBottom: 6 },
  subLabel: { fontSize: 12, color: '#AAAAAA', marginBottom: 8 },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sliderWrapper: { marginBottom: 8 },
  trackBg: {
    height: 4, backgroundColor: '#2a2a2a', borderRadius: 2,
    marginHorizontal: 10, position: 'relative',
    justifyContent: 'center', marginBottom: 14,
  },
  trackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  thumbHit: {
    position: 'absolute', width: 30, height: 30,
    marginLeft: -15, top: -13,
    alignItems: 'center', justifyContent: 'center',
  },
  thumb: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  labelBtn: { flex: 1, alignItems: 'center' },
  labelText: { fontSize: 13, color: '#667788' },
  divider: { height: 0.5, backgroundColor: '#1E1E1E', marginVertical: 16 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityBox: {
    backgroundColor: '#1A2A3A', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 0.5, borderColor: '#2A4A6A',
  },
  quantityNum: { fontSize: 22, fontWeight: '500', color: '#E0E7FF', minWidth: 24, textAlign: 'center' },
  arrows: { gap: 2 },
  arrowBtn: { paddingHorizontal: 4 },
  arrowText: { fontSize: 11, color: '#AAAAAA' },
  vecesText: { fontSize: 15, color: '#AAAAAA' },
  spacer: { flex: 1 },
  confirmBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmText: { fontSize: 16, fontWeight: '500' },
});
