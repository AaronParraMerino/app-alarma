import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../../../shared/theme/colors';

interface StepRingProps {
  progress: number;
  color: string;
  imageSource: ImageSourcePropType;
  size?: number;
}

// Muestra el avance del paso actual con imagen y porcentaje.
export function StepRing({ progress, color, imageSource, size = 140 }: StepRingProps) {
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
        <View style={styles.content}>
          <Image
            source={imageSource}
            style={[
              styles.image,
              {
                width: size * 0.62,
                height: size * 0.62,
              },
            ]}
            resizeMode="contain"
          />
          <Text style={[styles.percent, { color }]}>{percent}%</Text>
        </View>
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
    backgroundColor: Colors.bgCard,
    padding: 10,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    opacity: 0.95,
    marginTop: -4,
  },
  percent: {
    marginTop: -2,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  track: {
    marginTop: 16,
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
