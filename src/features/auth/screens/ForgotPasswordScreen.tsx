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

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { authService } from '../services/authService';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { Menssage } from '../../../shared/components/ui/Menssage';


type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessageType('error');
      setMessage('Ingresa tu correo electrónico.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await authService.sendPasswordRecoveryCode(email);

      setMessageType('success');
      setMessage('Te enviamos un código de recuperación. Revisa tu correo o spam.');

      setTimeout(() => {
        navigation.navigate('VerifyRecoveryCode', {
          email: email.trim().toLowerCase(),
        });
      }, 700);
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message ?? 'No se pudo enviar el código. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
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
            <Ionicons name="mail-outline" size={30} color={Colors.primaryLight} />
          </View>

          <Text style={styles.title}>Recuperar contraseña</Text>

          <Text style={styles.subtitle}>
            Escribe el correo de tu cuenta y te enviaremos un código para cambiar tu contraseña.
          </Text>

          <Menssage type={messageType} message={message} />

          <Text style={styles.label}>Correo electrónico:</Text>

          <TextInput
            style={styles.input}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSendCode}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnPrimaryText}>Enviar código</Text>
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
  input: {
    backgroundColor: Colors.bgElevated,
    color: Colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
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
});
