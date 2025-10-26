import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES,
  BREAK_REMINDER_MAX_INTERVAL_MINUTES,
  BREAK_REMINDER_MIN_INTERVAL_MINUTES,
  BREAK_REMINDER_STORAGE_KEY
} from '../config/constants';
import { readJson, writeJson } from '../storage/storage';

const defaultSettings = {
  enabled: false,
  intervalMinutes: BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES
};

const clampInterval = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES;
  }
  const rounded = Math.round(numeric);
  const withinBounds = Math.min(
    BREAK_REMINDER_MAX_INTERVAL_MINUTES,
    Math.max(BREAK_REMINDER_MIN_INTERVAL_MINUTES, rounded)
  );
  return withinBounds;
};

const BreakReminderContext = createContext({
  settings: defaultSettings,
  isReady: false,
  setEnabled: () => undefined,
  setIntervalMinutes: () => undefined
});

export const BreakReminderProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await readJson(BREAK_REMINDER_STORAGE_KEY, defaultSettings);
      const enabled = Boolean(stored?.enabled);
      const intervalMinutes = clampInterval(stored?.intervalMinutes);
      setSettings({ enabled, intervalMinutes });
      setIsReady(true);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    writeJson(BREAK_REMINDER_STORAGE_KEY, settings).catch((error) => {
      console.warn('[breakReminder] Unable to persist settings', error);
    });
  }, [settings, isReady]);

  const setEnabled = useCallback((enabled) => {
    setSettings((current) => ({ ...current, enabled: Boolean(enabled) }));
  }, []);

  const setIntervalMinutes = useCallback((intervalMinutes) => {
    setSettings((current) => ({
      ...current,
      intervalMinutes: clampInterval(intervalMinutes)
    }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isReady,
      setEnabled,
      setIntervalMinutes
    }),
    [settings, isReady, setEnabled, setIntervalMinutes]
  );

  return <BreakReminderContext.Provider value={value}>{children}</BreakReminderContext.Provider>;
};

export const useBreakReminderSettings = () => React.useContext(BreakReminderContext);

