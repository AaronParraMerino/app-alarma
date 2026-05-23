// src/features/alarm/components/AlarmChooseMission.tsx
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
import { AlarmMission } from '../types/alarm.types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  missions: AlarmMission[];
  missionEnabled: boolean;
  randomMissions: boolean;
  onToggleMissionEnabled: (enabled: boolean) => void;
  onOpenSelect: () => void;
  onEditMission: (index: number) => void;
  onClearMission: (index?: number) => void;
};

const MAX_MISSIONS = 5;

const MISSION_META: Record<
  string,
  {
    label: string;
    icon: IconName;
    color: string;
  }
> = {
  random: {
    label: 'Aleatorio',
    icon: 'shuffle-outline',
    color: Colors.missionColors.random ?? Colors.primaryLight,
  },
  math: {
    label: 'Pruebas Matematicas',
    icon: 'calculator-outline',
    color: Colors.missionColors.math,
  },
  wordCompletion: {
    label: 'Completa palabras',
    icon: 'text-outline',
    color: Colors.missionColors.wordCompletion ?? Colors.primaryLight,
  },
  physical: {
    label: 'Movimiento',
    icon: 'footsteps-outline',
    color: Colors.missionColors.physical ?? Colors.primaryLight,
  },
  color: {
    label: 'Figuras y colores',
    icon: 'color-palette-outline',
    color: Colors.missionColors.color ?? Colors.primaryLight,
  },
  colorFind: {
    label: 'Color diferente',
    icon: 'grid-outline',
    color: Colors.missionColors.colorFind ?? Colors.primaryLight,
  },
  photo: {
    label: 'Detectar Objetos',
    icon: 'scan-outline',
    color: Colors.missionColors.photo ?? Colors.primaryLight,
  },
};

const RANDOM_META = {
  label: 'Aleatorio',
  icon: 'shuffle-outline' as IconName,
  color: Colors.primaryLight,
};

function getDifficultyLabel(difficulty: AlarmMission['difficulty']) {
  if (difficulty === 'easy') return 'Facil';
  if (difficulty === 'hard') return 'Dificil';

  return 'Normal';
}

function getSubtitle(
  missions: AlarmMission[],
  missionEnabled: boolean,
  randomMissions: boolean,
) {
  if (!missionEnabled) {
    return 'Alarma normal sin mision';
  }

  if (randomMissions) {
    const difficulty = getDifficultyLabel(
      missions[0]?.difficulty ?? 'normal',
    );

    const quantity = missions[0]?.quantity ?? 3;

    return `Aleatoria - ${difficulty} - ${quantity} veces`;
  }

  if (missions.length === 0) {
    return 'Personalizada o Aleatoria';
  }

  return `${missions.length} mision${
    missions.length === 1 ? '' : 'es'
  } configurada${missions.length === 1 ? '' : 's'}`;
}

export default function AlarmChooseMission({
  missions,
  missionEnabled,
  randomMissions,
  onToggleMissionEnabled,
  onOpenSelect,
  onEditMission,
  onClearMission,
}: Props) {
  const { colors } = useAppTheme();

  const visibleMissions = missionEnabled
    ? missions.slice(0, MAX_MISSIONS)
    : [];

  const selectedCount = visibleMissions.length;

  const handleToggle = () => {
    onToggleMissionEnabled(!missionEnabled);
  };

  return (
    <View
      style={[
        styles.panel,
        {
          borderColor: colors.border,
          backgroundColor: colors.bgCard,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.enableRow}
        onPress={handleToggle}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: missionEnabled,
        }}
      >
        <Ionicons
          name={missionEnabled ? 'checkbox-outline' : 'square-outline'}
          size={23}
          color={
            missionEnabled
              ? colors.primary
              : colors.textSecondary
          }
        />

        <Text
          style={[
            styles.enableText,
            {
              color: colors.text,
            },
          ]}
        >
          Habilitar misiones
        </Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Selecciona tus misiones:
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {getSubtitle(
              visibleMissions,
              missionEnabled,
              randomMissions,
            )}
          </Text>
        </View>

        <Text
          style={[
            styles.counter,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {selectedCount}/{MAX_MISSIONS}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slots}
      >
        {Array.from({ length: MAX_MISSIONS }).map((_, index) => {
          const mission = visibleMissions[index];

          if (mission) {
            const meta =
              randomMissions || mission.type === 'random'
                ? RANDOM_META
                : MISSION_META[mission.type] ?? {
                    label: 'Mision configurada',
                    icon: 'apps-outline' as IconName,
                    color: colors.primary,
                  };

            return (
              <TouchableOpacity
                key={`selected-${index}`}
                style={[
                  styles.selectedSlot,
                  {
                    borderColor: meta.color + '88',
                    backgroundColor: meta.color + '18',
                  },
                ]}
                activeOpacity={0.84}
                onPress={() => onEditMission(index)}
                accessibilityRole="button"
              >
                <Ionicons
                  name={meta.icon}
                  size={24}
                  color={meta.color}
                />

                <Text
                  style={[
                    styles.selectedLabel,
                    {
                      color: colors.text,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {meta.label}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.clearButton,
                    {
                      backgroundColor: colors.bg + 'D9',
                    },
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    onClearMission(index);
                  }}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar mision"
                >
                  <Ionicons
                    name="close-outline"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={`empty-${index}`}
              style={[
                styles.emptySlot,
                {
                  borderColor: colors.textSecondary,
                  backgroundColor: colors.bgElevated,
                },
                !missionEnabled && styles.slotDisabled,
              ]}
              onPress={missionEnabled ? onOpenSelect : undefined}
              activeOpacity={missionEnabled ? 0.84 : 1}
              accessibilityRole="button"
              accessibilityLabel="Agregar mision"
              disabled={!missionEnabled}
            >
              <Ionicons
                name="add-outline"
                size={30}
                color={
                  missionEnabled
                    ? colors.text
                    : colors.textMuted
                }
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },

  enableRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },

  enableText: {
    fontSize: 12,
    fontWeight: '800',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },

  headerCopy: {
    flex: 1,
    gap: 3,
  },

  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  counter: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },

  slots: {
    gap: 10,
    paddingRight: 2,
    paddingTop: 2,
  },

  emptySlot: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  slotDisabled: {
    opacity: 0.42,
  },

  selectedSlot: {
    width: 116,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  selectedLabel: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    fontWeight: '900',
  },

  clearButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
