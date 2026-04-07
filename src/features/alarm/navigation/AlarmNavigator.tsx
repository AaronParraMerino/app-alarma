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
    </Stack.Navigator>
  );
}