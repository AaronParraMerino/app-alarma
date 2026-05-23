// src/features/auth/screens/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '../../../shared/components/ui/BackButton';
import { Menssage } from '../../../shared/components/ui/Menssage';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { authService } from '../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState(
    isSpanish ? `Codigo verificado para ${email}.` : `Code verified for ${email}.`,
  );
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('success');

  const canNavigateToLogin = () =>
    navigation.getState().routeNames.includes('Login');

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setMessageType('error');
      setMessage(isSpanish ? 'Completa ambos campos.' : 'Complete both fields.');
      return;
    }

    if (password.length < 6) {
      setMessageType('error');
      setMessage(
        isSpanish
          ? 'La contrasena debe tener al menos 6 caracteres.'
          : 'Password must have at least 6 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage(isSpanish ? 'Las contrasenas no coinciden.' : 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await authService.updateRecoveredPassword(password);

      setCompleted(true);
      setMessageType('success');
      setMessage(
        isSpanish
          ? 'Tu contrasena fue actualizada correctamente.'
          : 'Your password was updated successfully.',
      );
    } catch (error: any) {
      setMessageType('error');
      setMessage(
        error.message ??
          (isSpanish ? 'No se pudo actualizar la contrasena.' : 'Could not update password.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    if (!canNavigateToLogin()) {
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const cancelRecovery = async () => {
    await authService.cancelPasswordRecovery();

    if (!canNavigateToLogin()) {
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!completed ? <BackButton style={styles.backBtn} onPress={cancelRecovery} /> : null}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.accentGlow,
                borderColor: colors.primary + '55',
              },
            ]}
          >
            <Ionicons
              name={completed ? 'checkmark-circle-outline' : 'lock-closed-outline'}
              size={32}
              color={completed ? colors.success : colors.primaryLight}
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {completed
              ? isSpanish
                ? 'Contrasena actualizada'
                : 'Password updated'
              : isSpanish
                ? 'Nueva contrasena'
                : 'New password'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {completed
              ? isSpanish
                ? 'Ahora puedes iniciar sesion con tu nueva contrasena.'
                : 'You can now log in with your new password.'
              : isSpanish
                ? 'Crea una nueva contrasena para recuperar el acceso a tu cuenta.'
                : 'Create a new password to recover access to your account.'}
          </Text>

          <Menssage type={messageType} message={message} />

          {completed ? (
            <TouchableOpacity
              style={[
                styles.btnPrimary,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primaryDeep,
                },
              ]}
              onPress={goToLogin}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnPrimaryText, { color: colors.white }]}>
                {isSpanish ? 'Ir al inicio de sesion' : 'Go to login'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {isSpanish ? 'Nueva contrasena:' : 'New password:'}
              </Text>

              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.bgElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputInner, { color: colors.text }]}
                  placeholder="********"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {isSpanish ? 'Confirmar contrasena:' : 'Confirm password:'}
              </Text>

              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.bgElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputInner, { color: colors.text }]}
                  placeholder="********"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primaryDeep,
                  },
                  loading && styles.btnDisabled,
                ]}
                onPress={handleUpdatePassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={[styles.btnPrimaryText, { color: colors.white }]}>
                    {isSpanish ? 'Actualizar contrasena' : 'Update password'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={cancelRecovery} activeOpacity={0.75}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  {isSpanish ? 'Cancelar recuperacion' : 'Cancel recovery'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: 58,
    paddingBottom: 40,
  },
  backBtn: { marginBottom: 22 },
  card: {
    borderRadius: Layout.cardRadius,
    padding: Layout.screenPaddingWide,
    borderWidth: 1,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  label: {
    fontSize: Typography.label.fontSize,
    marginBottom: 6,
    fontWeight: Typography.label.fontWeight,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  btnPrimary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnDisabled: { opacity: 0.65 },
  btnPrimaryText: {
    fontWeight: '800',
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
