// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainNavigator from './MainNavigator';
import { MainTabParamList } from './MainNavigator';
import AuthNavigator from '../features/auth/navigation/AuthNavigator';
import { useAuth } from '../features/auth/hooks/useAuth';
import { extractAlarmIdFromNotification, isExpoGoRuntime } from '../features/alarm/services/alarmScheduler';

export type RootParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};

const Root = createNativeStackNavigator<RootParamList>();
const navigationRef = createNavigationContainerRef<RootParamList>();

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
  const { isAuthenticated, isGuest } = useAuth();
  const isLoggedIn = isAuthenticated || isGuest;

  useEffect(() => {
    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;

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
        console.log('[RootNavigator] Notification listeners unavailable in this runtime:', error);
      }
    };

    void setupListeners();

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Root.Screen name="Main" component={MainNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}