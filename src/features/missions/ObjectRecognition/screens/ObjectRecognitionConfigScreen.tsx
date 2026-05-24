// src/features/missions/ObjectRecognition/screens/ObjectRecognitionConfigScreen.tsx
import React, {
  useEffect,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Layout } from '../../../../shared/theme/layout';
import { Typography } from '../../../../shared/theme/typography';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { Colors } from '../../../../shared/theme/colors';

import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { completeAlarmMissionConfigSession } from '../../../alarm/services/alarmMissionConfigSession';
import { ObjectBankService } from '../services/objectBank.service';
import { useObjectRecognitionStore } from '../store/objectRecognitionStore';
import { RecognizableObject } from '../types/objectRecognition.types';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ConfigObjectRecognitionMission'
>;

const CATEGORY_LABELS_ES: Record<string, string> = {
  bathroom: 'Baño',
  home: 'Casa',
  kitchen: 'Cocina',
  other: 'Otros',
  personal: 'Personal',
  school: 'Estudio',
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  bathroom: 'Bathroom',
  home: 'Home',
  kitchen: 'Kitchen',
  other: 'Other',
  personal: 'Personal',
  school: 'School',
};

const DIFFICULTY_OPTIONS = [
  {
    value: 'easy',
    labelEs: 'Fácil',
    labelEn: 'Easy',
    quantity: 1,
  },
  {
    value: 'medium',
    labelEs: 'Medio',
    labelEn: 'Medium',
    quantity: 2,
  },
  {
    value: 'hard',
    labelEs: 'Difícil',
    labelEn: 'Hard',
    quantity: 3,
  },
] as const;

type ObjectDifficulty =
  (typeof DIFFICULTY_OPTIONS)[number]['value'];

const DIFFICULTY_STYLES: Record<
  ObjectDifficulty,
  {
    accentColor: string;
    bgColor: string;
    textColor: string;
  }
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

function normalizeText(
  value: string,
): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    );
}

function categoryLabel(
  category: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return CATEGORY_LABELS_ES[category] ?? category;
  }

  return CATEGORY_LABELS_EN[category] ?? category;
}

function toAlarmDifficulty(
  difficulty: ObjectDifficulty,
) {
  if (difficulty === 'medium') {
    return 'normal';
  }

  return difficulty;
}

function getDifficultyLabel(
  difficulty: ObjectDifficulty,
  isSpanish: boolean,
): string {
  const option =
    DIFFICULTY_OPTIONS.find(
      (item) => item.value === difficulty,
    );

  if (!option) {
    return difficulty;
  }

  return isSpanish
    ? option.labelEs
    : option.labelEn;
}

function translateObjectLabel(
  label: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return label;
  }

  const normalized =
    normalizeText(label);

  const objectLabels: Record<string, string> = {
    cepillo: 'Brush',
    'cepillo de dientes': 'Toothbrush',
    pasta: 'Toothpaste',
    'pasta dental': 'Toothpaste',
    jabon: 'Soap',
    shampoo: 'Shampoo',
    toalla: 'Towel',

    taza: 'Cup',
    vaso: 'Glass',
    plato: 'Plate',
    cuchara: 'Spoon',
    tenedor: 'Fork',
    cuchillo: 'Knife',
    botella: 'Bottle',

    libro: 'Book',
    cuaderno: 'Notebook',
    lapiz: 'Pencil',
    boligrafo: 'Pen',
    marcador: 'Marker',
    regla: 'Ruler',
    mochila: 'Backpack',

    llave: 'Key',
    llaves: 'Keys',
    celular: 'Phone',
    telefono: 'Phone',
    cargador: 'Charger',
    billetera: 'Wallet',
    reloj: 'Watch',
    lentes: 'Glasses',

    zapato: 'Shoe',
    zapatos: 'Shoes',
    ropa: 'Clothes',
    control: 'Remote control',
    'control remoto': 'Remote control',
  };

  return objectLabels[normalized] ?? label;
}

export function ObjectRecognitionConfigScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    isDark,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish =
    language === 'es';

  const {
    config,
    setConfig,
  } = useObjectRecognitionStore();

  const [
    objects,
    setObjects,
  ] = useState<RecognizableObject[]>([]);

  const [
    difficulty,
    setDifficulty,
  ] = useState<ObjectDifficulty>(
    ((route.params as any)?.difficulty as
      | ObjectDifficulty
      | undefined) ?? config.difficulty,
  );

  const [
    selectedObjectIds,
    setSelectedObjectIds,
  ] = useState<string[]>(
    ((route.params as any)?.targetObjectIds as
      | string[]
      | undefined) ?? config.targetObjectIds,
  );

  useEffect(() => {
    const enabledObjects =
      ObjectBankService.getEnabled();

    setObjects(enabledObjects);

    setSelectedObjectIds((current) =>
      current.length > 0
        ? current
        : enabledObjects
            .slice(
              0,
              3,
            )
            .map((object) => object.id),
    );
  }, []);

  const requiredQuantity =
    DIFFICULTY_OPTIONS.find(
      (option) => option.value === difficulty,
    )?.quantity ?? 1;

  const difficultyStyle =
    DIFFICULTY_STYLES[difficulty];
  const previewBgColor =
    isDark ? colors.white : Colors.bgCard;
  const previewTextColor =
    isDark ? colors.black : colors.white;

  const canSave =
    selectedObjectIds.length >= requiredQuantity;

  const toggleObject = (
    objectId: string,
  ) => {
    setSelectedObjectIds((current) =>
      current.includes(objectId)
        ? current.filter(
            (id) => id !== objectId,
          )
        : [
            ...current,
            objectId,
          ],
    );
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    setConfig({
      difficulty,
      targetObjectIds: selectedObjectIds,
    });

    if ((route.params as any)?.practice) {
      navigation.navigate('ObjectRecognitionMissionScreen', {
        difficulty,
        targetObjectIds: selectedObjectIds,
        practice: true,
      });
      return;
    }

    const alarmConfigSessionId =
      (route.params as any)?.alarmConfigSessionId as
        | string
        | undefined;

    completeAlarmMissionConfigSession(
      alarmConfigSessionId,
      {
        type: 'photo',
        difficulty: toAlarmDifficulty(difficulty),
        quantity: requiredQuantity,
        targetObjectIds: selectedObjectIds,
      },
    );

    if (alarmConfigSessionId) {
      navigation.goBack();

      return;
    }

    navigation.navigate('MissionSelector');
  };

  const previewObjectText =
    isSpanish
      ? `${requiredQuantity} objeto${
          requiredQuantity > 1
            ? 's'
            : ''
        }`
      : `${requiredQuantity} object${
          requiredQuantity > 1
            ? 's'
            : ''
        }`;

  const selectedPreviewText =
    isSpanish
      ? `Se elegirán al azar entre ${
          selectedObjectIds.length
        } seleccionado${
          selectedObjectIds.length === 1
            ? ''
            : 's'
        }`
      : `They will be randomly chosen from ${
          selectedObjectIds.length
        } selected object${
          selectedObjectIds.length === 1
            ? ''
            : 's'
        }`;

  const confirmText =
    canSave
      ? isSpanish
        ? (route.params as any)?.practice
          ? 'Probar'
          : 'Guardar'
        : (route.params as any)?.practice
          ? 'Try'
          : 'Save'
      : isSpanish
        ? `Selecciona mínimo ${requiredQuantity}`
        : `Select at least ${requiredQuantity}`;

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <BackButton
          label={
            isSpanish
              ? 'Volver'
              : 'Back'
          }
          onPress={() => navigation.goBack()}
        />

        <View
          style={[
            styles.headerPill,
            {
              backgroundColor:
                difficultyStyle.accentColor,
            },
          ]}
        >
          <Ionicons
            name="scan-outline"
            size={22}
            color={difficultyStyle.textColor}
          />

          <Text
            style={[
              styles.headerText,
              {
                color:
                  difficultyStyle.textColor,
              },
            ]}
          >
            {isSpanish
              ? 'MISIÓN\nDE OBJETOS'
              : 'MISSION\nOBJECTS'}
          </Text>
        </View>

        <View
          style={[
            styles.previewBox,
            {
              borderColor:
                difficultyStyle.accentColor +
                '55',
              backgroundColor:
                previewBgColor,
            },
          ]}
        >
          <Ionicons
            name="cube-outline"
            size={54}
            color={
              difficultyStyle.accentColor
            }
          />

          <Text
            style={[
              styles.previewLabel,
              {
                color: previewTextColor,
              },
            ]}
          >
            {previewObjectText}
          </Text>

          <Text
            style={[
              styles.previewCategory,
              {
                color:
                  isDark
                    ? colors.black + 'CC'
                    : colors.white + 'CC',
              },
            ]}
          >
            {selectedPreviewText}
          </Text>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish
            ? 'Dificultad'
            : 'Difficulty'}
        </Text>

        <View style={styles.sliderWrapper}>
          <View
            style={[
              styles.trackBg,
              {
                backgroundColor:
                  colors.bgElevated,
              },
            ]}
          >
            <View
              style={[
                styles.trackFill,
                {
                  width: `${
                    (DIFFICULTY_OPTIONS.findIndex(
                      (option) =>
                        option.value === difficulty,
                    ) /
                      2) *
                    100
                  }%`,
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
            />

            {DIFFICULTY_OPTIONS.map(
              (
                option,
                index,
              ) => {
                const active =
                  option.value === difficulty;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.thumbHit,
                      {
                        left: `${(index / 2) * 100}%`,
                      },
                    ]}
                    onPress={() =>
                      setDifficulty(option.value)
                    }
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.thumb,
                        {
                          borderColor:
                            difficultyStyle.accentColor,
                          backgroundColor: active
                            ? difficultyStyle.accentColor
                            : colors.bgElevated,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              },
            )}
          </View>

          <View style={styles.sliderLabels}>
            {DIFFICULTY_OPTIONS.map((option) => {
              const active =
                option.value === difficulty;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.labelBtn}
                  onPress={() =>
                    setDifficulty(option.value)
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.labelText,
                      {
                        color: active
                          ? difficultyStyle.accentColor
                          : colors.textMuted,
                        fontWeight: active
                          ? '700'
                          : '500',
                      },
                    ]}
                  >
                    {getDifficultyLabel(
                      option.value,
                      isSpanish,
                    )}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish
            ? 'Objetos posibles'
            : 'Possible objects'}
        </Text>

        <View style={styles.objectList}>
          {objects.map((object) => {
            const active =
              selectedObjectIds.includes(
                object.id,
              );

            return (
              <TouchableOpacity
                key={object.id}
                style={[
                  styles.objectCard,
                  {
                    borderColor: active
                      ? difficultyStyle.accentColor
                      : colors.border,
                    backgroundColor: active
                      ? difficultyStyle.bgColor
                      : colors.bgCard,
                  },
                ]}
                onPress={() =>
                  toggleObject(object.id)
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name={
                    active
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={18}
                  color={
                    active
                      ? difficultyStyle.accentColor
                      : colors.textMuted
                  }
                />

                <View style={styles.objectTextWrap}>
                  <Text
                    style={[
                      styles.objectLabel,
                      {
                        color: active
                          ? colors.white
                          : colors.text,
                      },
                    ]}
                  >
                    {translateObjectLabel(
                      object.label,
                      isSpanish,
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.objectCategory,
                      {
                        color: active
                          ? colors.white + 'CC'
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {categoryLabel(
                      object.category,
                      isSpanish,
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            {
              backgroundColor:
                difficultyStyle.accentColor,
            },
            !canSave &&
              styles.confirmBtnDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSave}
        >
          <Text
            style={[
              styles.confirmText,
              {
                color:
                  difficultyStyle.textColor,
              },
            ]}
          >
            {confirmText}
          </Text>
        </TouchableOpacity>
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
    paddingVertical: 32,
    paddingBottom: 42,
    gap: 14,
  },

  headerPill: {
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
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  previewBox: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  previewLabel: {
    fontSize: 24,
    fontWeight: '800',
  },

  previewCategory: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  sectionLabel: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
  },

  sliderWrapper: {
    marginBottom: 4,
  },

  trackBg: {
    height: 4,
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
    fontSize: 13,
  },

  objectList: {
    gap: 10,
  },

  objectCard: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  objectTextWrap: {
    flex: 1,
    gap: 2,
  },

  objectLabel: {
    fontSize: 15,
    fontWeight: '700',
  },

  objectCategory: {
    fontSize: 12,
  },

  confirmBtn: {
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
    fontSize: 16,
    fontWeight: '700',
  },
});
