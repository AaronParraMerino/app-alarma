import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SensorBarProps {
  magnitude: number;
  maxMagnitude?: number;
  color: string;
  trackColor: string;
}

// Barra animada que muestra la fuerza actual del sensor.
export function SensorBar({
  magnitude,
  maxMagnitude = 30,
  color,
  trackColor,
}: SensorBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Convierte la magnitud en un porcentaje visual.
    const ratio = Math.min(magnitude / maxMagnitude, 1);
    Animated.spring(widthAnim, {
      toValue: ratio,
      useNativeDriver: false,
      speed: 40,
      bounciness: 0,
    }).start();
  }, [magnitude]);

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
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
