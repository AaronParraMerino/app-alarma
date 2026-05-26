// src/features/alarm/components/AlarmSelectMission.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../../shared/theme/colors';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { MissionType } from '../types/alarm.types';

export type AlarmMissionSelection =
  | 'random'
  | 'math'
  | 'wordCompletion'
  | 'physical'
  | 'color'
  | 'colorFind'
  | 'photo'
  | 'trivia';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type MissionOption = {
  id: string;
  labelEs: string;
  labelEn: string;
  icon: IconName;
  value?: AlarmMissionSelection;
  missionType?: MissionType;
  enabled: boolean;
};

type Props = {
  onBack: () => void;
  onSelectMission: (mission: AlarmMissionSelection) => void;
};

const MISSION_OPTIONS: MissionOption[] = [
  {
    id: 'random',
    labelEs: 'Aleatorio',
    labelEn: 'Random',
    icon: 'shuffle-outline',
    value: 'random',
    missionType: 'random',
    enabled: true,
  },

  {
    id: 'math',
    labelEs: 'Pruebas Matemáticas',
    labelEn: 'Math tests',
    icon: 'calculator-outline',
    value: 'math',
    missionType: 'math',
    enabled: true,
  },

  {
    id: 'trivia',
    labelEs: 'Preguntas cultura general',
    labelEn: 'General knowledge questions',
    icon: 'help-circle-outline',
    value: 'trivia',
    missionType: 'trivia',
    enabled: true,
  },

  {
    id: 'color',
    labelEs: 'Figuras y colores',
    labelEn: 'Shapes and colors',
    icon: 'color-palette-outline',
    value: 'color',
    missionType: 'color',
    enabled: true,
  },

  {
    id: 'photo',
    labelEs: 'Detectar objetos',
    labelEn: 'Detect objects',
    icon: 'scan-outline',
    value: 'photo',
    missionType: 'photo',
    enabled: true,
  },

  {
    id: 'memory',
    labelEs: 'Encontrar pares',
    labelEn: 'Find pairs',
    icon: 'albums-outline',
    missionType: 'memory',
    enabled: false,
  },

  {
    id: 'movement',
    labelEs: 'Misión de movimiento',
    labelEn: 'Movement mission',
    icon: 'footsteps-outline',
    value: 'physical',
    missionType: 'physical',
    enabled: true,
  },

  {
    id: 'colorFind',
    labelEs: 'Encuentra el color diferente',
    labelEn: 'Find the different color',
    icon: 'grid-outline',
    value: 'colorFind',
    missionType: 'colorFind',
    enabled: true,
  },

  {
    id: 'wordCompletion',
    labelEs: 'Completa palabras',
    labelEn: 'Complete words',
    icon: 'text-outline',
    value: 'wordCompletion',
    missionType: 'wordCompletion',
    enabled: true,
  },
];

function getOptionTint(option: MissionOption) {
  if (option.id === 'random') {
    return Colors.primaryLight;
  }

  if (!option.missionType) {
    return Colors.textMuted;
  }

  return (
    Colors.missionColors[option.missionType] ??
    Colors.primaryLight
  );
}

function getOptionLabel(
  option: MissionOption,
  isSpanish: boolean,
): string {
  return isSpanish
    ? option.labelEs
    : option.labelEn;
}

export default function AlarmSelectMission({
  onBack,
  onSelectMission,
}: Props) {
  const {
    colors,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerSpacer} />

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish ? 'Misión' : 'Mission'}
        </Text>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onBack}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={
            isSpanish
              ? 'Cerrar selector de misión'
              : 'Close mission selector'
          }
        >
          <Ionicons
            name="close-outline"
            size={28}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {MISSION_OPTIONS.map((option) => {
          const tint = getOptionTint(option);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: option.enabled
                    ? colors.borderFocus + '22'
                    : colors.border,
                },
                !option.enabled && styles.optionDisabled,
              ]}
              activeOpacity={option.enabled ? 0.84 : 1}
              onPress={() => {
                if (option.enabled && option.value) {
                  onSelectMission(option.value);
                }
              }}
              accessibilityRole="button"
              disabled={!option.enabled}
            >
              <Ionicons
                name={option.icon}
                size={27}
                color={
                  option.enabled
                    ? tint
                    : colors.textMuted
                }
                style={styles.optionIcon}
              />

              <View style={styles.optionTextWrap}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: option.enabled
                        ? colors.text
                        : colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {getOptionLabel(
                    option,
                    isSpanish,
                  )}
                </Text>

                {!option.enabled ? (
                  <Text
                    style={[
                      styles.comingSoonText,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {isSpanish
                      ? 'Próximamente'
                      : 'Coming soon'}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
  },

  header: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  headerSpacer: {
    width: 38,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: {
    gap: 10,
    paddingBottom: 24,
  },

  option: {
    minHeight: 46,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  optionDisabled: {
    opacity: 0.52,
  },

  optionIcon: {
    width: 30,
    textAlign: 'center',
  },

  optionTextWrap: {
    flex: 1,
  },

  optionText: {
    fontSize: 13,
    fontWeight: '900',
  },

  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
