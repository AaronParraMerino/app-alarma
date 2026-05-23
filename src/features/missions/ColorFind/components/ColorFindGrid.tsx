import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type DimensionValue,
} from 'react-native';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { ColorFindChallenge } from '../types/colorFind.types';

interface ColorFindGridProps {
  challenge: ColorFindChallenge;
  accentColor: string;
  onTilePress?: (tileId: string) => void;
  revealOdd?: boolean;
  compact?: boolean;
}

export function ColorFindGrid({
  challenge,
  accentColor,
  onTilePress,
  revealOdd = false,
  compact = false,
}: ColorFindGridProps) {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const gridSize = challenge.gridSize;
  const maxSize = compact ? 176 : Math.min(width - 48, 344);
  const tileGap = compact ? 4 : gridSize >= 4 ? 6 : 8;

  return (
    <View
      style={[
        styles.grid,
        {
          width: maxSize,
          height: maxSize,
          padding: tileGap,
          backgroundColor: colors.bgElevated,
          borderColor: colors.border,
        },
      ]}
    >
      {challenge.tiles.map(tile => {
        const tileSize = `${100 / gridSize}%` as DimensionValue;
        const content = (
          <View
            style={[
              styles.tile,
              {
                backgroundColor: tile.color,
                borderRadius: gridSize >= 4 ? 10 : 12,
                borderColor: colors.white + '24',
              },
              revealOdd && tile.isOdd && {
                borderColor: accentColor,
                borderWidth: 3,
              },
            ]}
          >
            {revealOdd && tile.isOdd ? (
              <View style={[styles.marker, { backgroundColor: accentColor }]}>
                <Text style={[styles.markerText, { color: colors.bg }]}>
                  {isSpanish ? 'Aqui' : 'Here'}
                </Text>
              </View>
            ) : null}
          </View>
        );

        return (
          <View
            key={tile.id}
            style={[
              styles.tileSlot,
              {
                width: tileSize,
                height: tileSize,
                padding: tileGap / 2,
              },
            ]}
          >
            {onTilePress ? (
              <TouchableOpacity
                style={styles.tileButton}
                onPress={() => onTilePress(tile.id)}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={
                  tile.isOdd
                    ? isSpanish
                      ? 'Color diferente'
                      : 'Different color'
                    : isSpanish
                      ? 'Color similar'
                      : 'Similar color'
                }
              >
                {content}
              </TouchableOpacity>
            ) : (
              content
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 18,
    borderWidth: 1,
  },
  tileSlot: {
    minWidth: 0,
  },
  tileButton: {
    flex: 1,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  marker: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markerText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
