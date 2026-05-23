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
import {
  AppThemeColors,
  useAppTheme,
} from '../../theme/useAppTheme';

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

function getMessageConfig(
  colors: AppThemeColors,
): Record<MenssageType, MenssageConfig> {
  return {
    success: {
      icon: 'checkmark-circle-outline',
      backgroundColor: colors.successDim,
      borderColor: colors.success,
      textColor: colors.success,
    },
    error: {
      icon: 'alert-circle-outline',
      backgroundColor: colors.dangerDim,
      borderColor: colors.danger,
      textColor: colors.danger,
    },
    info: {
      icon: 'information-circle-outline',
      backgroundColor: colors.accentGlow,
      borderColor: colors.primary,
      textColor: colors.primaryLight,
    },
    warning: {
      icon: 'warning-outline',
      backgroundColor: colors.warningDim,
      borderColor: colors.warning,
      textColor: colors.warning,
    },
  };
}

export function Menssage({
  type = 'info',
  message,
  title,
  onPress,
  style,
  textStyle,
  testID,
}: Props) {
  const { colors } = useAppTheme();

  if (!message && !title) return null;

  const config = getMessageConfig(colors)[type];

  const content = (
    <>
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
    </>
  );

  const containerStyle = [
    styles.container,
    {
      backgroundColor: config.backgroundColor,
      borderColor: config.borderColor,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        accessibilityRole="button"
        onPress={onPress}
        testID={testID}
        style={containerStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View accessibilityRole="text" testID={testID} style={containerStyle}>
      {content}
    </View>
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
