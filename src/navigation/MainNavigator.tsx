// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { BottomTabBar } from '../shared/components/ui/BottomTabBar';
import AlarmNavigator from '../features/alarm/navigation/AlarmNavigator';
import StopwatchScreen from '../features/stopwatch/screens/StopwatchScreen';
import MissionsScreen from '../features/missions/screens/MissionsScreen';
import ProfileNavigator from '../features/profile/navigation/ProfileNavigator';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MainTabParamList = {
  AlarmTab: undefined;
  StopwatchTab: undefined;
  MissionsTab: undefined;
  SettingsTab: undefined;
};

// ─── Pantallas que ocultan la tab bar ─────────────────────────────────────────

const SCREENS_WITHOUT_TABBAR = ['AlarmCreate', 'AlarmEdit', 'AlarmRinging'];

function getTabBarDisplay(route: any): 'flex' | 'none' {
  const focusedRoute = getFocusedRouteNameFromRoute(route);
  if (focusedRoute && SCREENS_WITHOUT_TABBAR.includes(focusedRoute)) {
    return 'none';
  }
  return 'flex';
}

// ─── Navigator ────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Alarma */}
      <Tab.Screen
        name="AlarmTab"
        component={AlarmNavigator}
        options={({ route }) => ({
          tabBarStyle: { display: getTabBarDisplay(route) },
        })}
      />

      {/* Cronómetro */}
      <Tab.Screen name="StopwatchTab" component={StopwatchScreen} />

      {/* Misiones */}
      <Tab.Screen name="MissionsTab" component={MissionsScreen} />

      {/* Ajustes + Perfil */}
      <Tab.Screen name="SettingsTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}