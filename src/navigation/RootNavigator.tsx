import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlarmNavigator from '../features/alarm/navigation/AlarmNavigator';
// import AuthNavigator from '../features/auth/navigation/AuthNavigator';
// import ProfileNavigator from '../features/profile/navigation/ProfileNavigator';
// import MissionsNavigator from '../features/missions/navigation/MissionsNavigator';

export type RootParamList = {
  Auth: undefined;
  Alarm: undefined;
  Missions: undefined;
  Profile: undefined;
};

const Root = createNativeStackNavigator<RootParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {/* Cambia initialRouteName según si hay sesión activa */}
        {/* <Root.Screen name="Auth" component={AuthNavigator} /> */}
        <Root.Screen name="Alarm" component={AlarmNavigator} />
        {/* <Root.Screen name="Missions" component={MissionsNavigator} />
        <Root.Screen name="Profile" component={ProfileNavigator} /> */}
      </Root.Navigator>
    </NavigationContainer>
  );
}