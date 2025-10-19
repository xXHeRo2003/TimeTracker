import {
  BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES,
  BREAK_REMINDER_MAX_INTERVAL_MINUTES,
  BREAK_REMINDER_MIN_INTERVAL_MINUTES,
  BREAK_REMINDER_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY
} from '../config/constants.js';

const normalizeReminderInterval = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES;
  }

  const clamped = Math.min(
    BREAK_REMINDER_MAX_INTERVAL_MINUTES,
    Math.max(BREAK_REMINDER_MIN_INTERVAL_MINUTES, Math.round(numeric))
  );
  return clamped;
};

export const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[storage] Unable to read history from localStorage', error);
    return [];
  }
};

export const saveHistory = (entries) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('[storage] Unable to persist history to localStorage', error);
  }
};

export const readStoredLanguage = () => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('[storage] Unable to read stored language preference', error);
    return null;
  }
};

export const writeStoredLanguage = (language) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('[storage] Unable to persist language preference', error);
  }
};

export const loadBreakReminderSettings = () => {
  try {
    const raw = localStorage.getItem(BREAK_REMINDER_STORAGE_KEY);
    if (!raw) {
      return {
        enabled: false,
        intervalMinutes: BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES
      };
    }

    const parsed = JSON.parse(raw);
    const enabled = Boolean(parsed?.enabled);
    const intervalMinutes = normalizeReminderInterval(parsed?.intervalMinutes);

    return { enabled, intervalMinutes };
  } catch (error) {
    console.warn('[storage] Unable to read break reminder settings', error);
    return {
      enabled: false,
      intervalMinutes: BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES
    };
  }
};

export const saveBreakReminderSettings = ({ enabled, intervalMinutes }) => {
  try {
    const payload = {
      enabled: Boolean(enabled),
      intervalMinutes: normalizeReminderInterval(intervalMinutes)
    };
    localStorage.setItem(BREAK_REMINDER_STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch (error) {
    console.warn('[storage] Unable to persist break reminder settings', error);
    return {
      enabled: Boolean(enabled),
      intervalMinutes: normalizeReminderInterval(intervalMinutes)
    };
  }
};
