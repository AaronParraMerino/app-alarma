import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../../shared/theme/colors';

interface Props {
  name: string;
  source: ImageSourcePropType | null;
  revealed: boolean;
  mismatched?: boolean;
  fixed?: boolean;
  accentColor: string;
  textColor: string;
  size: number;
  onPress: () => void;
}

// Renderiza una carta con frente y reverso
export function PairCardTile({
  name,
  source,
  revealed,
  mismatched,
  fixed,
  accentColor,
  textColor,
  size,
  onPress,
}: Props) {
  const flipAnim = useRef(new Animated.Value(revealed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: revealed ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [flipAnim, revealed]);

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (fixed) {
    return (
      <View
        style={[
          styles.card,
          styles.fixedCard,
          {
            width: size,
            height: size,
            borderColor: accentColor + '35',
          },
        ]}
      >
        <View style={[styles.fixedLine, { backgroundColor: accentColor + '30' }]} />
        <Text style={[styles.fixedMark, { color: accentColor + '70' }]}>X</Text>
        <View style={[styles.fixedLine, { backgroundColor: accentColor + '30' }]} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: size,
          height: size,
          borderColor: mismatched
            ? Colors.white
            : revealed
              ? accentColor + '70'
              : Colors.border,
          borderWidth: mismatched ? 2 : 1,
        },
        mismatched && styles.mismatchCard,
      ]}
      onPress={onPress}
      activeOpacity={0.84}
      disabled={revealed}
    >
      <Animated.View
        style={[
          styles.face,
          styles.backFace,
          {
            transform: [{ perspective: 700 }, { rotateY: backRotate }],
          },
        ]}
      >
        <View style={styles.back}>
          <View style={[styles.backLine, { backgroundColor: accentColor + '55' }]} />
          <View style={[styles.backLineShort, { backgroundColor: accentColor + '40' }]} />
          <Text style={[styles.backMark, { color: accentColor }]}>?</Text>
          <View style={[styles.backLineShort, { backgroundColor: accentColor + '40' }]} />
          <View style={[styles.backLine, { backgroundColor: accentColor + '55' }]} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.face,
          styles.frontFace,
          {
            backgroundColor: accentColor,
            transform: [
              { perspective: 700 },
              { rotateY: frontRotate },
              ...(mismatched ? [{ scale: 0.94 }] : []),
            ],
          },
        ]}
      >
        {source ? (
          <View style={styles.front}>
            {mismatched ? (
              <View style={styles.mismatchX}>
                <View style={[styles.mismatchXLine, styles.mismatchXLineOne]} />
                <View style={[styles.mismatchXLine, styles.mismatchXLineTwo]} />
              </View>
            ) : null}
            <Image source={source} style={styles.image} resizeMode="contain" fadeDuration={0} />
            <Text numberOfLines={1} style={[styles.name, { color: textColor }]}>
              {name}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.bgElevated,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  backFace: {
    backgroundColor: Colors.bgElevated,
  },
  frontFace: {
    backfaceVisibility: 'hidden',
  },
  fixedCard: {
    backgroundColor: Colors.bgCardActive,
    borderStyle: 'dashed',
    opacity: 0.82,
  },
  mismatchCard: {
    shadowColor: Colors.white,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  front: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
  },
  mismatchX: {
    position: 'absolute',
    width: '118%',
    height: '118%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  mismatchXLine: {
    position: 'absolute',
    width: '118%',
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  mismatchXLineOne: {
    transform: [{ rotate: '45deg' }],
  },
  mismatchXLineTwo: {
    transform: [{ rotate: '-45deg' }],
  },
  image: {
    width: '76%',
    height: '66%',
  },
  name: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  back: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  backLine: {
    width: '82%',
    height: 3,
    borderRadius: 2,
  },
  backLineShort: {
    width: '58%',
    height: 3,
    borderRadius: 2,
  },
  backMark: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  fixedLine: {
    width: '54%',
    height: 3,
    borderRadius: 2,
  },
  fixedMark: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
});
