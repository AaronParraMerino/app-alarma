// src/features/profile/navigation/ProfileNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsScreen from '../../settings/screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MissionHistoryScreen from '../../history/screens/MissionHistoryScreen';
import AlarmHistoryScreen from '../../alarm/screens/AlarmHistoryScreen';
import StreakScreen from '../../streak/screens/StreakScreen';
import VerifyRecoveryCodeScreen from '../../auth/screens/VerifyRecoveryCodeScreen';
import ResetPasswordScreen from '../../auth/screens/ResetPasswordScreen';

export type ProfileStackParamList = {
  Settings: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  VerifyRecoveryCode: {
    email: string;
  };
  ResetPassword: {
    email: string;
  };
  MissionHistory: {
    userId: string;
  };
  AlarmHistory: {
    userId: string;
  };
  Streak: {
    userId: string;
  };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Settings"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

      <Stack.Screen
        name="VerifyRecoveryCode"
        component={VerifyRecoveryCodeScreen as React.ComponentType<any>}
      />

      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen as React.ComponentType<any>}
      />

      <Stack.Screen name="MissionHistory" component={MissionHistoryScreen} />

      <Stack.Screen
        name="AlarmHistory"
        component={AlarmHistoryScreen as React.ComponentType<any>}
      />

      <Stack.Screen
        name="Streak"
        component={StreakScreen as React.ComponentType<any>}
      />
    </Stack.Navigator>
  );
}