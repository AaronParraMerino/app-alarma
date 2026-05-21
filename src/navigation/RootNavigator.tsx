// src/navigation/RootNavigator.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { AppState, View, StyleSheet, Linking } from 'react-native';
import {
  CommonActions,
  NavigationContainer,
  createNavigationContainerRef,
  NavigatorScreenParams,
  DefaultTheme,
  PartialState,
  NavigationState,
  InitialState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainNavigator from './MainNavigator';
import { MainTabParamList } from './MainNavigator';
import AuthNavigator from '../features/auth/navigation/AuthNavigator';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
  extractAlarmIdFromNotification,
  extractAlarmIdFromUrl,
  getPendingNativeRingingAlarmId,
  isExpoGoRuntime,
  shouldOpenRingingAlarmId,
} from '../features/alarm/services/alarmScheduler';

import { Colors } from '../shared/theme/colors';

export type RootParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};

const Root = createNativeStackNavigator<RootParamList>();
const navigationRef = createNavigationContainerRef<RootParamList>();
let pendingAlarmId: string | null = null;
let openingAlarmId: string | null = null;
let openingAlarmTimer: ReturnType<typeof setTimeout> | null = null;

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

type AnyRoute = NavigationState['routes'][number] & {
  state?: NavigationState | PartialState<NavigationState>;
};

function getDeepestRouteName(state: NavigationState | PartialState<NavigationState> | undefined): {
  name?: string;
  params?: object;
} {
  if (!state?.routes?.length) return {};

  const index = typeof state.index === 'number' ? state.index : state.routes.length - 1;
  const route = state.routes[index] as AnyRoute | undefined;
  if (!route) return {};

  if (route.state) {
    return getDeepestRouteName(route.state);
  }

  return {
    name: route.name,
    params: route.params as object | undefined,
  };
}

function releaseOpeningAlarm(alarmId: string) {
  if (openingAlarmId !== alarmId) return;
  openingAlarmId = null;
}

function scheduleOpeningRelease(alarmId: string) {
  if (openingAlarmTimer) {
    clearTimeout(openingAlarmTimer);
  }

  openingAlarmTimer = setTimeout(() => {
    openingAlarmTimer = null;
    releaseOpeningAlarm(alarmId);
  }, 1200);
}

function buildRingingRootState(alarmId: string): InitialState {
  return {
    index: 0,
    routes: [
      {
        name: 'Main',
        state: {
          index: 0,
          routes: [
            {
              name: 'AlarmTab',
              state: {
                index: 0,
                routes: [
                  {
                    name: 'AlarmRinging',
                    params: { alarmId },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}

function resetToRingingAlarm(alarmId: string) {
  navigationRef.dispatch(CommonActions.reset(buildRingingRootState(alarmId)));
}

async function navigateToRingingAlarm(alarmId: string) {
  if (!navigationRef.isReady()) {
    pendingAlarmId = alarmId;
    return;
  }

  if (openingAlarmId === alarmId) {
    return;
  }

  openingAlarmId = alarmId;

  const shouldOpen = await shouldOpenRingingAlarmId(alarmId);
  if (!shouldOpen) {
    releaseOpeningAlarm(alarmId);
    return;
  }

  const currentRoute = getDeepestRouteName(navigationRef.getRootState());
  if (
    currentRoute.name === 'AlarmRinging'
    && (currentRoute.params as { alarmId?: string } | undefined)?.alarmId === alarmId
  ) {
    scheduleOpeningRelease(alarmId);
    return;
  }

  resetToRingingAlarm(alarmId);
  scheduleOpeningRelease(alarmId);
}

async function flushPendingAlarmNavigation() {
  if (!pendingAlarmId) return;

  const alarmId = pendingAlarmId;
  pendingAlarmId = null;
  await navigateToRingingAlarm(alarmId);
}

export default function RootNavigator() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const isLoggedIn = isAuthenticated || isGuest;
  const [initialAlarmId, setInitialAlarmId] = useState<string | null>(null);
  const [initialRouteReady, setInitialRouteReady] = useState(false);

  useEffect(() => {
    if (isLoading) return undefined;

    if (!isLoggedIn) {
      setInitialAlarmId(null);
      setInitialRouteReady(true);
      return undefined;
    }

    let mounted = true;

    const resolveInitialAlarmRoute = async () => {
      const [url, pendingNativeAlarmId] = await Promise.all([
        Linking.getInitialURL(),
        getPendingNativeRingingAlarmId(),
      ]);
      const urlAlarmId = url ? extractAlarmIdFromUrl(url) : null;
      let alarmIdToOpen: string | null = null;

      if (urlAlarmId && await shouldOpenRingingAlarmId(urlAlarmId)) {
        alarmIdToOpen = urlAlarmId;
      } else if (
        pendingNativeAlarmId
        && await shouldOpenRingingAlarmId(pendingNativeAlarmId)
      ) {
        alarmIdToOpen = pendingNativeAlarmId;
      }

      if (!mounted) return;

      if (alarmIdToOpen) {
        pendingAlarmId = null;
        openingAlarmId = alarmIdToOpen;
        scheduleOpeningRelease(alarmIdToOpen);
      }

      setInitialAlarmId(alarmIdToOpen);
      setInitialRouteReady(true);
    };

    void resolveInitialAlarmRoute();

    return () => {
      mounted = false;
    };
  }, [isLoading, isLoggedIn]);

  useEffect(() => {
    if (!initialRouteReady || !isLoggedIn) return undefined;

    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;
    let linkingSub: { remove: () => void } | null = null;
    let appStateSub: { remove: () => void } | null = null;

    const handleRingingAlarmId = async (alarmId: string) => {
      await navigateToRingingAlarm(alarmId);
    };

    const setupListeners = async () => {
      if (isExpoGoRuntime()) return;

      try {
        const Notifications = await import('expo-notifications');

        receivedSub = Notifications.addNotificationReceivedListener(notification => {
          const alarmId = extractAlarmIdFromNotification(notification);
          if (alarmId) void handleRingingAlarmId(alarmId);
        });

        responseSub = Notifications.addNotificationResponseReceivedListener(response => {
          const alarmId = extractAlarmIdFromNotification(response);
          if (alarmId) void handleRingingAlarmId(alarmId);
        });
      } catch (error) {
        console.log(
          '[RootNavigator] Notification listeners unavailable in this runtime:',
          error,
        );
      }
    };

    const handleUrl = ({ url }: { url: string }) => {
      const alarmId = extractAlarmIdFromUrl(url);
      if (alarmId) void handleRingingAlarmId(alarmId);
    };

    const handlePendingNativeAlarm = async () => {
      const alarmId = await getPendingNativeRingingAlarmId();
      if (alarmId) void handleRingingAlarmId(alarmId);
    };

    void setupListeners();
    linkingSub = Linking.addEventListener('url', handleUrl);
    appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void handlePendingNativeAlarm();
      }
    });

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
      linkingSub?.remove();
      appStateSub?.remove();
    };
  }, [initialRouteReady, isLoggedIn]);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      void flushPendingAlarmNavigation();
    }
  }, [isLoading, isLoggedIn]);

  const initialNavigationState = useMemo(
    () => (initialAlarmId ? buildRingingRootState(initialAlarmId) : undefined),
    [initialAlarmId],
  );

  if (isLoading || !initialRouteReady) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      initialState={initialNavigationState}
      onReady={() => {
        void flushPendingAlarmNavigation();
      }}
    >
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
