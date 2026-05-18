// src/features/history/components/MissionHistoryCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';

import { MissionHistoryRecord } from '../types/missionHistory.types';
import {
  MISSION_CONFIG,
  DIFFICULTY_CONFIG,
  formatFecha,
  formatContenido,
} from '../constants/missionHistory.config';

interface Props {
  item: MissionHistoryRecord;
}

const DEFAULT_DIFFICULTY_CONFIG = {
  label: 'Sin nivel',
  color: Colors.textSecondary,
  bg: Colors.bgElevated,
  barColor: Colors.textMuted,
};

export function MissionHistoryCard({ item }: Props) {
  const mc = MISSION_CONFIG[item.mission_type];

  const dc = item.difficulty
    ? DIFFICULTY_CONFIG[item.difficulty]
    : DEFAULT_DIFFICULTY_CONFIG;

  const iconBg = item.success ? mc.bgColor : Colors.dangerDim;
  const iconColor = item.success ? mc.iconColor : Colors.danger;
  const detalle = formatContenido(item.mission_type, item.content);
  const iconText = getMissionIconText(item.mission_type, mc.iconName);

  return (
    <View style={[styles.card, !item.success && styles.cardFailed]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Text style={[styles.iconText, { color: iconColor }]}>
          {iconText}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {mc.label}
        </Text>

        {!!detalle && (
          <Text style={styles.detalle} numberOfLines={1}>
            {detalle}
          </Text>
        )}

        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: dc.bg }]}>
            <Text style={[styles.badgeText, { color: dc.color }]}>
              {dc.label}
            </Text>
          </View>

          <Text
            style={[
              styles.estado,
              item.success ? styles.estadoOk : styles.estadoFail,
            ]}
            numberOfLines={1}
          >
            {item.success ? 'completada' : 'fallida'}
          </Text>

          {item.error_count > 0 && (
            <Text style={styles.errores} numberOfLines={1}>
              {item.error_count} error{item.error_count > 1 ? 'es' : ''}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.fecha} numberOfLines={1}>
          {formatFecha(item.created_at)}
        </Text>

        {item.duration_seconds != null && (
          <Text style={styles.duracion} numberOfLines={1}>
            {item.duration_seconds}s
          </Text>
        )}

        {item.user_answer != null && (
          <View style={styles.respuestaRow}>
            <Text style={styles.respuestaLabel}>R: </Text>

            <Text
              style={[
                styles.respuesta,
                item.success ? styles.estadoOk : styles.estadoFail,
              ]}
              numberOfLines={1}
            >
              {String(item.user_answer)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getMissionIconText(missionType: string, iconName?: string): string {
  const type = String(missionType).toLowerCase();
  const icon = String(iconName ?? '').toLowerCase();

  if (
    type.includes('math') ||
    type.includes('matematica') ||
    icon.includes('calculator')
  ) {
    return 'Σ';
  }

  if (
    type.includes('word') ||
    type.includes('palabra') ||
    icon.includes('pencil') ||
    icon.includes('text')
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
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: Layout.screenPadding,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardFailed: {
    opacity: 0.78,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  iconText: {
    fontSize: 22,
    fontWeight: '800',
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    color: Colors.text,
  },

  detalle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 7,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  estado: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 7,
  },

  estadoOk: {
    color: Colors.textSecondary,
  },

  estadoFail: {
    color: Colors.danger,
  },

  errores: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 10,
    maxWidth: 92,
  },

  fecha: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  duracion: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },

  respuestaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    maxWidth: 92,
  },

  respuestaLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  respuesta: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
});