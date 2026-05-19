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

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function ObjectRecognitionConfigScreen({ navigation }: Props) {
  const { config, setConfig } = useObjectRecognitionStore();
  const [objects, setObjects] = useState<RecognizableObject[]>([]);
  const [difficulty, setDifficulty] = useState<ObjectDifficulty>(config.difficulty);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>(
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
    navigation.navigate('MissionSelector');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerPill}>
          <Ionicons name="scan-outline" size={22} color={Colors.white} />
          <Text style={styles.headerText}>MISION{'\n'}DE OBJETOS</Text>
        </View>

        <View style={styles.previewBox}>
          <Ionicons name="cube-outline" size={54} color={Colors.missionColors.photo} />
          <Text style={styles.previewLabel}>
            {requiredQuantity} objeto{requiredQuantity > 1 ? 's' : ''}
          </Text>
          <Text style={styles.previewCategory}>
            Se elegiran al azar entre {selectedObjectIds.length} seleccionado
            {selectedObjectIds.length === 1 ? '' : 's'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Dificultad</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map(option => {
            const active = option.value === difficulty;

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.difficultyBtn, active && styles.difficultyBtnActive]}
                onPress={() => setDifficulty(option.value)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    active && styles.difficultyTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.difficultyMeta}>{option.quantity}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Objetos posibles</Text>

        <View style={styles.objectList}>
          {objects.map(object => {
            const active = selectedObjectIds.includes(object.id);

            return (
              <TouchableOpacity
                key={object.id}
                style={[styles.objectCard, active && styles.objectCardActive]}
                onPress={() => toggleObject(object.id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={active ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={active ? Colors.missionColors.photo : Colors.textMuted}
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
          style={[styles.confirmBtn, !canSave && styles.confirmBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSave}
        >
          <Text style={styles.confirmText}>
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
    backgroundColor: Colors.missionColors.photo,
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
    borderColor: Colors.missionColors.photo + '55',
    backgroundColor: Colors.missionColors.photo + '18',
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
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyBtn: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  difficultyBtnActive: {
    borderColor: Colors.missionColors.photo,
    backgroundColor: Colors.missionColors.photo + '18',
  },
  difficultyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  difficultyTextActive: {
    color: Colors.white,
  },
  difficultyMeta: {
    color: Colors.textMuted,
    fontSize: 12,
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
    borderColor: Colors.missionColors.photo,
    backgroundColor: Colors.missionColors.photo + '14',
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
    backgroundColor: Colors.missionColors.photo,
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
