import React, { useEffect, useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BackButton } from '../../../shared/components/ui/BackButton';
import { Menssage } from '../../../shared/components/ui/Menssage';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { updateProfile } from '../../../shared/services/profile/profile.service';
import { useAuth } from '../../auth/store/authStore';
import { useProfile } from '../hooks/useProfile';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;
};

function getPreferredProfileName(
  profileUsername?: string | null,
  authUsername?: string | null,
  email?: string | null,
): string {
  const cleanProfileUsername = profileUsername?.trim();
  const cleanAuthUsername = authUsername?.trim();
  const emailLocalPart = String(email ?? '').split('@')[0] ?? '';

  if (
    cleanProfileUsername &&
    (
      cleanProfileUsername !== emailLocalPart ||
      !cleanAuthUsername ||
      cleanAuthUsername === emailLocalPart
    )
  ) {
    return cleanProfileUsername;
  }

  if (
    cleanAuthUsername &&
    cleanAuthUsername !== emailLocalPart
  ) {
    return cleanAuthUsername;
  }

  return cleanProfileUsername ?? cleanAuthUsername ?? emailLocalPart;
}

export default function EditProfileScreen({ navigation }: Props) {
  const { colors, statusBarStyle } = useAppTheme();
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const { user } = useAuth();
  const { profile, refetch } = useProfile();

  const [username, setUsername] = useState(
    getPreferredProfileName(
      profile?.username,
      user?.username,
      user?.email,
    ),
  );
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    setUsername(
      getPreferredProfileName(
        profile?.username,
        user?.username,
        user?.email,
      ),
    );
    setBio(profile?.bio ?? '');
  }, [
    profile,
    user?.email,
    user?.username,
  ]);

  const handleSave = async () => {
    if (!user?.id) {
      setMessageType('error');
      setMessage(isSpanish ? 'No se encontro el usuario.' : 'User was not found.');
      return;
    }

    if (!username.trim()) {
      setMessageType('error');
      setMessage(isSpanish ? 'Escribe tu nombre.' : 'Enter your name.');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await updateProfile({
        userId: user.id,
        username,
        bio,
      });

      refetch();
      setMessageType('success');
      setMessage(isSpanish ? 'Perfil actualizado.' : 'Profile updated.');

      setTimeout(() => navigation.goBack(), 450);
    } catch (error) {
      setMessageType('error');
      setMessage(
        error instanceof Error
          ? error.message
          : isSpanish
            ? 'No se pudo actualizar el perfil.'
            : 'Could not update profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar backgroundColor={colors.bg} barStyle={statusBarStyle} />

      <View style={styles.topBar}>
        <BackButton
          label={isSpanish ? 'Volver' : 'Back'}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />

        <Text style={[styles.topTitle, { color: colors.text }]}>
          {isSpanish ? 'Editar perfil' : 'Edit profile'}
        </Text>

        <View style={styles.topSpace} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {isSpanish ? 'Nombre' : 'Name'}
            </Text>

            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder={isSpanish ? 'Tu nombre' : 'Your name'}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {isSpanish ? 'Bio' : 'Bio'}
            </Text>

            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder={isSpanish ? 'Algo sobre ti' : 'Something about you'}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={160}
              style={[
                styles.input,
                styles.bioInput,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.counter, { color: colors.textMuted }]}>
              {bio.length}/160
            </Text>

            <Menssage type={messageType} message={message} />

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primaryDeep,
                },
                saving && styles.disabled,
              ]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.saveText, { color: colors.white }]}>
                  {isSpanish ? 'Guardar cambios' : 'Save changes'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
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
  topTitle: {
    fontSize: Typography.action.fontSize,
    fontWeight: Typography.action.fontWeight,
  },
  topSpace: {
    width: 76,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 32,
  },
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  label: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  bioInput: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.65,
  },
});
