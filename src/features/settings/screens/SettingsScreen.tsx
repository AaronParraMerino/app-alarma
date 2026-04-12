// src/features/settings/screens/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';
import { useAuth } from '../../auth/store/authStore';
import { ProfileStackParamList } from '../../profile/navigation/ProfileNavigator';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;
};

// ─── Avatar con iniciales ─────────────────────────────────────────────────────

function AvatarInitials({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// ─── Fila de menú ─────────────────────────────────────────────────────────────

interface MenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress?: () => void;
  tintColor?: string;
  showChevron?: boolean;
  disabled?: boolean;
}

function MenuRow({
  icon,
  label,
  sublabel,
  onPress,
  tintColor = Colors.textSecondary,
  showChevron = true,
  disabled = false,
}: MenuRowProps) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={disabled}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: tintColor + '1A' }]}>
        <Ionicons name={icon} size={18} color={tintColor} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props) {
  const { isAuthenticated, user, exitGuest } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={Colors.bg} barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
        </View>

        {/* ── PERFIL ─────────────────────────────────────────────────────── */}

        {isAuthenticated && user ? (
          /* Tarjeta de usuario logueado */
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <AvatarInitials name={user.username || user.email} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.username}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <View style={styles.profileChevronWrap}>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          /* Banner invitado */
          <View style={styles.guestCard}>
            <Ionicons name="person-circle-outline" size={44} color={Colors.textMuted} />
            <View style={styles.guestInfo}>
              <Text style={styles.guestTitle}>Modo invitado</Text>
              <Text style={styles.guestSubtitle}>
                Inicia sesión para guardar tus alarmas y ver tu progreso
              </Text>
            </View>
            <TouchableOpacity style={styles.guestBtn} onPress={exitGuest} activeOpacity={0.85}>
              <Text style={styles.guestBtnText}>Iniciar sesión en tu cuenta</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── PREFERENCIAS ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Preferencias</Text>
        <View style={styles.section}>
          <MenuRow
            icon="notifications-outline"
            label="Notificaciones"
            sublabel="Próximamente"
            tintColor={Colors.warning}
            disabled
          />
          <View style={styles.divider} />
          <MenuRow
            icon="color-palette-outline"
            label="Apariencia"
            sublabel="Próximamente"
            tintColor={Colors.purple}
            disabled
          />
          <View style={styles.divider} />
          <MenuRow
            icon="language-outline"
            label="Idioma"
            sublabel="Español"
            tintColor={Colors.primary}
            disabled
          />
        </View>

        {/* ── INFO ───────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Información</Text>
        <View style={styles.section}>
          <MenuRow
            icon="information-circle-outline"
            label="Acerca de Neuro Wake"
            sublabel="v1.0.0"
            tintColor={Colors.textSecondary}
            showChevron={false}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 20 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },

  // Tarjeta logueado
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    backgroundColor: Colors.primary + '2A',
    borderWidth: 1.5,
    borderColor: Colors.primary + '66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  profileChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tarjeta invitado
  guestCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 12,
  },
  guestInfo: { gap: 4 },
  guestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  guestSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryDeep,
    marginTop: 4,
  },
  guestBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },

  // Secciones
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderMuted,
    marginLeft: 52,
  },

  // Fila
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 1 },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  menuSublabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});