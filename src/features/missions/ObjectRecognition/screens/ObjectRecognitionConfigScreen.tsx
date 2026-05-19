import React, { useEffect, useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';
import { ObjectBankService } from '../services/objectBank.service';
import { useObjectRecognitionStore } from '../store/objectRecognitionStore';
import { RecognizableObject } from '../types/objectRecognition.types';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ConfigObjectRecognitionMission'
>;

const CATEGORY_LABELS: Record<string, string> = {
  bathroom: 'Bano',
  home: 'Casa',
  kitchen: 'Cocina',
  other: 'Otros',
  personal: 'Personal',
  school: 'Estudio',
};

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Facil', quantity: 1 },
  { value: 'medium', label: 'Medio', quantity: 2 },
  { value: 'hard', label: 'Dificil', quantity: 3 },
] as const;

type ObjectDifficulty = typeof DIFFICULTY_OPTIONS[number]['value'];

const DIFFICULTY_STYLES: Record<
  ObjectDifficulty,
  { accentColor: string; bgColor: string; textColor: string }
> = {
  easy: {
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
  },
  medium: {
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
  },
  hard: {
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
  },
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function toAlarmDifficulty(difficulty: ObjectDifficulty) {
  return difficulty === 'medium' ? 'normal' : difficulty;
}

export function ObjectRecognitionConfigScreen({ navigation, route }: Props) {
  const { config, setConfig } = useObjectRecognitionStore();
  const [objects, setObjects] = useState<RecognizableObject[]>([]);
  const [difficulty, setDifficulty] = useState<ObjectDifficulty>(
    ((route.params as any)?.difficulty as ObjectDifficulty | undefined) ??
      config.difficulty,
  );
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>(
    ((route.params as any)?.targetObjectIds as string[] | undefined) ??
      config.targetObjectIds,
  );

  useEffect(() => {
    const enabledObjects = ObjectBankService.getEnabled();
    setObjects(enabledObjects);
    setSelectedObjectIds(current =>
      current.length > 0 ? current : enabledObjects.slice(0, 3).map(object => object.id),
    );
  }, []);

  const requiredQuantity =
    DIFFICULTY_OPTIONS.find(option => option.value === difficulty)?.quantity ?? 1;
  const difficultyStyle = DIFFICULTY_STYLES[difficulty];
  const canSave = selectedObjectIds.length >= requiredQuantity;

  const toggleObject = (objectId: string) => {
    setSelectedObjectIds(current =>
      current.includes(objectId)
        ? current.filter(id => id !== objectId)
        : [...current, objectId],
    );
  };

  const handleSave = () => {
    if (!canSave) return;
    setConfig({ difficulty, targetObjectIds: selectedObjectIds });
    const alarmConfigSessionId = (route.params as any)?.alarmConfigSessionId as
      | string
      | undefined;

    completeAlarmMissionConfigSession(alarmConfigSessionId, {
      type: 'photo',
      difficulty: toAlarmDifficulty(difficulty),
      quantity: requiredQuantity,
      targetObjectIds: selectedObjectIds,
    });

    if (alarmConfigSessionId) {
      navigation.goBack();
      return;
    }

    navigation.navigate('MissionSelector');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => navigation.goBack()} />

        <View
          style={[
            styles.headerPill,
            { backgroundColor: difficultyStyle.accentColor },
          ]}
        >
          <Ionicons name="scan-outline" size={22} color={Colors.white} />
          <Text style={styles.headerText}>MISION{'\n'}DE OBJETOS</Text>
        </View>

        <View
          style={[
            styles.previewBox,
            {
              borderColor: difficultyStyle.accentColor + '55',
              backgroundColor: difficultyStyle.bgColor,
            },
          ]}
        >
          <Ionicons name="cube-outline" size={54} color={difficultyStyle.accentColor} />
          <Text style={styles.previewLabel}>
            {requiredQuantity} objeto{requiredQuantity > 1 ? 's' : ''}
          </Text>
          <Text style={styles.previewCategory}>
            Se elegiran al azar entre {selectedObjectIds.length} seleccionado
            {selectedObjectIds.length === 1 ? '' : 's'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Dificultad</Text>
        <View style={styles.sliderWrapper}>
          <View style={styles.trackBg}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${(DIFFICULTY_OPTIONS.findIndex(
                    option => option.value === difficulty,
                  ) / 2) * 100}%`,
                  backgroundColor: difficultyStyle.accentColor,
                },
              ]}
            />
            {DIFFICULTY_OPTIONS.map((option, index) => {
              const active = option.value === difficulty;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.thumbHit, { left: `${(index / 2) * 100}%` }]}
                  onPress={() => setDifficulty(option.value)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.thumb,
                      { borderColor: difficultyStyle.accentColor },
                      active && { backgroundColor: difficultyStyle.accentColor },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.sliderLabels}>
            {DIFFICULTY_OPTIONS.map(option => {
              const active = option.value === difficulty;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.labelBtn}
                  onPress={() => setDifficulty(option.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.labelText,
                      active && {
                        color: difficultyStyle.accentColor,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <Text style={styles.sectionLabel}>Objetos posibles</Text>

        <View style={styles.objectList}>
          {objects.map(object => {
            const active = selectedObjectIds.includes(object.id);

            return (
              <TouchableOpacity
                key={object.id}
                style={[
                  styles.objectCard,
                  active && {
                    borderColor: difficultyStyle.accentColor,
                    backgroundColor: difficultyStyle.bgColor,
                  },
                ]}
                onPress={() => toggleObject(object.id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={active ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={active ? difficultyStyle.accentColor : Colors.textMuted}
                />
                <View style={styles.objectTextWrap}>
                  <Text style={[styles.objectLabel, active && styles.objectLabelActive]}>
                    {object.label}
                  </Text>
                  <Text style={styles.objectCategory}>
                    {categoryLabel(object.category)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            { backgroundColor: difficultyStyle.accentColor },
            !canSave && styles.confirmBtnDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSave}
        >
          <Text style={[styles.confirmText, { color: difficultyStyle.textColor }]}>
            {canSave ? 'Guardar' : `Selecciona minimo ${requiredQuantity}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 32,
    paddingBottom: 42,
    gap: 14,
  },
  headerPill: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 14,
  },
  headerText: {
    color: Colors.white,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  previewBox: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewLabel: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  previewCategory: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
  },
  sliderWrapper: {
    marginBottom: 4,
  },
  trackBg: {
    height: 4,
    backgroundColor: Colors.bgElevated,
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
    backgroundColor: Colors.primary,
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
    borderColor: Colors.primary,
    backgroundColor: Colors.bgElevated,
  },
  thumbActive: {
    backgroundColor: Colors.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelBtn: {
    flex: 1,
    alignItems: 'center',
  },
  labelText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  labelTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  objectList: {
    gap: 10,
  },
  objectCard: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  objectCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '14',
  },
  objectTextWrap: {
    flex: 1,
    gap: 2,
  },
  objectLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  objectLabelActive: {
    color: Colors.white,
  },
  objectCategory: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
