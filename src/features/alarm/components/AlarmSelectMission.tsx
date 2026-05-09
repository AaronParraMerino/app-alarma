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
import { MissionType } from '../types/alarm.types';

export type AlarmMissionSelection = 'random' | 'math' | 'wordCompletion';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type MissionOption = {
  id: string;
  label: string;
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
    label: 'Aleatorio',
    icon: 'shuffle-outline',
    value: 'random',
    missionType: 'random',
    enabled: true,
  },
  {
    id: 'math',
    label: 'Pruebas Matematicas',
    icon: 'calculator-outline',
    value: 'math',
    missionType: 'math',
    enabled: true,
  },
  {
    id: 'trivia',
    label: 'Preguntas Cultura General',
    icon: 'help-circle-outline',
    missionType: 'trivia',
    enabled: false,
  },
  {
    id: 'color',
    label: 'Encontrar patrones de Color',
    icon: 'color-palette-outline',
    missionType: 'color',
    enabled: false,
  },
  {
    id: 'photo',
    label: 'Detectar Objetos',
    icon: 'scan-outline',
    missionType: 'photo',
    enabled: false,
  },
  {
    id: 'memory',
    label: 'Encontrar pares',
    icon: 'albums-outline',
    missionType: 'memory',
    enabled: false,
  },
  {
    id: 'steps',
    label: 'Contar Pasos',
    icon: 'footsteps-outline',
    missionType: 'physical',
    enabled: false,
  },
  {
    id: 'shake',
    label: 'Agita tu Telefono',
    icon: 'phone-portrait-outline',
    missionType: 'physical',
    enabled: false,
  },
  {
    id: 'wordCompletion',
    label: 'Completa palabras',
    icon: 'text-outline',
    value: 'wordCompletion',
    missionType: 'wordCompletion',
    enabled: true,
  },
];

function getOptionTint(option: MissionOption) {
  if (option.id === 'random') return Colors.primaryLight;
  if (!option.missionType) return Colors.textMuted;
  return Colors.missionColors[option.missionType] ?? Colors.primaryLight;
}

export default function AlarmSelectMission({ onBack, onSelectMission }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Mision</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onBack}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector de mision"
        >
          <Ionicons name="close-outline" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {MISSION_OPTIONS.map(option => {
          const tint = getOptionTint(option);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                option.enabled && styles.optionEnabled,
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
                color={option.enabled ? tint : Colors.textMuted}
                style={styles.optionIcon}
              />
              <Text
                style={[
                  styles.optionText,
                  !option.enabled && styles.optionTextDisabled,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
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
    backgroundColor: Colors.bg,
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
    color: Colors.text,
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
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionEnabled: {
    borderColor: Colors.borderFocus + '22',
  },
  optionDisabled: {
    opacity: 0.52,
  },
  optionIcon: {
    width: 30,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  optionTextDisabled: {
    color: Colors.textSecondary,
  },
});
