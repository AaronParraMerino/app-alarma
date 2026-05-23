// src/shared/components/ui/BottomTabBar.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  useAppTheme,
  type AppThemeColors,
} from '../../theme/useAppTheme';
import { useTranslation } from '../../i18n/useTranslation';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  routeName: string;
  labelKey: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TAB_CONFIG: TabConfig[] = [
  {
    routeName: 'AlarmTab',
    labelKey: 'tabs.alarm',
    icon: 'alarm-outline',
    iconActive: 'alarm',
  },
  {
    routeName: 'StopwatchTab',
    labelKey: 'tabs.stopwatch',
    icon: 'timer-outline',
    iconActive: 'timer',
  },
  {
    routeName: 'MissionsTab',
    labelKey: 'tabs.missions',
    icon: 'trophy-outline',
    iconActive: 'trophy',
  },
  {
    routeName: 'SettingsTab',
    labelKey: 'tabs.settings',
    icon: 'settings-outline',
    iconActive: 'settings',
  },
];

interface TabItemProps {
  config: TabConfig;
  label: string;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: AppThemeColors;
}

function TabItem({
  config,
  label,
  isActive,
  onPress,
  onLongPress,
  colors,
}: TabItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.08 : 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.timing(dotOpacity, {
        toValue: isActive ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scaleAnim, dotOpacity]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {isActive ? (
          <View
            style={[
              styles.activeBackground,
              {
                backgroundColor: colors.accentGlow,
                borderColor: colors.primary + '33',
              },
            ]}
          />
        ) : null}

        <Ionicons
          name={isActive ? config.iconActive : config.icon}
          size={22}
          color={isActive ? colors.primary : colors.textMuted}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.activeDot,
          {
            opacity: dotOpacity,
            backgroundColor: colors.primary,
          },
        ]}
      />

      <Text
        style={[
          styles.label,
          {
            color: isActive ? colors.primary : colors.textMuted,
            fontWeight: isActive ? '600' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  const tabBarStyle = focusedOptions.tabBarStyle as any;
  const isHidden = tabBarStyle?.display === 'none';

  if (isHidden) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          paddingBottom: Math.max(insets.bottom, 8),
          shadowColor: isDark ? '#000' : '#64748B',
        },
      ]}
    >
      <View
        style={[
          styles.topBorder,
          {
            backgroundColor: colors.border,
          },
        ]}
      />

      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG.find(
            (tab) => tab.routeName === route.name,
          );

          if (!config) return null;

          const isActive = state.index === index;
          const label = t(config.labelKey);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              config={config}
              label={label}
              isActive={isActive}
              onPress={onPress}
              onLongPress={onLongPress}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0,
    ...Platform.select({
      android: {
        elevation: 16,
      },
      ios: {
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
    }),
  },

  topBorder: {
    height: 1,
    opacity: 0.8,
  },

  inner: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 4,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },

  iconWrap: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },

  activeBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    borderWidth: 1,
  },

  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: -2,
  },

  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});