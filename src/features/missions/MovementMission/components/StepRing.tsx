import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface StepRingProps {
  progress: number; // 0–1
  color: string;
  icon: string;
  size?: number;
}

/**
 * Circular progress ring without react-native-svg.
 * Safe for testing without rebuilding native Android.
 */
export function StepRing({ progress, color, icon, size = 140 }: StepRingProps) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: Math.max(0, Math.min(progress, 1)),
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, animProgress]);

  const percent = Math.round(Math.max(0, Math.min(progress, 1)) * 100);

  const progressWidth = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
        },
      ]}
    >
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
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.percent, { color }]}>{percent}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressWidth,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  icon: {
    fontSize: 44,
  },
  percent: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
  },
  track: {
    marginTop: 16,
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});