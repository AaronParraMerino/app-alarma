import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  remaining: number;
  total: number;
  color: string;
}

// Muestra las oportunidades restantes del tablero
export function OpportunityBar({ remaining, total, color }: Props) {
  const ratio = Math.max(0, Math.min(1, remaining / total));

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${ratio * 100}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
