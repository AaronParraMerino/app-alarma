import 'react-native-gesture-handler';

import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Image, Linking } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

import { initDB } from './src/shared/db/localDB';
import { WordSeedService } from './src/shared/services/storage/WordSeedService';
import { syncMissionHistory } from './src/shared/services/storage/missionHistorySync.service';
import { ObjectBankService } from './src/features/missions/ObjectRecognition/services/objectBank.service';

import {
  syncAlarms,
  startSyncListener,
  stopSyncListener,
} from './src/shared/services/storage/sync.service';
import { StatusBar } from 'expo-status-bar';
import { AlarmProvider } from './src/features/alarm/store/alarmStore';
import { AuthProvider } from './src/features/auth/store/authStore';
import { MissionsProvider } from './src/features/missions/store/missionsStore';
import { ObjectRecognitionProvider } from './src/features/missions/ObjectRecognition/store/objectRecognitionStore';
import {
  extractAlarmIdFromUrl,
  getPendingNativeRingingAlarmId,
  setupAlarmNotificationsAsync,
  shouldOpenRingingAlarmId,
} from './src/features/alarm/services/alarmScheduler';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuth } from './src/features/auth/hooks/useAuth';
import { Colors } from './src/shared/theme/colors';

// Mantiene el splash nativo hasta que nosotros lo ocultemos
void SplashScreen.preventAutoHideAsync();

initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

const SPLASH_DURATION_MS = 3000;

function AppContent() {
  const [showIntro, setShowIntro] = useState(true);

  const { isAuthenticated, isGuest, user } = useAuth();

  // Ajusta esto según cómo guardes el usuario en tu authStore
  const userId = user?.id;

  useEffect(() => {
    initDB();
    WordSeedService.seedIfNeeded();
    ObjectBankService.seedIfNeeded();
    void setupAlarmNotificationsAsync();

    let mounted = true;
    const skipIntroForActiveAlarm = async () => {
      const [url, pendingAlarmId] = await Promise.all([
        Linking.getInitialURL(),
        getPendingNativeRingingAlarmId(),
      ]);
      const urlAlarmId = url ? extractAlarmIdFromUrl(url) : null;
      const shouldOpenFromUrl = urlAlarmId
        ? await shouldOpenRingingAlarmId(urlAlarmId)
        : false;
      const shouldOpenPendingAlarm = pendingAlarmId
        ? await shouldOpenRingingAlarmId(pendingAlarmId)
        : false;

      if (mounted && (shouldOpenPendingAlarm || shouldOpenFromUrl)) {
        setShowIntro(false);
      }
    };

    void skipIntroForActiveAlarm();

    const timer = setTimeout(() => {
      setShowIntro(false);
    }, SPLASH_DURATION_MS);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!showIntro) {
      void SplashScreen.hideAsync();
    }
  }, [showIntro]);

  useEffect(() => {
    if (!isAuthenticated || isGuest || !userId) {
      stopSyncListener();
      return;
    }

    void syncAlarms(userId);
    void syncMissionHistory(userId);
    startSyncListener(userId);

    return () => {
      stopSyncListener();
    };
  }, [isAuthenticated, isGuest, userId]);

  const handleIntroLayout = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (showIntro) {
    return (
      <View style={styles.splashContainer} onLayout={handleIntroLayout}>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <Image
          source={require('./assets/logoAlarma.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <AuthProvider>
        <AlarmProvider>
          <MissionsProvider>
            <ObjectRecognitionProvider>
              <AppContent />
            </ObjectRecognitionProvider>
          </MissionsProvider>
        </AlarmProvider>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
});
