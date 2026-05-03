// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
  NavigatorScreenParams,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainNavigator from './MainNavigator';
import { MainTabParamList } from './MainNavigator';
import AuthNavigator from '../features/auth/navigation/AuthNavigator';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
  extractAlarmIdFromNotification,
  isExpoGoRuntime,
} from '../features/alarm/services/alarmScheduler';

import { Colors } from '../shared/theme/colors';

export type RootParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};

const Root = createNativeStackNavigator<RootParamList>();
const navigationRef = createNavigationContainerRef<RootParamList>();

const navigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.bg,
    card: Colors.bgCard,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};

function navigateToRingingAlarm(alarmId: string) {
  if (!navigationRef.isReady()) return;

  navigationRef.navigate('Main', {
    screen: 'AlarmTab',
    params: {
      screen: 'AlarmRinging',
      params: { alarmId },
    },
  });
}

export default function RootNavigator() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated || isGuest;

  useEffect(() => {
    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;

    if (isLoading || !isLoggedIn) {
      return () => {};
    }

    if (isExpoGoRuntime()) {
      return () => {};
    }

    const setupListeners = async () => {
      try {
        const Notifications = await import('expo-notifications');

        receivedSub = Notifications.addNotificationReceivedListener(notification => {
          const alarmId = extractAlarmIdFromNotification(notification);
          if (alarmId) navigateToRingingAlarm(alarmId);
        });

        responseSub = Notifications.addNotificationResponseReceivedListener(response => {
          const alarmId = extractAlarmIdFromNotification(response);
          if (alarmId) navigateToRingingAlarm(alarmId);
        });
      } catch (error) {
        console.log(
          '[RootNavigator] Notification listeners unavailable in this runtime:',
          error,
        );
      }
    };

    void setupListeners();

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [isLoading, isLoggedIn]);

  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Root.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors.bg,
          },
        }}
      >
        {isLoggedIn ? (
          <Root.Screen name="Main" component={MainNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});