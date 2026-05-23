// src/features/settings/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';
import { Typography } from '../../../shared/theme/typography';
import {
  useAppTheme,
  type AppThemeColors,
  type ThemeMode,
} from '../../../shared/theme/useAppTheme';

import {
  useTranslation,
  type AppLanguage,
} from '../../../shared/i18n/useTranslation';

import { Menssage } from '../../../shared/components/ui/Menssage';
import { useAuth } from '../../auth/store/authStore';
import { ProfileStackParamList } from '../../profile/navigation/ProfileNavigator';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;
};

function AvatarInitials({
  name,
  size = 52,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          {
            fontSize: size * 0.38,
          },
        ]}
      >
        {initials || 'U'}
      </Text>
    </View>
  );
}

interface MenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress?: () => void;
  tintColor?: string;
  showChevron?: boolean;
  disabled?: boolean;
  colors: AppThemeColors;
}

function MenuRow({
  icon,
  label,
  sublabel,
  onPress,
  tintColor,
  showChevron = true,
  disabled = false,
  colors,
}: MenuRowProps) {
  const iconColor = tintColor ?? colors.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.menuRow,
        disabled && {
          opacity: 0.4,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={disabled}
    >
      <View
        style={[
          styles.menuIconWrap,
          {
            backgroundColor: iconColor + '1A',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={iconColor}
        />
      </View>

      <View style={styles.menuText}>
        <Text
          style={[
            styles.menuLabel,
            {
              color: colors.text,
            },
          ]}
        >
          {label}
        </Text>

        {sublabel ? (
          <Text
            style={[
              styles.menuSublabel,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>

      {showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textMuted}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { isAuthenticated, user, exitGuest } = useAuth();

  const {
    colors,
    themeMode,
    setThemeMode,
    statusBarStyle,
    isDark,
  } = useAppTheme();

  const {
    t,
    language,
    setLanguage,
  } = useTranslation();

  const [appearanceVisible, setAppearanceVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);

  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setAppearanceVisible(false);
  };

  const handleSelectLanguage = (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
    setLanguageVisible(false);
  };

  const isSpanish = language === 'es';

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.bg,
        },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {t('settings.title')}
          </Text>
        </View>

        {isAuthenticated && user ? (
          <TouchableOpacity
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.primary + '44',
              },
            ]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <AvatarInitials name={user.username || user.email} />

            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.profileName,
                  {
                    color: colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                {user.username || 'Usuario'}
              </Text>

              <Text
                style={[
                  styles.profileEmail,
                  {
                    color: colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>

            <View
              style={[
                styles.profileChevronWrap,
                {
                  backgroundColor: colors.accentGlow,
                },
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <Menssage
            type="info"
            title={isSpanish ? 'Modo invitado' : 'Guest mode'}
            message={
              isSpanish
                ? 'Inicia sesion para guardar tus alarmas y ver tu progreso.'
                : 'Log in to save your alarms and view your progress.'
            }
            onPress={exitGuest}
            style={styles.message}
          />
        )}

        <Text
          style={[
            styles.sectionLabel,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {t('settings.preferences')}
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
          <MenuRow
            icon="notifications-outline"
            label={t('settings.notifications')}
            sublabel={isSpanish ? 'Próximamente' : 'Coming soon'}
            tintColor={colors.warning}
            disabled
            colors={colors}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.borderMuted,
              },
            ]}
          />

          <MenuRow
            icon="color-palette"
            label={t('settings.appearance')}
            sublabel={
              themeMode === 'dark'
                ? t('settings.dark')
                : t('settings.light')
            }
            tintColor={colors.purple}
            onPress={() => setAppearanceVisible(true)}
            colors={colors}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.borderMuted,
              },
            ]}
          />

          <MenuRow
            icon="language-outline"
            label={t('settings.language')}
            sublabel={
              language === 'es'
                ? t('settings.spanish')
                : t('settings.english')
            }
            tintColor={colors.primary}
            onPress={() => setLanguageVisible(true)}
            colors={colors}
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
          {isSpanish ? 'Información' : 'Information'}
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
          <MenuRow
            icon="information-circle-outline"
            label={isSpanish ? 'Acerca de Neuro Wake' : 'About Neuro Wake'}
            sublabel="v1.0.0"
            tintColor={colors.textSecondary}
            showChevron={false}
            colors={colors}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={appearanceVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAppearanceVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDark
                ? 'rgba(0,0,0,0.55)'
                : 'rgba(15,23,42,0.35)',
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {t('settings.appearance')}
            </Text>

            <Text
              style={[
                styles.modalSubtitle,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {isSpanish
                ? 'Selecciona el tema visual de la aplicación.'
                : 'Select the visual theme of the application.'}
            </Text>

            <TouchableOpacity
              style={[
                styles.themeOption,
                {
                  borderColor:
                    themeMode === 'dark'
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    themeMode === 'dark'
                      ? colors.accentGlow
                      : colors.bgCard,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => handleSelectTheme('dark')}
            >
              <View
                style={[
                  styles.themeIconWrap,
                  {
                    backgroundColor: colors.primary + '1A',
                  },
                ]}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.themeTextWrap}>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {t('settings.dark')}
                </Text>

                <Text
                  style={[
                    styles.themeOptionDescription,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {isSpanish
                    ? 'Usa el diseño oscuro por defecto.'
                    : 'Use the default dark design.'}
                </Text>
              </View>

              {themeMode === 'dark' ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                {
                  borderColor:
                    themeMode === 'light'
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    themeMode === 'light'
                      ? colors.accentGlow
                      : colors.bgCard,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => handleSelectTheme('light')}
            >
              <View
                style={[
                  styles.themeIconWrap,
                  {
                    backgroundColor: colors.warning + '1A',
                  },
                ]}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={colors.warning}
                />
              </View>

              <View style={styles.themeTextWrap}>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {t('settings.light')}
                </Text>

                <Text
                  style={[
                    styles.themeOptionDescription,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {isSpanish
                    ? 'Usa fondos claros y textos oscuros.'
                    : 'Use light backgrounds and dark text.'}
                </Text>
              </View>

              {themeMode === 'light' ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={() => setAppearanceVisible(false)}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={languageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDark
                ? 'rgba(0,0,0,0.55)'
                : 'rgba(15,23,42,0.35)',
            },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {t('settings.language')}
            </Text>

            <Text
              style={[
                styles.modalSubtitle,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {isSpanish
                ? 'Selecciona el idioma de la aplicación.'
                : 'Select the application language.'}
            </Text>

            <TouchableOpacity
              style={[
                styles.themeOption,
                {
                  borderColor:
                    language === 'es'
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    language === 'es'
                      ? colors.accentGlow
                      : colors.bgCard,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => handleSelectLanguage('es')}
            >
              <View
                style={[
                  styles.themeIconWrap,
                  {
                    backgroundColor: colors.warning + '26',
                  },
                ]}
              >
                <Text style={[styles.languageBadgeText, { color: colors.warning }]}>
                  ES
                </Text>
              </View>

              <View style={styles.themeTextWrap}>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  Español
                </Text>

                <Text
                  style={[
                    styles.themeOptionDescription,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  Idioma español
                </Text>
              </View>

              {language === 'es' ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                {
                  borderColor:
                    language === 'en'
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    language === 'en'
                      ? colors.accentGlow
                      : colors.bgCard,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => handleSelectLanguage('en')}
            >
              <View
                style={[
                  styles.themeIconWrap,
                  {
                    backgroundColor: colors.primary + '1A',
                  },
                ]}
              >
                <Text style={[styles.languageBadgeText, { color: colors.primary }]}>
                  EN
                </Text>
              </View>

              <View style={styles.themeTextWrap}>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  English
                </Text>

                <Text
                  style={[
                    styles.themeOptionDescription,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  English language
                </Text>
              </View>

              {language === 'en' ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={() => setLanguageVisible(false)}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 20,
  },

  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    letterSpacing: -0.5,
  },

  profileCard: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: 24,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
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

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },

  profileEmail: {
    fontSize: 12,
  },

  profileChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  message: {
    marginHorizontal: 16,
    marginBottom: 24,
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

  menuText: {
    flex: 1,
    gap: 1,
  },

  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  menuSublabel: {
    fontSize: 11,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  modalSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },

  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },

  themeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  themeTextWrap: {
    flex: 1,
  },

  themeOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  themeOptionDescription: {
    fontSize: 11,
    marginTop: 2,
  },

  cancelButton: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
