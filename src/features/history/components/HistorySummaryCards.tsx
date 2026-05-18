import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HistorySummary } from '../types/missionHistory.types';

interface Props {
  resumen: HistorySummary;
}

export function HistorySummaryCards({ resumen }: Props) {
  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.val}>{resumen.completadas}</Text>
        <Text style={styles.lbl}>Completadas</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.val, styles.failedVal]}>
          {resumen.fallidas}
        </Text>
        <Text style={styles.lbl}>Fallidas</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.val, styles.successRateVal]}>
          {resumen.tasaExito}%
        </Text>
        <Text style={styles.lbl}>Tasa éxito</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    minHeight: 64,
    backgroundColor: '#12161F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  val: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F0F2F7',
    lineHeight: 20,
    textAlign: 'center',
  },
  failedVal: {
    color: '#f97316',
  },
  successRateVal: {
    color: '#4ab8f5',
  },
  lbl: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A93B2',
    marginTop: 4,
    textAlign: 'center',
  },
});