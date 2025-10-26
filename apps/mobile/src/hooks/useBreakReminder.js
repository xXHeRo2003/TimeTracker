import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  DEFAULT_BREAK_SNOOZE_MINUTES
} from '../config/constants';
import { useBreakReminderSettings } from '../context/BreakReminderContext';
import { useTranslation } from '../context/TranslationContext';

const MINUTE_MS = 60 * 1000;

export const useBreakReminder = ({ trackedMs, isTimerRunning }) => {
  const { settings, setEnabled, setIntervalMinutes } = useBreakReminderSettings();
  const { translate } = useTranslation();

  const lastIntervalRef = useRef(0);
  const previousTrackedRef = useRef(0);
  const snoozedUntilRef = useRef(null);
  const permissionsGrantedRef = useRef(false);

  useEffect(() => {
    const ensurePermissions = async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        if (existing.status === 'granted') {
          permissionsGrantedRef.current = true;
          return;
        }
        const requested = await Notifications.requestPermissionsAsync();
        permissionsGrantedRef.current = requested.status === 'granted';
      } catch (error) {
        console.warn('[breakReminder] Unable to request notification permissions', error);
        permissionsGrantedRef.current = false;
      }
    };

    if (settings.enabled) {
      ensurePermissions();
    }
  }, [settings.enabled]);

  useEffect(() => {
    if (!settings.enabled) {
      lastIntervalRef.current = 0;
      previousTrackedRef.current = 0;
      snoozedUntilRef.current = null;
    }
  }, [settings.enabled]);

  useEffect(() => {
    if (!settings.enabled || !isTimerRunning) {
      previousTrackedRef.current = trackedMs;
      return;
    }

    const intervalMs = Math.max(settings.intervalMinutes * MINUTE_MS, MINUTE_MS);
    if (trackedMs < previousTrackedRef.current) {
      previousTrackedRef.current = trackedMs;
      lastIntervalRef.current = Math.floor(trackedMs / intervalMs);
      return;
    }

    previousTrackedRef.current = trackedMs;

    if (trackedMs < intervalMs) {
      return;
    }

    if (snoozedUntilRef.current && Date.now() < snoozedUntilRef.current) {
      return;
    }

    const intervalsPassed = Math.floor(trackedMs / intervalMs);
    if (intervalsPassed <= 0 || intervalsPassed <= lastIntervalRef.current) {
      return;
    }

    const minutesFocused = Math.max(1, Math.round(trackedMs / MINUTE_MS));

    const showReminder = async () => {
      const title = translate('breakReminder.notification.title');
      const message = translate('breakReminder.notification.message').replace(
        '%MINUTES%',
        String(minutesFocused)
      );

      Alert.alert(title, message, [
        {
          text: translate('breakReminder.notification.snooze'),
          onPress: () => {
            snoozedUntilRef.current = Date.now() + DEFAULT_BREAK_SNOOZE_MINUTES * MINUTE_MS;
          }
        },
        {
          text: translate('breakReminder.notification.dismiss'),
          style: 'cancel'
        }
      ]);

      if (permissionsGrantedRef.current) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body: message
            },
            trigger: null
          });
        } catch (error) {
          console.warn('[breakReminder] Unable to schedule notification', error);
        }
      }
    };

    showReminder();
    lastIntervalRef.current = intervalsPassed;
    snoozedUntilRef.current = null;
  }, [settings.enabled, settings.intervalMinutes, trackedMs, isTimerRunning, translate]);

  const snooze = useCallback(() => {
    snoozedUntilRef.current = Date.now() + DEFAULT_BREAK_SNOOZE_MINUTES * MINUTE_MS;
  }, []);

  return {
    settings,
    setEnabled,
    setIntervalMinutes,
    snooze
  };
};

