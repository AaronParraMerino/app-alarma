import React from 'react';
import {
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import { BackButton } from '../ui/BackButton';
import { useTranslation } from '../../i18n/useTranslation';

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PracticeExitButton({ onPress, style }: Props) {
  const { language } = useTranslation();
  const isSpanish = language === 'es';

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      <BackButton
        label={isSpanish ? 'Salir' : 'Exit'}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 42,
    left: 16,
    zIndex: 20,
  },
});
