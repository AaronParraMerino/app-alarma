// src/features/alarm/navigation/AlarmNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AlarmCreateScreen from '../screens/AlarmCreateScreen';
import AlarmEditScreen from '../screens/AlarmEditScreen';
import AlarmRingingScreen from '../screens/AlarmRingingScreen';
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
      <Stack.Screen name="AlarmCreate" component={AlarmCreateScreen} />
      <Stack.Screen name="AlarmEdit" component={AlarmEditScreen} />
      <Stack.Screen
        name="AlarmRinging"
        component={AlarmRingingScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}