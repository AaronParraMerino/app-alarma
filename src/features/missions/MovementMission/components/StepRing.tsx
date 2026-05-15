import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface StepRingProps {
  progress: number;
  color: string;
  icon: string;
  size?: number;
}

// Muestra el avance del paso actual con icono y porcentaje.
export function StepRing({ progress, color, icon, size = 140 }: StepRingProps) {
  const animProgress = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(progress, 1));
  const percent = Math.round(clamped * 100);

  useEffect(() => {
    // Suaviza los cambios de progreso del sensor.
    Animated.timing(animProgress, {
      toValue: clamped,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animProgress, clamped]);

  const progressWidth = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { width: size }]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
          style={[styles.icon, { color }]}
        >
          {icon}
        </Text>
        <Text style={[styles.percent, { color }]}>{percent}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: progressWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  circle: {
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
    paddingHorizontal: 16,
  },
  icon: {
    width: '100%',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  percent: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  track: {
    marginTop: 16,
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
