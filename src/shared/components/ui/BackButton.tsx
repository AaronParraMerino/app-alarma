import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../theme/typography';
import { useAppTheme } from '../../theme/useAppTheme';

type BackButtonProps = {
  label?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function BackButton({
  label = 'Volver',
  onPress,
  style,
  textStyle,
}: BackButtonProps) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="chevron-back" size={22} color={colors.text} />

      <Text style={[styles.text, { color: colors.text }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    minHeight: 40,
  },

  text: {
    fontSize: Typography.action.fontSize,
    fontWeight: '600',
  },
});

