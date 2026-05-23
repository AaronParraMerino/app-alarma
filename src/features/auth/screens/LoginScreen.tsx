// src/features/auth/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { Modal } from '../../../shared/components/ui/Modal';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, statusBarStyle } = useAppTheme();
  const { t, language } = useTranslation();

  const isSpanish = language === 'es';

  const {
    login,
    loginAsGuest,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [validationMessage, setValidationMessage] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setValidationMessage({
        title: isSpanish ? 'Campos requeridos' : 'Required fields',
        message: isSpanish
          ? 'Ingresa tu correo y contraseña para iniciar sesión.'
          : 'Enter your email and password to log in.',
      });

      return;
    }

    await login(email.trim(), password.trim());
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.tabRow,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.tab,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: colors.white,
                },
              ]}
            >
              {t('auth.login')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {t('auth.register')}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {t('auth.login')}
          </Text>

          <Text
            style={[
              styles.label,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {t('auth.email')}:
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bgElevated,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={
              isSpanish
                ? 'tucorreo@ejemplo.com'
                : 'youremail@example.com'
            }
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text
            style={[
              styles.label,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {t('auth.password')}:
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
              style={[
                styles.inputInner,
                {
                  color: colors.text,
                },
              ]}
              placeholder="••••••••"
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

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.forgotText,
                {
                  color: colors.textAccent,
                },
              ]}
            >
              {isSpanish
                ? '¿Olvidaste tu contraseña?'
                : 'Forgot your password?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnPrimary,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDeep,
              },
              isLoading && {
                opacity: 0.6,
              },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text
                style={[
                  styles.btnPrimaryText,
                  {
                    color: colors.white,
                  },
                ]}
              >
                {t('auth.login')}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: colors.border,
                },
              ]}
            />

            <Text
              style={[
                styles.dividerText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {isSpanish ? 'o' : 'or'}
            </Text>

            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: colors.border,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.socialLabel,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {isSpanish
              ? 'Inicia sesión con tu cuenta de'
              : 'Log in with your account from'}
          </Text>

          <TouchableOpacity
            style={[
              styles.btnGoogle,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primaryDeep,
              },
              isLoading && {
                opacity: 0.6,
              },
            ]}
            onPress={loginWithGoogle}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.btnGoogleIcon,
                {
                  color: colors.white,
                },
              ]}
            >
              G
            </Text>

            <Text
              style={[
                styles.btnGoogleText,
                {
                  color: colors.white,
                },
              ]}
            >
              Google
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.btnGuest,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
          onPress={loginAsGuest}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.btnGuestText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {t('auth.continueWithoutAccount')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={Boolean(validationMessage)}
        type="warning"
        title={validationMessage?.title ?? ''}
        message={validationMessage?.message}
        onClose={() => setValidationMessage(null)}
        cancelAction={{
          label: isSpanish ? 'Entendido' : 'Got it',
          onPress: () => setValidationMessage(null),
        }}
      />

      <Modal
        visible={Boolean(error)}
        type="error"
        title={
          isSpanish
            ? 'No pudimos iniciar sesión'
            : 'We could not log you in'
        }
        message={error ?? ''}
        onClose={clearError}
        cancelAction={{
          label: isSpanish ? 'Entendido' : 'Got it',
          onPress: clearError,
        }}
      />
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
    paddingTop: 64,
    paddingBottom: 40,
  },

  tabRow: {
    flexDirection: 'row',
    borderRadius: Layout.controlRadius,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },

  card: {
    borderRadius: Layout.cardRadius,
    padding: Layout.screenPaddingWide,
    borderWidth: 1,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  label: {
    fontSize: Typography.label.fontSize,
    marginBottom: 6,
    fontWeight: Typography.label.fontWeight,
  },

  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
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

  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 16,
  },

  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },

  btnPrimary: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
  },

  btnPrimaryText: {
    fontWeight: '700',
    fontSize: 15,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
  },

  socialLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },

  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
  },

  btnGoogleIcon: {
    fontSize: 16,
    fontWeight: '800',
  },

  btnGoogleText: {
    fontWeight: '600',
    fontSize: 15,
  },

  btnGuest: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },

  btnGuestText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
