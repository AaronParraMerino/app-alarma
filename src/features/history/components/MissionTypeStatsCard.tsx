import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { MissionTypeStat } from '../types/missionHistory.types';
import { MISSION_CONFIG } from '../constants/missionHistory.config';

interface Props {
  porTipo: MissionTypeStat[];
}

export function MissionTypeStatsCard({ porTipo }: Props) {
  const { colors } = useAppTheme();
  const conDatos = porTipo.filter((t) => t.total > 0);

  if (conDatos.length === 0) return null;

  return (
    <>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        POR TIPO DE MISIÓN
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
        {conDatos.map((t, i) => {
          const mc = MISSION_CONFIG[t.tipo];

          if (!mc) return null;

          const iconText = getMissionIconText(String(t.tipo), mc.iconName);

          return (
            <View
              key={t.tipo}
              style={[
                styles.row,
                i < conDatos.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderMuted,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: mc.bgColor }]}>
                <Text style={[styles.iconText, { color: mc.iconColor }]}>
                  {iconText}
                </Text>
              </View>

              <View style={styles.info}>
                <Text
                  style={[styles.name, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {mc.label}
                </Text>

                <Text
                  style={[styles.sub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {mc.sublabel}
                </Text>
              </View>

              <View style={styles.right}>
                <Text style={[styles.count, { color: colors.text }]}>
                  {t.total}
                </Text>

                <View style={styles.dotsRow}>
                  {t.easy > 0 && (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.success },
                      ]}
                    />
                  )}

                  {t.medium > 0 && (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.warning },
                      ]}
                    />
                  )}

                  {t.hard > 0 && (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.danger },
                      ]}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

function getMissionIconText(missionType: string, iconName?: string): string {
  const type = missionType.toLowerCase();
  const icon = String(iconName ?? '').toLowerCase();

  if (
    type.includes('math') ||
    type.includes('matematica') ||
    icon.includes('calculator') ||
    icon.includes('math')
  ) {
    return '∑';
  }

  if (
    type.includes('word') ||
    type.includes('palabra') ||
    icon.includes('text') ||
    icon.includes('format')
  ) {
    return 'Aa';
  }

  if (
    type.includes('movement') ||
    type.includes('movimiento') ||
    icon.includes('run') ||
    icon.includes('walk')
  ) {
    return '↯';
  }

  if (
    type.includes('color') ||
    type.includes('colored') ||
    type.includes('figure') ||
    type.includes('figura') ||
    icon.includes('palette') ||
    icon.includes('shape')
  ) {
    return '●';
  }

  return '◎';
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
  iconText: {
    fontSize: 18,
    fontWeight: '700',
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