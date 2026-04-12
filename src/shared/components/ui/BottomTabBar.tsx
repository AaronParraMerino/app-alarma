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
import { Colors } from '../../theme/colors';

// ─── Configuración de tabs ────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  routeName: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TAB_CONFIG: TabConfig[] = [
  {
    routeName: 'AlarmTab',
    label: 'Alarma',
    icon: 'alarm-outline',
    iconActive: 'alarm',
  },
  {
    routeName: 'StopwatchTab',
    label: 'Cronómetro',
    icon: 'timer-outline',
    iconActive: 'timer',
  },
  {
    routeName: 'MissionsTab',
    label: 'Misiones',
    icon: 'trophy-outline',
    iconActive: 'trophy',
  },
  {
    routeName: 'SettingsTab',
    label: 'Ajustes',
    icon: 'settings-outline',
    iconActive: 'settings',
  },
];

// ─── Tab individual ───────────────────────────────────────────────────────────

interface TabItemProps {
  config: TabConfig;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ config, isActive, onPress, onLongPress }: TabItemProps) {
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
  }, [isActive]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={config.label}
    >
      <Animated.View
        style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Fondo activo */}
        {isActive && <View style={styles.activeBackground} />}

        <Ionicons
          name={isActive ? config.iconActive : config.icon}
          size={22}
          color={isActive ? Colors.primary : Colors.textMuted}
        />
      </Animated.View>

      {/* Indicador dot */}
      <Animated.View style={[styles.activeDot, { opacity: dotOpacity }]} />

      <Text
        style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── BottomTabBar ─────────────────────────────────────────────────────────────

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Revisar si la tab activa quiere ocultar la barra
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  const tabBarStyle = focusedOptions.tabBarStyle as any;
  const isHidden = tabBarStyle?.display === 'none';

  if (isHidden) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {/* Línea superior decorativa */}
      <View style={styles.topBorder} />

      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG.find((t) => t.routeName === route.name);
          if (!config) return null;

          const isActive = state.index === index;

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
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              config={config}
              isActive={isActive}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderTopWidth: 0,
    ...Platform.select({
      android: { elevation: 16 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    }),
  },
  topBorder: {
    height: 1,
    backgroundColor: Colors.border,
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
    inset: 0,
    backgroundColor: Colors.accentGlow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: -2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  labelInactive: {
    color: Colors.textMuted,
  },
});