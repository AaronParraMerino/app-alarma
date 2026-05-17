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

const MISSION_META: Record<string, { label: string; icon: IconName; color: string }> = {
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
    const difficulty = getDifficultyLabel(missions[0]?.difficulty ?? 'normal');
    const quantity = missions[0]?.quantity ?? 3;
    return `Aleatoria - ${difficulty} - ${quantity} veces`;
  }

  if (missions.length === 0) {
    return 'Personalizada o Aleatoria';
  }

  return `${missions.length} mision${missions.length === 1 ? '' : 'es'} configurada${missions.length === 1 ? '' : 's'}`;
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
  const visibleMissions = missionEnabled ? missions.slice(0, MAX_MISSIONS) : [];
  const selectedCount = visibleMissions.length;

  const handleToggle = () => {
    onToggleMissionEnabled(!missionEnabled);
  };

  return (
    <View style={styles.panel}>
      <TouchableOpacity
        style={styles.enableRow}
        onPress={handleToggle}
        activeOpacity={0.85}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: missionEnabled }}
      >
        <Ionicons
          name={missionEnabled ? 'checkbox-outline' : 'square-outline'}
          size={23}
          color={missionEnabled ? Colors.primaryLight : Colors.textSecondary}
        />
        <Text style={styles.enableText}>Habilitar misiones</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Selecciona tus misiones:</Text>
          <Text style={styles.subtitle}>
            {getSubtitle(visibleMissions, missionEnabled, randomMissions)}
          </Text>
        </View>
        <Text style={styles.counter}>{selectedCount}/{MAX_MISSIONS}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slots}
      >
        {Array.from({ length: MAX_MISSIONS }).map((_, index) => {
          const mission = visibleMissions[index];

          if (mission) {
            const meta = randomMissions || mission.type === 'random'
              ? RANDOM_META
              : MISSION_META[mission.type] ?? {
                  label: 'Mision configurada',
                  icon: 'apps-outline' as IconName,
                  color: Colors.primaryLight,
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
                <Ionicons name={meta.icon} size={24} color={meta.color} />
                <Text style={styles.selectedLabel} numberOfLines={2}>
                  {meta.label}
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={event => {
                    event.stopPropagation();
                    onClearMission(index);
                  }}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar mision"
                >
                  <Ionicons name="close-outline" size={18} color={Colors.text} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={`empty-${index}`}
              style={[
                styles.emptySlot,
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
                color={missionEnabled ? Colors.text : Colors.textMuted}
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
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
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
    color: Colors.text,
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
    color: Colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  counter: {
    color: Colors.textSecondary,
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
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.bgElevated,
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
    color: Colors.text,
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
    backgroundColor: Colors.bg + 'D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
