import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Colors } from '../../../shared/theme/colors';
import { Modal } from '../../../shared/components/ui/Modal';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, loginAsGuest, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationMessage, setValidationMessage] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false); // ← nuevo

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setValidationMessage({
        title: 'Campos requeridos',
        message: 'Ingresa tu correo y contrasena para iniciar sesion.',
      });
      return;
    }
    await login(email.trim(), password.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.tabRow}>
          <View style={[styles.tab, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Iniciar Sesión</Text>
          </View>
          <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.tabText}>Regístrate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>

          <Text style={styles.label}>Correo electrónico:</Text>
          <TextInput
            style={styles.input}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña:</Text>
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
              onPress={() => setShowPassword(p => !p)}
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

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.75}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnPrimaryText}>Iniciar Sesión</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.socialLabel}>Inicia Sesión con tu cuenta de</Text>
          <TouchableOpacity
            style={[styles.btnGoogle, isLoading && { opacity: 0.6 }]}
            onPress={loginWithGoogle}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnGoogleIcon}>G</Text>
            <Text style={styles.btnGoogleText}>Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.btnGuest}
          onPress={loginAsGuest}
          activeOpacity={0.85}
        >
          <Text style={styles.btnGuestText}>Continuar sin cuenta</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        visible={Boolean(validationMessage)}
        type="warning"
        title={validationMessage?.title ?? ''}
        message={validationMessage?.message}
        onClose={() => setValidationMessage(null)}
        cancelAction={{
          label: 'Entendido',
          onPress: () => setValidationMessage(null),
        }}
      />

      <Modal
        visible={Boolean(error)}
        type="error"
        title="No pudimos iniciar sesion"
        message={error ?? ''}
        onClose={clearError}
        cancelAction={{
          label: 'Entendido',
          onPress: clearError,
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.bgCard,
    borderRadius: 10, padding: 4, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: 24, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22, fontWeight: '800', color: Colors.text,
    marginBottom: 20, textAlign: 'center', letterSpacing: -0.3,
  },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: Colors.bgElevated, color: Colors.text,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  // Contenedor input con ojo
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  inputInner: {
    flex: 1, color: Colors.text, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 15,
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 13 },
  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
    marginTop: 4, borderWidth: 1, borderColor: Colors.primaryDeep,
  },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, marginHorizontal: 12, fontSize: 13 },
  socialLabel: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 10 },
  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 12, borderWidth: 1, borderColor: Colors.primaryDeep,
  },
  btnGoogleIcon: { fontSize: 16, fontWeight: '800', color: Colors.white },
  btnGoogleText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  btnGuest: {
    backgroundColor: Colors.bgCard, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginTop: 4,
  },
  btnGuestText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 16,
  },
  forgotText: {
    color: Colors.textAccent,
    fontSize: 13,
    fontWeight: '700',
  },
});
