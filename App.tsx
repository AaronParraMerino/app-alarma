import 'react-native-gesture-handler'; // DEBE ser la primera importación
import { StatusBar } from 'expo-status-bar';
import { AlarmProvider } from './src/store/alarmStore';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AlarmProvider>
      <StatusBar style="light" backgroundColor="#0D0F14" />
      <AppNavigator />
    </AlarmProvider>
  );
}