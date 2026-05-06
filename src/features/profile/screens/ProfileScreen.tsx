// src/features/profile/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';
import { Menssage } from '../../../shared/components/ui/Menssage';
import { Modal } from '../../../shared/components/ui/Modal';
import { useAuth } from '../../auth/store/authStore';
import { useProfile } from '../hooks/useProfile';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;
};

// ─── Avatar grande ────────────────────────────────────────────────────────────

function AvatarLarge({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tarjeta de estadística ───────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + '33' }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Fila de acción ───────────────────────────────────────────────────────────

function ActionRow({
  icon,
  label,
  onPress,
  color = Colors.text,
  sublabel,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  color?: string;
  sublabel?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={disabled}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
        {sublabel ? <Text style={styles.actionSublabel}>{sublabel}</Text> : null}
      </View>
      {!disabled && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { profile, loading, error, refetch } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeModal, setActiveModal] = useState<'logout' | 'delete-account' | null>(null);

  const handleLogout = () => {
    setActiveModal('logout');
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const closeModal = () => {
    if (!isLoggingOut) {
      setActiveModal(null);
    }
  };

  const handleDeleteAccount = () => {
    setActiveModal('delete-account');
  };

  if (!user) return null;

  const displayName = user.username || user.email.split('@')[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={Colors.bg} barStyle="light-content" />

      {/* Cabecera con botón de regreso */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Mi perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO DEL PERFIL ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <AvatarLarge name={displayName} />
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>

          {loading && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
          )}
        </View>

        {/* ── ESTADÍSTICAS ────────────────────────────────────────────────── */}
        {error ? (
          <Menssage
            type="error"
            title="No pudimos cargar tu perfil"
            message={error}
            onPress={refetch}
            style={styles.message}
          />
        ) : null}

        <Text style={styles.sectionLabel}>Estadísticas</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="alarm-outline"
            value={profile?.total_alarms_completed ?? 0}
            label="Alarmas"
            color={Colors.primary}
          />
          <StatCard
            icon="trophy-outline"
            value={profile?.total_missions_completed ?? 0}
            label="Misiones"
            color={Colors.warning}
          />
          <StatCard
            icon="flame-outline"
            value={profile?.streak_days ?? 0}
            label="Racha"
            color={Colors.danger}
          />
        </View>

        {/* ── CUENTA ──────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Cuenta</Text>
        <View style={styles.section}>
          <ActionRow
            icon="create-outline"
            label="Editar perfil"
            sublabel="Próximamente"
            disabled
          />
          <View style={styles.divider} />
          <ActionRow
            icon="time-outline"
            label="Historial de alarmas"
            sublabel="Próximamente"
            disabled
          />
          <View style={styles.divider} />
          <ActionRow
            icon="bar-chart-outline"
            label="Ver estadísticas completas"
            sublabel="Próximamente"
            disabled
          />
        </View>

        {/* ── ZONA PELIGROSA ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Sesión</Text>
        <View style={styles.section}>
          <ActionRow
            icon="log-out-outline"
            label={isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            color={Colors.warning}
            onPress={handleLogout}
            disabled={isLoggingOut}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="trash-outline"
            label="Eliminar cuenta"
            color={Colors.danger}
            onPress={handleDeleteAccount}
          />
        </View>

        {/* Miembro desde */}
        {user.createdAt && (
          <Text style={styles.memberSince}>
            Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={activeModal === 'logout'}
        type="warning"
        title="Cerrar sesion"
        message="Tu sesion se cerrara en este dispositivo. Podras volver a entrar desde la pantalla de autenticacion."
        onClose={closeModal}
        closeOnBackdropPress={!isLoggingOut}
        cancelAction={{
          label: 'Cancelar',
          onPress: closeModal,
          disabled: isLoggingOut,
        }}
        confirmAction={{
          label: 'Cerrar sesion',
          onPress: confirmLogout,
          loading: isLoggingOut,
        }}
      />

      <Modal
        visible={activeModal === 'delete-account'}
        type="error"
        title="Eliminar cuenta"
        message="Esta opcion estara disponible cuando integremos el borrado seguro de datos."
        onClose={() => setActiveModal(null)}
        cancelAction={{
          label: 'Entendido',
          onPress: () => setActiveModal(null),
        }}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 20 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarWrap: { marginBottom: 16 },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    backgroundColor: Colors.bgCard,
    borderWidth: 2,
    borderColor: Colors.primary + '66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.primary + '2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  message: {
    marginHorizontal: 16,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
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

  // Filas de acción
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1, gap: 1 },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionSublabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  memberSince: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
