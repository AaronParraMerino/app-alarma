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

import { Colors } from '../../../shared/theme/colors';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { authService } from '../services/authService';
import { Menssage } from '../../../shared/components/ui/Menssage';


type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState(`Código verificado para ${email}.`);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('success');

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setMessageType('error');
      setMessage('Completa ambos campos.');
      return;
    }

    if (password.length < 6) {
      setMessageType('error');
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await authService.updateRecoveredPassword(password);

      setCompleted(true);
      setMessageType('success');
      setMessage('Tu contraseña fue actualizada correctamente.');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message ?? 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const cancelRecovery = async () => {
    await authService.cancelPasswordRecovery();

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={completed ? 'checkmark-circle-outline' : 'lock-closed-outline'}
              size={32}
              color={completed ? Colors.success : Colors.primaryLight}
            />
          </View>

          <Text style={styles.title}>
            {completed ? 'Contraseña actualizada' : 'Nueva contraseña'}
          </Text>

          <Text style={styles.subtitle}>
            {completed
              ? 'Ahora puedes iniciar sesión con tu nueva contraseña.'
              : 'Crea una nueva contraseña para recuperar el acceso a tu cuenta.'}
          </Text>

          <Menssage type={messageType} message={message} />

          {completed ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={goToLogin} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>Ir al inicio de sesión</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.label}>Nueva contraseña:</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
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
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirmar contraseña:</Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputInner}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={handleUpdatePassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.btnPrimaryText}>Actualizar contraseña</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={cancelRecovery} activeOpacity={0.75}>
                <Text style={styles.cancelText}>Cancelar recuperación</Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingHorizontal: 24,
    paddingTop: 82,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  inputInner: {
    flex: 1,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 13,
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
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});