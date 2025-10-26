import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AppProviders } from './src/context/AppProviders';
import { AppNavigator } from './src/navigation/AppNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="light" />
        <AppNavigator />
      </AppProviders>
    </SafeAreaProvider>
  );
}
