import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Colors } from '../../../shared/theme/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, loginAsGuest, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa email y contraseña');
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

        {/* Tab selector */}
        <View style={styles.tabRow}>
          <View style={[styles.tab, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Iniciar Sesión</Text>
          </View>
          <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.tabText}>Regístrate</Text>
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>

          {error && (
            <TouchableOpacity onPress={clearError} style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </TouchableOpacity>
          )}

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
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

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

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <Text style={styles.socialLabel}>Inicia Sesión con tu cuenta de</Text>
          <TouchableOpacity
            style={styles.btnGoogle}
            onPress={() => Alert.alert('Google', 'Próximamente')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnGoogleIcon}>G</Text>
            <Text style={styles.btnGoogleText}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Continuar sin cuenta — fuera de la card */}
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.white,
  },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Error
  errorBox: {
    backgroundColor: Colors.danger + '22',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.danger + '44',
  },
  errorText: { color: Colors.danger, fontSize: 13, textAlign: 'center' },

  // Inputs
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.bgElevated,
    color: Colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Botón principal
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    color: Colors.textMuted,
    marginHorizontal: 12,
    fontSize: 13,
  },

  // Google
  socialLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
  },
  btnGoogleIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  btnGoogleText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },

  // Guest
  btnGuest: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  btnGuestText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});