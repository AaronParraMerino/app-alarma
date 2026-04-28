import 'react-native-gesture-handler';
import { useEffect } from 'react'
import { initDB } from './src/shared/db/localDB'
import { syncAlarms } from './src/shared/services/storage/sync.service'
import { StatusBar } from 'expo-status-bar';
import { AlarmProvider } from './src/features/alarm/store/alarmStore';
import { AuthProvider } from './src/features/auth/store/authStore';
import { MissionsProvider } from './src/features/missions/store/missionsStore';
import { setupAlarmNotificationsAsync } from './src/features/alarm/services/alarmScheduler';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    initDB()
    syncAlarms()
    void setupAlarmNotificationsAsync()
  }, [])
  
  return (
    <AuthProvider>
      <AlarmProvider>
        <MissionsProvider>
          <StatusBar style="light" backgroundColor="#0D0F14" />
          <RootNavigator />
        </MissionsProvider>
      </AlarmProvider>
    </AuthProvider>
  );
}