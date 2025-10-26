import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from '../context/TranslationContext';
import { useHistoryContext } from '../context/HistoryContext';
import { useBreakReminderSettings } from '../context/BreakReminderContext';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { colors } from '../theme/colors';
import { TimerScreen } from '../screens/TimerScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent
  }
};

const TabLabel = ({ focused, label }) => (
  <Text
    style={{
      fontSize: 12,
      color: focused ? colors.accent : colors.textSecondary,
      fontWeight: focused ? '600' : '400'
    }}
  >
    {label}
  </Text>
);

export const AppNavigator = () => {
  const { translate, isReady: translationReady } = useTranslation();
  const { isReady: historyReady } = useHistoryContext();
  const { isReady: breakReady } = useBreakReminderSettings();

  if (!translationReady || !historyReady || !breakReady) {
    return <LoadingOverlay message={translate('app.subtitle')} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        initialRouteName="Timer"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: 8,
            paddingTop: 8,
            height: 64
          }
        }}
      >
        <Tab.Screen
          name="Timer"
          component={TimerScreen}
          options={{
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={translate('mobile.timerTab')} />
            )
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={translate('mobile.historyTab')} />
            )
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: ({ focused }) => (
              <TabLabel focused={focused} label={translate('mobile.settingsTab')} />
            )
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

