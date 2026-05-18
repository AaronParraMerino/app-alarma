import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

export type MenssageType = 'success' | 'error' | 'info' | 'warning';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type MenssageConfig = {
  icon: IconName;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

type Props = {
  type?: MenssageType;
  message?: string;
  title?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
};

const MESSAGE_CONFIG: Record<MenssageType, MenssageConfig> = {
  success: {
    icon: 'checkmark-circle-outline',
    backgroundColor: Colors.successDim,
    borderColor: Colors.success,
    textColor: Colors.success,
  },
  error: {
    icon: 'alert-circle-outline',
    backgroundColor: Colors.dangerDim,
    borderColor: Colors.danger,
    textColor: Colors.danger,
  },
  info: {
    icon: 'information-circle-outline',
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.primary,
    textColor: Colors.primaryLight,
  },
  warning: {
    icon: 'warning-outline',
    backgroundColor: Colors.warningDim,
    borderColor: Colors.warning,
    textColor: Colors.warning,
  },
};

export function Menssage({
  type = 'info',
  message,
  title,
  onPress,
  style,
  textStyle,
  testID,
}: Props) {
  if (!message && !title) return null;

  const config = MESSAGE_CONFIG[type];
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={0.82}
      accessibilityRole={onPress ? 'button' : 'text'}
      onPress={onPress}
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      <Ionicons name={config.icon} size={19} color={config.textColor} />

      <View style={styles.content}>
        {title ? (
          <Text style={[styles.title, { color: config.textColor }]}>
            {title}
          </Text>
        ) : null}

        {message ? (
          <Text style={[styles.message, { color: config.textColor }, textStyle]}>
            {message}
          </Text>
        ) : null}
      </View>
    </Container>
  );
}

export const Message = Menssage;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  message: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
