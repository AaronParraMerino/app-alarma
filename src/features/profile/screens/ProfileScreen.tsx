// src/features/profile/screens/ProfileScreen.tsx
import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { Menssage } from '../../../shared/components/ui/Menssage';
import { Modal } from '../../../shared/components/ui/Modal';
import { useAuth } from '../../auth/store/authStore';
import { useProfile } from '../hooks/useProfile';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;
};

function AvatarLarge({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'U'}</Text>
        </View>
      </View>
    </View>
  );
}

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
      style={[styles.actionRow, disabled && styles.actionRowDisabled]}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={disabled}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View style={styles.actionText}>
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>

        {sublabel ? (
          <Text style={styles.actionSublabel}>{sublabel}</Text>
        ) : null}
      </View>

      {!disabled && (
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const {
    profile,
    loading,
    error,
    totalMissionsResolved,
    refetch,
  } = useProfile();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'logout' | 'delete-account' | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (!user) return null;

  const currentUser = user as any;

  const userId: string =
    currentUser.id ??
    currentUser.user_id ??
    currentUser.id_usuario ??
    currentUser.uid ??
    '';

  const email = currentUser.email ?? '';
  const displayName =
    currentUser.username ??
    currentUser.full_name ??
    currentUser.name ??
    email.split('@')[0] ??
    'Usuario';

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

  const handleOpenAlarmHistory = () => {
    if (!userId) return;

    navigation.navigate('MissionHistory', {
      userId,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={Colors.bg} barStyle="light-content" />

      <View style={styles.topBar}>
        <BackButton style={styles.backBtn} onPress={() => navigation.goBack()} />

        <Text style={styles.topBarTitle}>Mi perfil</Text>

        <View style={styles.topBarRightSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AvatarLarge name={displayName} />

          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{email}</Text>

          {loading && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={styles.profileLoader}
            />
          )}
        </View>

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
            value={totalMissionsResolved}
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
            sublabel="Ver historial de misiones realizadas"
            onPress={handleOpenAlarmHistory}
            disabled={!userId}
          />

          <View style={styles.divider} />

          <ActionRow
            icon="bar-chart-outline"
            label="Ver estadísticas completas"
            sublabel="Próximamente"
            disabled
          />
        </View>

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

        {currentUser.createdAt && (
          <Text style={styles.memberSince}>
            Miembro desde{' '}
            {new Date(currentUser.createdAt).toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={activeModal === 'logout'}
        type="warning"
        title="Cerrar sesión"
        message="Tu sesión se cerrará en este dispositivo. Podrás volver a entrar desde la pantalla de autenticación."
        onClose={closeModal}
        closeOnBackdropPress={!isLoggingOut}
        cancelAction={{
          label: 'Cancelar',
          onPress: closeModal,
          disabled: isLoggingOut,
        }}
        confirmAction={{
          label: 'Cerrar sesión',
          onPress: confirmLogout,
          loading: isLoggingOut,
        }}
      />

      <Modal
        visible={activeModal === 'delete-account'}
        type="error"
        title="Eliminar cuenta"
        message="Esta opción estará disponible cuando integremos el borrado seguro de datos."
        onClose={() => setActiveModal(null)}
        cancelAction={{
          label: 'Entendido',
          onPress: () => setActiveModal(null),
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  scroll: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingBottom: 20,
  },

  topBar: {
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
  },

  backBtn: {
    minWidth: 76,
  },

  topBarTitle: {
    fontSize: Typography.action.fontSize,
    fontWeight: Typography.action.fontWeight,
    color: Colors.text,
  },

  topBarRightSpace: {
    width: 76,
  },

  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: Layout.screenPadding,
  },

  avatarWrap: {
    marginBottom: 16,
  },

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
    textAlign: 'center',
  },

  heroEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  profileLoader: {
    marginTop: 8,
  },

  message: {
    marginHorizontal: 16,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Layout.screenPadding,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 5,
  },

  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: Typography.label.fontWeight,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
  },

  section: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderMuted,
    marginLeft: 52,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  actionRowDisabled: {
    opacity: 0.4,
  },

  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  actionText: {
    flex: 1,
  },

  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  actionSublabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },

  memberSince: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },

  bottomSpace: {
    height: 40,
  },
});