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
import { Colors } from '../../theme/colors';
import { MenssageType } from './Menssage';

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

const MODAL_CONFIG: Record<MenssageType, ModalConfig> = {
  success: {
    icon: 'checkmark-circle-outline',
    color: Colors.success,
    backgroundColor: Colors.successDim,
    borderColor: Colors.success,
  },
  error: {
    icon: 'alert-circle-outline',
    color: Colors.danger,
    backgroundColor: Colors.dangerDim,
    borderColor: Colors.danger,
  },
  info: {
    icon: 'information-circle-outline',
    color: Colors.primaryLight,
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.primary,
  },
  warning: {
    icon: 'warning-outline',
    color: Colors.warning,
    backgroundColor: Colors.warningDim,
    borderColor: Colors.warning,
  },
};

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
  const config = MODAL_CONFIG[type];

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
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Pressable
          style={styles.card}
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

          <Text style={styles.title}>{title}</Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            {cancelAction ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                activeOpacity={0.82}
                onPress={cancelAction.onPress}
                disabled={cancelAction.disabled || cancelAction.loading}
              >
                {cancelAction.loading ? (
                  <ActivityIndicator color={Colors.textSecondary} />
                ) : (
                  <Text style={styles.buttonSecondaryText}>{cancelAction.label}</Text>
                )}
              </TouchableOpacity>
            ) : null}

            {confirmAction ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  { backgroundColor: config.color, borderColor: config.borderColor },
                  confirmAction.disabled && styles.buttonDisabled,
                ]}
                activeOpacity={0.82}
                onPress={confirmAction.onPress}
                disabled={confirmAction.disabled || confirmAction.loading}
              >
                {confirmAction.loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonPrimaryText}>{confirmAction.label}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: Colors.textSecondary,
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
  buttonSecondary: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
  },
  buttonPrimary: {
    borderColor: Colors.primaryDeep,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonSecondaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPrimaryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
