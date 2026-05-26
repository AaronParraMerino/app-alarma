// src/features/auth/screens/ForgotPasswordScreen.tsx
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
import { authService } from '../services/authService';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessageType('error');
      setMessage(isSpanish ? 'Ingresa tu correo electronico.' : 'Enter your email.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await authService.sendPasswordRecoveryCode(email);

      setMessageType('success');
      setMessage(
        isSpanish
          ? 'Te enviamos un codigo de recuperacion. Revisa tu correo o spam.'
          : 'We sent you a recovery code. Check your inbox or spam folder.',
      );

      setTimeout(() => {
        navigation.navigate('VerifyRecoveryCode', {
          email: email.trim().toLowerCase(),
        });
      }, 700);
    } catch (error: any) {
      setMessageType('error');
      setMessage(
        error.message ??
          (isSpanish
            ? 'No se pudo enviar el codigo. Intentalo nuevamente.'
            : 'Could not send the code. Try again.'),
      );
    } finally {
      setLoading(false);
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
            <Ionicons name="mail-outline" size={30} color={colors.primaryLight} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {isSpanish ? 'Recuperar contraseña' : 'Recover password'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSpanish
              ? 'Escribe el correo de tu cuenta y te enviaremos un codigo para cambiar tu contrasena.'
              : 'Enter your account email and we will send you a code to change your password.'}
          </Text>

          <Menssage type={messageType} message={message} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {isSpanish ? 'Correo electronico:' : 'Email:'}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
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
            onPress={handleSendCode}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.btnPrimaryText, { color: colors.white }]}>
                {isSpanish ? 'Enviar codigo' : 'Send code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: 58,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 22,
  },
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
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
  },
  btnPrimary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnPrimaryText: {
    fontWeight: '800',
    fontSize: 15,
  },
});
