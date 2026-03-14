import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/alarm/HomeScreen';
import { Colors } from '../theme/colors';

// Tipos de rutas — ampliar cuando agregues más pantallas
export type RootStackParamList = {
  Home: undefined;
  AlarmCreate: undefined;
  AlarmEdit: { alarmId: string };
  AlarmRinging: { alarmId: string };
  // Misiones se agregan aquí
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* Agregar pantallas aquí cuando estén listas */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}