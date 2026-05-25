// src/features/history/components/MissionTypeStatsCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../../shared/theme/colors';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

import { MissionTypeStat } from '../types/missionHistory.types';
import { MISSION_CONFIG } from '../constants/missionHistory.config';

interface Props {
  porTipo: MissionTypeStat[];
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type MissionIconMeta = {
  icon: IconName;
  color: string;
};

const MISSION_ICON_META: Record<string, MissionIconMeta> = {
  random: {
    icon: 'shuffle-outline',
    color: Colors.missionColors.random ?? Colors.primaryLight,
  },

  math: {
    icon: 'calculator-outline',
    color: Colors.missionColors.math ?? Colors.primaryLight,
  },

  memory: {
    icon: 'albums-outline',
    color: Colors.missionColors.memory ?? Colors.primaryLight,
  },

  physical: {
    icon: 'footsteps-outline',
    color: Colors.missionColors.physical ?? Colors.primaryLight,
  },

  movement: {
    icon: 'footsteps-outline',
    color: Colors.missionColors.physical ?? Colors.primaryLight,
  },

  photo: {
    icon: 'scan-outline',
    color: Colors.missionColors.photo ?? Colors.primaryLight,
  },

  object: {
    icon: 'scan-outline',
    color: Colors.missionColors.photo ?? Colors.primaryLight,
  },

  trivia: {
    icon: 'help-circle-outline',
    color: Colors.missionColors.trivia ?? Colors.primaryLight,
  },

  writing: {
    icon: 'create-outline',
    color: Colors.missionColors.writing ?? Colors.primaryLight,
  },

  color: {
    icon: 'color-palette-outline',
    color: Colors.missionColors.color ?? Colors.primaryLight,
  },

  colorFind: {
    icon: 'grid-outline',
    color: Colors.missionColors.colorFind ?? Colors.primaryLight,
  },

  shapes: {
    icon: 'grid-outline',
    color: Colors.missionColors.shapes ?? Colors.primaryLight,
  },

  sequence: {
    icon: 'keypad-outline',
    color: Colors.missionColors.sequence ?? Colors.primaryLight,
  },

  wordCompletion: {
    icon: 'text-outline',
    color: Colors.missionColors.wordCompletion ?? Colors.primaryLight,
  },
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getMissionIconMeta(
  missionType: string,
  iconName?: string,
): MissionIconMeta {
  const type = normalizeText(missionType);
  const icon = normalizeText(String(iconName ?? ''));

  if (
    type.includes('random') ||
    type.includes('aleatorio') ||
    icon.includes('shuffle')
  ) {
    return MISSION_ICON_META.random;
  }

  if (
    type.includes('math') ||
    type.includes('matematica') ||
    icon.includes('calculator')
  ) {
    return MISSION_ICON_META.math;
  }

  if (
    type.includes('word') ||
    type.includes('palabra') ||
    type.includes('completion') ||
    icon.includes('text')
  ) {
    return MISSION_ICON_META.wordCompletion;
  }

  if (
    type.includes('movement') ||
    type.includes('physical') ||
    type.includes('movimiento') ||
    icon.includes('footsteps')
  ) {
    return MISSION_ICON_META.physical;
  }

  if (
    type.includes('colorfind') ||
    type.includes('color_find') ||
    type.includes('different') ||
    type.includes('diferente') ||
    icon.includes('grid')
  ) {
    return MISSION_ICON_META.colorFind;
  }

  if (
    type.includes('color') ||
    type.includes('colored') ||
    type.includes('figure') ||
    type.includes('figura') ||
    icon.includes('palette')
  ) {
    return MISSION_ICON_META.color;
  }

  if (
    type.includes('photo') ||
    type.includes('object') ||
    type.includes('objeto') ||
    icon.includes('scan')
  ) {
    return MISSION_ICON_META.photo;
  }

  if (
    type.includes('memory') ||
    type.includes('memoria') ||
    icon.includes('albums')
  ) {
    return MISSION_ICON_META.memory;
  }

  if (
    type.includes('trivia') ||
    type.includes('pregunta') ||
    icon.includes('help')
  ) {
    return MISSION_ICON_META.trivia;
  }

  if (
    type.includes('writing') ||
    type.includes('escritura') ||
    icon.includes('create')
  ) {
    return MISSION_ICON_META.writing;
  }

  if (
    type.includes('sequence') ||
    type.includes('secuencia') ||
    icon.includes('keypad')
  ) {
    return MISSION_ICON_META.sequence;
  }

  return {
    icon: 'apps-outline',
    color: Colors.primaryLight,
  };
}

function getMissionLabel(
  missionType: string,
  label: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return label;
  }

  const type = normalizeText(missionType);
  const normalizedLabel = normalizeText(label);

  if (
    type.includes('math') ||
    type.includes('matematica') ||
    normalizedLabel.includes('matematica')
  ) {
    return 'Math mission';
  }

  if (
    type.includes('word') ||
    type.includes('palabra') ||
    normalizedLabel.includes('palabra')
  ) {
    return 'Word mission';
  }

  if (
    type.includes('movement') ||
    type.includes('physical') ||
    type.includes('movimiento') ||
    normalizedLabel.includes('movimiento')
  ) {
    return 'Movement mission';
  }

  if (
    type.includes('color') ||
    type.includes('colored') ||
    type.includes('figure') ||
    type.includes('figura') ||
    normalizedLabel.includes('color')
  ) {
    return 'Color mission';
  }

  if (
    type.includes('photo') ||
    type.includes('object') ||
    normalizedLabel.includes('objeto')
  ) {
    return 'Object mission';
  }

  if (
    type.includes('random') ||
    normalizedLabel.includes('aleatorio')
  ) {
    return 'Random mission';
  }

  return 'Mission';
}

function getMissionSublabel(
  missionType: string,
  sublabel: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return sublabel;
  }

