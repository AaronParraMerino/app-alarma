// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainNavigator from './MainNavigator';
import AuthNavigator from '../features/auth/navigation/AuthNavigator';
import { useAuth } from '../features/auth/hooks/useAuth';

export type RootParamList = {
  Auth: undefined;
  Main: undefined;
};

const Root = createNativeStackNavigator<RootParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isGuest } = useAuth();
  const isLoggedIn = isAuthenticated || isGuest;

  return (
    <NavigationContainer>
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