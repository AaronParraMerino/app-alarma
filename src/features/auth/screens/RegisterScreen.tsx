import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Colors } from '../../../shared/theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register, loginAsGuest, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);         // ← nuevo
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ← nuevo

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    await register(email.trim(), password.trim(), username.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.tabRow}>
          <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.tabText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          <View style={[styles.tab, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Regístrate</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Regístrate</Text>

          {error && (
            <TouchableOpacity onPress={clearError} style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
            value={username}
            onChangeText={setUsername}
          />

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

          <Text style={styles.label}>Repite la contraseña:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputInner}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(p => !p)}
              style={styles.eyeBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnPrimaryText}>Regístrate</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.socialLabel}>Regístrate con tu cuenta de</Text>
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
  errorBox: {
    backgroundColor: Colors.danger + '22', borderRadius: 8,
    padding: 10, marginBottom: 14, borderWidth: 1, borderColor: Colors.danger + '44',
  },
  errorText: { color: Colors.danger, fontSize: 13, textAlign: 'center' },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: Colors.bgElevated, color: Colors.text,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
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
});