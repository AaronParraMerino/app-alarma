// src/features/auth/screens/VerifyRecoveryCodeScreen.tsx
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

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyRecoveryCode'>;

export default function VerifyRecoveryCodeScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(
    isSpanish ? `Escribe el codigo que enviamos a ${email}.` : `Enter the code we sent to ${email}.`,
  );
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleVerifyCode = async () => {
    const cleanCode = code.replace(/\D/g, '');

    if (!cleanCode) {
      setMessageType('error');
      setMessage(isSpanish ? 'Ingresa el codigo de recuperacion.' : 'Enter the recovery code.');
      return;
    }

    if (cleanCode.length < 6 || cleanCode.length > 10) {
      setMessageType('error');
      setMessage(
        isSpanish
          ? 'Ingresa el codigo completo que recibiste en tu correo.'
          : 'Enter the full code you received in your email.',
      );
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await authService.verifyPasswordRecoveryCode(email, code);
      navigation.navigate('ResetPassword', { email });
    } catch (error: any) {
      setMessageType('error');
      setMessage(
        error.message ??
          (isSpanish
            ? 'El codigo no es valido o expiro. Solicita uno nuevo.'
            : 'The code is invalid or expired. Request a new one.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResending(true);
      setMessage('');

      await authService.sendPasswordRecoveryCode(email);

      setMessageType('success');
      setMessage(isSpanish ? 'Te enviamos un nuevo codigo.' : 'We sent you a new code.');
    } catch (error: any) {
      setMessageType('error');
      setMessage(
        error.message ??
          (isSpanish ? 'No se pudo reenviar el codigo.' : 'Could not resend the code.'),
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <BackButton style={styles.backBtn} onPress={() => navigation.goBack()} />

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
            <Ionicons name="keypad-outline" size={30} color={colors.primaryLight} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {isSpanish ? 'Codigo de recuperacion' : 'Recovery code'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSpanish
              ? 'Copia el codigo completo que recibiste en tu correo.'
              : 'Copy the full code you received in your email.'}
          </Text>

          <Menssage type={messageType} message={message} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {isSpanish ? 'Codigo:' : 'Code:'}
          </Text>

          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="00000000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
          />

          <TouchableOpacity
            style={[
              styles.btnPrimary,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDeep,
              },
              loading && styles.btnDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.btnPrimaryText, { color: colors.white }]}>
                {isSpanish ? 'Verificar codigo' : 'Verify code'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResendCode}
            disabled={resending}
            activeOpacity={0.75}
          >
            {resending ? (
              <ActivityIndicator color={colors.primaryLight} />
            ) : (
              <Text style={[styles.resendText, { color: colors.textAccent }]}>
                {isSpanish ? 'Reenviar codigo' : 'Resend code'}
              </Text>
            )}
          </TouchableOpacity>
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
    width: 62,
    height: 62,
    borderRadius: 31,
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
  codeInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 1,
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
  resendBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
