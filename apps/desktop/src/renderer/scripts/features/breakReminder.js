import {
  BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES,
  BREAK_REMINDER_MAX_INTERVAL_MINUTES,
  BREAK_REMINDER_MIN_INTERVAL_MINUTES
} from '../config/constants.js';
import { loadBreakReminderSettings, saveBreakReminderSettings } from '../services/storage.js';
import { createNotificationManager } from '../ui/notifications.js';

const MINUTE_IN_MS = 60 * 1000;
const FALLBACK_INTERVAL_MINUTES = BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES;
const DEFAULT_SNOOZE_MINUTES = 5;
const CHECK_INTERVAL_MS = 1000;

const clampInterval = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return FALLBACK_INTERVAL_MINUTES;
  }

  const rounded = Math.max(1, Math.round(numeric));
  return Math.min(
    BREAK_REMINDER_MAX_INTERVAL_MINUTES,
    Math.max(BREAK_REMINDER_MIN_INTERVAL_MINUTES, rounded)
  );
};

export const createBreakReminder = ({ elements, timer, translate, onLanguageChange }) => {
  const host = elements?.notificationHost ?? null;
  const toggle = elements?.breakReminderToggle ?? null;
  const minutesInput = elements?.breakReminderMinutes ?? null;

  const notificationManager = createNotificationManager({
    host,
    defaultDismissLabel: translate('breakReminder.notification.dismiss')
  });

  let settings = loadBreakReminderSettings();
  let previousTrackedMs = 0;
  let lastIntervalNotified = 0;
  let snoozedUntilTimestamp = null;

  const syncToggle = () => {
    if (!toggle) {
      return;
    }
    toggle.checked = Boolean(settings.enabled);
  };

  const syncMinutesInput = () => {
    if (!minutesInput) {
      return;
    }
    minutesInput.value = String(settings.intervalMinutes ?? FALLBACK_INTERVAL_MINUTES);
  };

  const syncUi = () => {
    syncToggle();
    syncMinutesInput();
  };

  const persistSettings = (nextSettings) => {
    settings = saveBreakReminderSettings({
      enabled: Boolean(nextSettings.enabled),
      intervalMinutes: clampInterval(nextSettings.intervalMinutes)
    });
    syncUi();
  };

  const resetTracking = () => {
    previousTrackedMs = 0;
    lastIntervalNotified = 0;
    snoozedUntilTimestamp = null;
  };

  const alignToCurrentProgress = () => {
    const trackedNow = timer?.getTrackedMs ? timer.getTrackedMs() : 0;
    const intervalMs = clampInterval(settings.intervalMinutes) * MINUTE_IN_MS;
    previousTrackedMs = trackedNow;
    lastIntervalNotified = intervalMs > 0 ? Math.floor(trackedNow / intervalMs) : 0;
    if (trackedNow === 0) {
      snoozedUntilTimestamp = null;
    }
  };

  const scheduleSnooze = () => {
    snoozedUntilTimestamp = Date.now() + DEFAULT_SNOOZE_MINUTES * MINUTE_IN_MS;
  };

  const formatMessage = (trackedMinutes) => {
    const minutesText = Math.max(1, Math.round(trackedMinutes));
    return translate('breakReminder.notification.message').replace(
      '%MINUTES%',
      String(minutesText)
    );
  };

  const showReminder = ({ trackedMs }) => {
    const trackedMinutes = trackedMs / MINUTE_IN_MS;
    const dismissLabel = translate('breakReminder.notification.dismiss');

    notificationManager.show({
      title: translate('breakReminder.notification.title'),
      message: formatMessage(trackedMinutes),
      dismissLabel,
      actions: [
        {
          label: translate('breakReminder.notification.snooze'),
          onClick: scheduleSnooze
        },
        {
          label: dismissLabel,
          variant: 'ghost',
          closeOnClick: true
        }
      ]
    });
  };

  const evaluateReminder = () => {
    if (!settings.enabled) {
      return;
    }

    if (!timer?.isRunning || !timer.isRunning()) {
      return;
    }

    const trackedMs = timer.getTrackedMs();
    const intervalMs = clampInterval(settings.intervalMinutes) * MINUTE_IN_MS;

    if (trackedMs < previousTrackedMs) {
      resetTracking();
    }

    previousTrackedMs = trackedMs;

    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      return;
    }

    if (trackedMs < intervalMs) {
      return;
    }

    if (snoozedUntilTimestamp && Date.now() < snoozedUntilTimestamp) {
      return;
    }

    const intervalsPassed = Math.floor(trackedMs / intervalMs);
    if (intervalsPassed <= 0 || intervalsPassed <= lastIntervalNotified) {
      return;
    }

    showReminder({ trackedMs });
    lastIntervalNotified = intervalsPassed;
    snoozedUntilTimestamp = null;
  };

  const monitorId = setInterval(evaluateReminder, CHECK_INTERVAL_MS);

  if (toggle) {
    toggle.addEventListener('change', (event) => {
      const enabled = Boolean(event.target?.checked);
      persistSettings({ ...settings, enabled });

      if (!enabled) {
        notificationManager.clear();
        resetTracking();
        return;
      }

      alignToCurrentProgress();
      snoozedUntilTimestamp = null;
    });
  }

  if (minutesInput) {
    const commitInterval = (value) => {
      const nextInterval = clampInterval(value);
      persistSettings({ ...settings, intervalMinutes: nextInterval });
      alignToCurrentProgress();
      snoozedUntilTimestamp = null;
    };

    minutesInput.addEventListener('change', (event) => {
      commitInterval(event.target?.value ?? settings.intervalMinutes);
    });

    minutesInput.addEventListener('blur', (event) => {
      commitInterval(event.target?.value ?? settings.intervalMinutes);
    });

    minutesInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitInterval(minutesInput.value);
        minutesInput.blur();
      }
    });
  }

  const handleLanguageUpdate = () => {
    notificationManager.clear();
    syncUi();
    alignToCurrentProgress();
  };

  const detachLanguageListener =
    typeof onLanguageChange === 'function' ? onLanguageChange(handleLanguageUpdate) : null;

  syncUi();
  alignToCurrentProgress();

  return {
    dispose: () => {
      clearInterval(monitorId);
      if (typeof detachLanguageListener === 'function') {
        detachLanguageListener();
      }
    },
    refreshLanguage: handleLanguageUpdate
  };
};