  const type = normalizeText(missionType);
  const normalizedSublabel = normalizeText(sublabel);

  if (
    type.includes('math') ||
    normalizedSublabel.includes('matematica') ||
    normalizedSublabel.includes('operacion')
  ) {
    return 'Solve operations';
  }

  if (
    type.includes('word') ||
    normalizedSublabel.includes('palabra')
  ) {
    return 'Complete words';
  }

  if (
    type.includes('movement') ||
    type.includes('physical') ||
    normalizedSublabel.includes('movimiento')
  ) {
    return 'Movement challenge';
  }

  if (
    type.includes('color') ||
    type.includes('figure') ||
    normalizedSublabel.includes('color') ||
    normalizedSublabel.includes('figura')
  ) {
    return 'Colors and shapes';
  }

  if (
    type.includes('photo') ||
    type.includes('object') ||
    normalizedSublabel.includes('objeto')
  ) {
    return 'Object detection';
  }

  if (
    type.includes('random') ||
    normalizedSublabel.includes('aleatorio')
  ) {
    return 'Random challenge';
  }

  if (
    normalizedSublabel.includes('sin descripcion') ||
    normalizedSublabel.includes('descripcion')
  ) {
    return 'No description';
  }

  return sublabel;
}

export function MissionTypeStatsCard({
  porTipo,
}: Props) {
  const {
    colors,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';

  const conDatos = porTipo.filter((tipo) => tipo.total > 0);

  if (conDatos.length === 0) {
    return null;
  }

  return (
    <>
      <Text
        style={[
          styles.sectionLabel,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {isSpanish
          ? 'POR TIPO DE MISIÓN'
          : 'BY MISSION TYPE'}
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        {conDatos.map((tipo, index) => {
          const missionConfig = MISSION_CONFIG[tipo.tipo];

          if (!missionConfig) {
            return null;
          }

          const iconMeta = getMissionIconMeta(
            String(tipo.tipo),
            missionConfig.iconName,
          );

          return (
            <View
              key={tipo.tipo}
              style={[
                styles.row,
                index < conDatos.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderMuted,
                },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: iconMeta.color + '18',
                  },
                ]}
              >
                <Ionicons
                  name={iconMeta.icon}
                  size={24}
                  color={iconMeta.color}
                />
              </View>

              <View style={styles.info}>
                <Text
                  style={[
                    styles.name,
                    {
                      color: colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {getMissionLabel(
                    String(tipo.tipo),
                    missionConfig.label,
                    isSpanish,
                  )}
                </Text>

                <Text
                  style={[
                    styles.sub,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {getMissionSublabel(
                    String(tipo.tipo),
                    missionConfig.sublabel,
                    isSpanish,
                  )}
                </Text>
              </View>

              <View style={styles.right}>
                <Text
                  style={[
                    styles.count,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {tipo.total}
                </Text>

                <View style={styles.dotsRow}>
                  {tipo.easy > 0 ? (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: colors.success,
                        },
                      ]}
                    />
                  ) : null}

                  {tipo.medium > 0 ? (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: colors.warning,
                        },
                      ]}
                    />
                  ) : null}

                  {tipo.hard > 0 ? (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: colors.danger,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingBottom: 7,
    letterSpacing: 0.7,
    fontWeight: '700',
  },

  card: {
    minHeight: 64,
    marginHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    justifyContent: 'center',
  },

  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 14,
    fontWeight: '700',
  },

  sub: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },

  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  count: {
    fontSize: 14,
    fontWeight: '700',
  },

  dotsRow: {
    flexDirection: 'row',
    marginTop: 5,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 3,
  },
});