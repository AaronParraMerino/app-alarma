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

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { authService } from '../services/authService';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { Menssage } from '../../../shared/components/ui/Menssage';


type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyRecoveryCode'>;

export default function VerifyRecoveryCodeScreen({ navigation, route }: Props) {
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState(`Escribe el código que enviamos a ${email}.`);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleVerifyCode = async () => {
    const cleanCode = code.replace(/\D/g, '');

    if (!cleanCode) {
    setMessageType('error');
    setMessage('Ingresa el código de recuperación.');
    return;
    }

    if (cleanCode.length < 6 || cleanCode.length > 10) {
    setMessageType('error');
    setMessage('Ingresa el código completo que recibiste en tu correo.');
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
          'El código no es válido o expiró. Solicita uno nuevo.',
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
      setMessage('Te enviamos un nuevo código de recuperación.');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message ?? 'No se pudo reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <BackButton
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        />

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="keypad-outline" size={30} color={Colors.primaryLight} />
          </View>

          <Text style={styles.title}>Código de recuperación</Text>

          <Text style={styles.subtitle}>
            Copia el código completo que recibiste en tu correo.
          </Text>

          <Menssage type={messageType} message={message} />

          <Text style={styles.label}>Código:</Text>

            <TextInput
            style={styles.codeInput}
            placeholder="00000000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
            />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleVerifyCode}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnPrimaryText}>Verificar código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResendCode}
            disabled={resending}
            activeOpacity={0.75}
          >
            {resending ? (
              <ActivityIndicator color={Colors.primaryLight} />
            ) : (
              <Text style={styles.resendText}>Reenviar código</Text>
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
    backgroundColor: Colors.bg,
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
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.cardRadius,
    padding: Layout.screenPaddingWide,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
  },
  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  label: {
    fontSize: Typography.label.fontSize,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: Typography.label.fontWeight,
  },
  codeInput: {
    backgroundColor: Colors.bgElevated,
    color: Colors.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  resendBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: Colors.textAccent,
    fontSize: 14,
    fontWeight: '700',
  },
});
