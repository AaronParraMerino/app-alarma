import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  remaining: number;
  total: number;
  color: string;
  trackColor: string;
}

export function OpportunityBar({
  remaining,
  total,
  color,
  trackColor,
}: Props) {
  const ratio =
    Math.max(
      0,
      Math.min(
        1,
        remaining / total,
      ),
    );

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: trackColor,
        },
      ]}
    >
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
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },

  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
