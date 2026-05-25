// src/features/profile/screens/ProfileScreen.tsx
import React, {
  useCallback,
  useState,
} from 'react';
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

import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { Menssage } from '../../../shared/components/ui/Menssage';
import { Modal } from '../../../shared/components/ui/Modal';
import { deleteCurrentAccountData } from '../../../shared/services/profile/profile.service';

import { useAuth } from '../../auth/store/authStore';
import { useProfile } from '../hooks/useProfile';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';

type Props = {
  navigation: NativeStackNavigationProp<
    ProfileStackParamList,
    'Profile'
  >;
};

function AvatarLarge({
  name,
}: {
  name: string;
}) {
  const { colors } = useAppTheme();

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarWrap}>
      <View
        style={[
          styles.avatarRing,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.primary + '66',
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.primary + '2A',
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              {
                color: colors.primary,
              },
            ]}
          >
            {initials || 'U'}
          </Text>
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
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.bgCard,
          borderColor: color + '33',
        },
      ]}
    >
      <View
        style={[
          styles.statIconWrap,
          {
            backgroundColor: color + '1A',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={color}
        />
      </View>

      <Text
        style={[
          styles.statValue,
          {
            color: colors.text,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.statLabel,
          {
            color: colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  color,
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
  const { colors } = useAppTheme();
  const rowColor = color ?? colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.actionRow,
        disabled && styles.actionRowDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={disabled}
    >
      <View
        style={[
          styles.actionIconWrap,
          {
            backgroundColor: rowColor + '18',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={rowColor}
        />
      </View>

      <View style={styles.actionText}>
        <Text
          style={[
            styles.actionLabel,
            {
              color: rowColor,
            },
          ]}
        >
          {label}
        </Text>

        {sublabel ? (
          <Text
            style={[
              styles.actionSublabel,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>

      {!disabled ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({
  navigation,
}: Props) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';

  const {
    user,
    logout,
  } = useAuth();

  const {
    profile,
    loading,
    error,
    totalMissionsResolved,
    refetch,
  } = useProfile();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [activeModal, setActiveModal] =
    useState<'logout' | 'delete-account' | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (!user) {
    return null;
  }

  const currentUser = user as any;

  const userId: string =
    currentUser.id ??
    currentUser.user_id ??
    currentUser.id_usuario ??
    currentUser.uid ??
    '';

  const email = currentUser.email ?? '';

  const displayName =
    profile?.username ??
    currentUser.username ??
    currentUser.full_name ??
    currentUser.name ??
    email.split('@')[0] ??
    (isSpanish ? 'Usuario' : 'User');

  const handleLogout = () => {
    setActiveModal('logout');
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const closeModal = () => {
    if (!isLoggingOut && !isDeletingAccount) {
      setActiveModal(null);
    }
  };

  const handleDeleteAccount = () => {
    setActiveModal('delete-account');
  };

  const confirmDeleteAccount = async () => {
    if (!userId) {
      return;
    }

    try {
      setIsDeletingAccount(true);
      await deleteCurrentAccountData(userId);
      await logout();
    } catch (deleteError) {
      console.log('[Profile] No se pudo eliminar la cuenta:', deleteError);
      setIsDeletingAccount(false);
      setActiveModal(null);
    }
  };

  const handleOpenMissionHistory = () => {
    if (!userId) {
      return;
    }

    navigation.navigate('MissionHistory', {
      userId,
    });
  };

  const handleOpenAlarmHistory = () => {
    if (!userId) {
      return;
    }

    navigation.navigate('AlarmHistory', {
      userId,
    });
  };

  const createdAtText = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(
        isSpanish ? 'es-ES' : 'en-US',
        {
          month: 'long',
          year: 'numeric',
        },
      )
    : null;

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.bg,
        },
      ]}
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <View style={styles.topBar}>
        <BackButton
          label={isSpanish ? 'Volver' : 'Back'}
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        />

        <Text
          style={[
            styles.topBarTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {isSpanish ? 'Mi perfil' : 'My profile'}
        </Text>

        <View style={styles.topBarRightSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AvatarLarge name={displayName} />

          <Text
            style={[
              styles.heroName,
              {
                color: colors.text,
              },
            ]}
          >
            {displayName}
          </Text>

          <Text
            style={[
              styles.heroEmail,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {email}
          </Text>

          {profile?.bio ? (
            <Text
              style={[
                styles.heroBio,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {profile.bio}
            </Text>
          ) : null}

          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.profileLoader}
            />
          ) : null}
        </View>

        {error ? (
          <Menssage
            type="error"
            title={
              isSpanish
                ? 'No pudimos cargar tu perfil'
                : 'We could not load your profile'
            }
            message={error}
            onPress={refetch}
            style={styles.message}
          />
        ) : null}

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {isSpanish ? 'Estadísticas' : 'Statistics'}
        </Text>

        <View style={styles.statsRow}>
          <StatCard
            icon="alarm-outline"
            value={profile?.total_alarms_completed ?? 0}
            label={isSpanish ? 'Alarmas' : 'Alarms'}
            color={colors.primary}
          />

          <StatCard
            icon="trophy-outline"
            value={totalMissionsResolved}
            label={isSpanish ? 'Misiones' : 'Missions'}
            color={colors.warning}
          />

          <StatCard
            icon="flame-outline"
            value={profile?.streak_days ?? 0}
            label={isSpanish ? 'Racha' : 'Streak'}
            color={colors.danger}
          />
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {isSpanish ? 'Cuenta' : 'Account'}
        </Text>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <ActionRow
            icon="create-outline"
            label={isSpanish ? 'Editar perfil' : 'Edit profile'}
            sublabel={
              isSpanish
                ? 'Cambiar nombre y bio'
                : 'Change name and bio'
            }
            onPress={() => navigation.navigate('EditProfile')}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.borderMuted,
              },
            ]}
          />

          <ActionRow
            icon="lock-closed-outline"
            label={isSpanish ? 'Cambiar contrasena' : 'Change password'}
            sublabel={
              isSpanish
                ? 'Actualizar o restablecer acceso'
                : 'Update or recover access'
            }
            onPress={() => navigation.navigate('ChangePassword')}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.borderMuted,
              },
            ]}
          />

          <ActionRow
            icon="time-outline"
            label={
              isSpanish
                ? 'Historial de misiones'
                : 'Mission history'
            }
            sublabel={
              isSpanish
                ? 'Ver historial de misiones realizadas'
                : 'View completed mission history'
            }
            onPress={handleOpenMissionHistory}
            disabled={!userId}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.borderMuted,
              },
            ]}
          />

          <ActionRow
            icon="alarm-outline"
            label={
              isSpanish
                ? 'Historial de alarmas'
                : 'Alarm history'
            }
            sublabel={
              isSpanish
                ? 'Ver alarmas creadas, activadas y desactivadas'
                : 'View created, enabled and disabled alarms'
            }
            onPress={handleOpenAlarmHistory}
            disabled={!userId}
          />
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {isSpanish ? 'Sesión' : 'Session'}
        </Text>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <ActionRow
            icon="log-out-outline"
            label={
              isLoggingOut
                ? isSpanish
                  ? 'Cerrando sesión...'
                  : 'Logging out...'
                : isSpanish
                  ? 'Cerrar sesión'
                  : 'Log out'
            }
            color={colors.warning}
            onPress={handleLogout}
            disabled={isLoggingOut}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.borderMuted,
              },
            ]}
          />

          <ActionRow
            icon="trash-outline"
            label={
              isSpanish
                ? 'Eliminar cuenta'
                : 'Delete account'
            }
            color={colors.danger}
            onPress={handleDeleteAccount}
          />
        </View>

        {createdAtText ? (
          <Text
            style={[
              styles.memberSince,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {isSpanish
              ? `Miembro desde ${createdAtText}`
              : `Member since ${createdAtText}`}
          </Text>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={activeModal === 'logout'}
        type="warning"
        title={isSpanish ? 'Cerrar sesión' : 'Log out'}
        message={
          isSpanish
            ? 'Tu sesión se cerrará en este dispositivo. Podrás volver a entrar desde la pantalla de autenticación.'
            : 'Your session will be closed on this device. You can log in again from the authentication screen.'
        }
        onClose={closeModal}
        closeOnBackdropPress={!isLoggingOut}
        cancelAction={{
          label: isSpanish ? 'Cancelar' : 'Cancel',
          onPress: closeModal,
          disabled: isLoggingOut,
        }}
        confirmAction={{
          label: isSpanish ? 'Cerrar sesión' : 'Log out',
          onPress: confirmLogout,
          loading: isLoggingOut,
        }}
      />

      <Modal
        visible={activeModal === 'delete-account'}
        type="error"
        title={isSpanish ? 'Eliminar cuenta' : 'Delete account'}
        message={
          isSpanish
            ? 'Se eliminaran tus alarmas, historial y perfil guardados en la app. Esta accion cerrara tu sesion.'
            : 'Your alarms, mission history, and app profile will be deleted. This action will log you out.'
        }
        onClose={closeModal}
        closeOnBackdropPress={!isDeletingAccount}
        cancelAction={{
          label: isSpanish ? 'Cancelar' : 'Cancel',
          onPress: closeModal,
          disabled: isDeletingAccount,
        }}
        confirmAction={{
          label: isSpanish ? 'Eliminar' : 'Delete',
          onPress: confirmDeleteAccount,
          loading: isDeletingAccount,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  heroEmail: {
    fontSize: 13,
  },

  heroBio: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
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
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: Typography.label.fontWeight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
  },

  section: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: 20,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },

  divider: {
    height: 1,
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
    marginTop: 1,
  },

  memberSince: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },

  bottomSpace: {
    height: 40,
  },
});
