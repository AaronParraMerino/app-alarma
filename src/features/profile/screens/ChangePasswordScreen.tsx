import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '../../../shared/components/ui/BackButton';
import { Menssage } from '../../../shared/components/ui/Menssage';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import {
  changePasswordWithCurrentPassword,
  sendPasswordResetEmail,
} from '../../../shared/services/auth/accountSecurity.service';
import { useAuth } from '../../auth/store/authStore';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ChangePassword'>;
};

export default function ChangePasswordScreen({ navigation }: Props) {
  const { colors, statusBarStyle } = useAppTheme();
  const { language } = useTranslation();
  const { user } = useAuth();
  const isSpanish = language === 'es';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const email = user?.email ?? '';

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessageType('error');
      setMessage(
        isSpanish
          ? 'Completa tu contrasena actual y la nueva contrasena.'
          : 'Complete your current password and the new password.',
      );
      return;
    }

    if (newPassword.length < 6) {
      setMessageType('error');
      setMessage(
        isSpanish
          ? 'La nueva contrasena debe tener al menos 6 caracteres.'
          : 'The new password must have at least 6 characters.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage(
        isSpanish
          ? 'Las nuevas contrasenas no coinciden.'
          : 'The new passwords do not match.',
      );
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await changePasswordWithCurrentPassword({
        email,
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessageType('success');
      setMessage(
        isSpanish
          ? 'Contrasena actualizada correctamente.'
          : 'Password updated successfully.',
      );
    } catch (error) {
      setMessageType('error');
      setMessage(
        error instanceof Error
          ? error.message
          : isSpanish
            ? 'No se pudo cambiar la contrasena.'
            : 'Could not change the password.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setRecovering(true);
      setMessage('');

      await sendPasswordResetEmail(email);

      setMessageType('success');
      setMessage(
        isSpanish
          ? 'Enviamos el codigo de recuperacion a tu correo.'
          : 'We sent the recovery code to your email.',
      );

      navigation.navigate('VerifyRecoveryCode', { email });
    } catch (error) {
      setMessageType('error');
      setMessage(
        error instanceof Error
          ? error.message
          : isSpanish
            ? 'No se pudo iniciar la recuperacion.'
            : 'Could not start recovery.',
      );
      setRecovering(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={styles.topBar}>
        <BackButton
          label={isSpanish ? 'Volver' : 'Back'}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />

        <Text style={[styles.topTitle, { color: colors.text }]}>
          {isSpanish ? 'Contrasena' : 'Password'}
        </Text>

        <View style={styles.topSpace} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.primary + '1A' },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
              </View>

              <View style={styles.cardTitleWrap}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {isSpanish ? 'Cambiar contrasena' : 'Change password'}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  {isSpanish
                    ? 'Confirma tu contrasena actual antes de guardar una nueva.'
                    : 'Confirm your current password before saving a new one.'}
                </Text>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {isSpanish ? 'Contrasena actual' : 'Current password'}
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={isSpanish ? 'Tu contrasena actual' : 'Your current password'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {isSpanish ? 'Nueva contrasena' : 'New password'}
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={isSpanish ? 'Nueva contrasena' : 'New password'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {isSpanish ? 'Confirmar nueva contrasena' : 'Confirm new password'}
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={isSpanish ? 'Repite la nueva contrasena' : 'Repeat the new password'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Menssage type={messageType} message={message} />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primaryDeep,
                },
                saving && styles.disabled,
              ]}
              onPress={handleChangePassword}
              disabled={saving || recovering}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                  {isSpanish ? 'Guardar contrasena' : 'Save password'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.recoveryRow,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
              recovering && styles.disabled,
            ]}
            onPress={handleForgotPassword}
            disabled={saving || recovering}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.warning + '1A' },
              ]}
            >
              <Ionicons name="key-outline" size={20} color={colors.warning} />
            </View>

            <View style={styles.recoveryText}>
              <Text style={[styles.recoveryTitle, { color: colors.text }]}>
                {isSpanish ? 'No recuerdo mi contrasena' : 'I forgot my password'}
              </Text>
              <Text style={[styles.recoverySubtitle, { color: colors.textMuted }]}>
                {isSpanish
                  ? 'Enviar codigo y escribirlo aqui mismo.'
                  : 'Send a code and enter it here.'}
              </Text>
            </View>

            {recovering ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  topBar: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
  },
  backBtn: {
    minWidth: 76,
  },
  topTitle: {
    fontSize: Typography.action.fontSize,
    fontWeight: Typography.action.fontWeight,
  },
  topSpace: {
    width: 76,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 32,
  },
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  label: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  recoveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 14,
  },
  recoveryText: {
    flex: 1,
  },
  recoveryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recoverySubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.65,
  },
});
