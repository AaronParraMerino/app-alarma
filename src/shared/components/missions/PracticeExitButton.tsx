import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import { BackButton } from '../ui/BackButton';
import { useTranslation } from '../../i18n/useTranslation';

type Props = {
  onPress: () => void;
};

export function PracticeExitButton({ onPress }: Props) {
  const { language } = useTranslation();
  const isSpanish = language === 'es';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
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
