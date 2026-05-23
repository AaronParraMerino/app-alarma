import React from 'react';
import {
  ActivityIndicator,
  Modal as NativeModal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenssageType } from './Menssage';
import {
  AppThemeColors,
  useAppTheme,
} from '../../theme/useAppTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type ModalConfig = {
  icon: IconName;
  color: string;
  backgroundColor: string;
  borderColor: string;
};

type ModalAction = {
  label: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
};

type Props = {
  visible: boolean;
  type?: MenssageType;
  title: string;
  message?: string;
  confirmAction?: ModalAction;
  cancelAction?: ModalAction;
  onClose?: () => void;
  closeOnBackdropPress?: boolean;
};

function getModalConfig(
  colors: AppThemeColors,
): Record<MenssageType, ModalConfig> {
  return {
    success: {
      icon: 'checkmark-circle-outline',
      color: colors.success,
      backgroundColor: colors.successDim,
      borderColor: colors.success,
    },
    error: {
      icon: 'alert-circle-outline',
      color: colors.danger,
      backgroundColor: colors.dangerDim,
      borderColor: colors.danger,
    },
    info: {
      icon: 'information-circle-outline',
      color: colors.primaryLight,
      backgroundColor: colors.accentGlow,
      borderColor: colors.primary,
    },
    warning: {
      icon: 'warning-outline',
      color: colors.warning,
      backgroundColor: colors.warningDim,
      borderColor: colors.warning,
    },
  };
}

export function Modal({
  visible,
  type = 'info',
  title,
  message,
  confirmAction,
  cancelAction,
  onClose,
  closeOnBackdropPress = true,
}: Props) {
  const { colors, isDark } = useAppTheme();
  const config = getModalConfig(colors)[type];

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose?.();
    }
  };

  return (
    <NativeModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          {
            backgroundColor: isDark
              ? 'rgba(0, 0, 0, 0.68)'
              : 'rgba(15, 23, 42, 0.35)',
          },
        ]}
        onPress={handleBackdropPress}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: config.backgroundColor,
                borderColor: config.borderColor,
              },
            ]}
          >
            <Ionicons name={config.icon} size={26} color={config.color} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {cancelAction ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.bgElevated,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.82}
                onPress={cancelAction.onPress}
                disabled={cancelAction.disabled || cancelAction.loading}
              >
                {cancelAction.loading ? (
                  <ActivityIndicator color={colors.textSecondary} />
                ) : (
                  <Text
                    style={[
                      styles.buttonSecondaryText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {cancelAction.label}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}

            {confirmAction ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: config.color,
                    borderColor: config.borderColor,
                  },
                  confirmAction.disabled && styles.buttonDisabled,
                ]}
                activeOpacity={0.82}
                onPress={confirmAction.onPress}
                disabled={confirmAction.disabled || confirmAction.loading}
              >
                {confirmAction.loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={[styles.buttonPrimaryText, { color: colors.white }]}>
                    {confirmAction.label}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </NativeModal>
  );
}

export const AppModal = Modal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },

  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },

  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },

  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },

  buttonPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
