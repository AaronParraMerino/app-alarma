// src/features/alarm/navigation/AlarmNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import { Colors } from '../../../shared/theme/colors';

export type AlarmStackParamList = {
  Home: undefined;
  AlarmCreate: undefined;
  AlarmEdit: { alarmId: string };
  AlarmRinging: { alarmId: string };
};

const Stack = createNativeStackNavigator<AlarmStackParamList>();

export default function AlarmNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      {/*
        Cuando agregues las pantallas de detalle, la tab bar
        se ocultará automáticamente en MainNavigator porque
        sus nombres están en SCREENS_WITHOUT_TABBAR.

        <Stack.Screen name="AlarmCreate" component={AlarmCreateScreen} />
        <Stack.Screen name="AlarmEdit" component={AlarmEditScreen} />
        <Stack.Screen name="AlarmRinging" component={AlarmRingingScreen} />
      */}
    </Stack.Navigator>
  );
}