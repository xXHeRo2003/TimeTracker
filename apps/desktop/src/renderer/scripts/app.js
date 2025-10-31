import { createHistoryManager } from './features/history.js';
import { createMobileViewController } from './features/mobileView.js';
import { createSettingsPanel } from './features/settings.js';
import { createTimerController } from './features/timer.js';
import { createBreakReminder } from './features/breakReminder.js';
import { getLanguage, getLocale, onLanguageChange, setLanguage, translate } from './core/i18n.js';
import { elements } from './ui/dom.js';
import { applyDocumentTranslations } from './ui/translations.js';
import { initializeAppVersion } from './ui/version.js';
import { createId } from './utils/id.js';

const applyPlatformOptimizations = () => {
  const platform =
    navigator.userAgentData?.platform ||
    navigator.platform ||
    (typeof navigator.userAgent === 'string' ? navigator.userAgent : '');

  if (typeof platform === 'string' && /win/i.test(platform)) {
    document.documentElement.dataset.platform = 'windows';
  }
};

applyPlatformOptimizations();

const applyDensityOptimizations = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (!root) {
    return;
  }

  const HIGH_DPI_THRESHOLD = 1.75;
  let currentProfile = root.dataset.perfProfile || '';

  const updateProfile = () => {
    const ratio = window.devicePixelRatio || 1;
    const nextProfile = ratio >= HIGH_DPI_THRESHOLD ? 'scaled' : '';

    if (nextProfile === currentProfile) {
      return;
    }

    if (nextProfile) {
      root.dataset.perfProfile = nextProfile;
    } else {
      delete root.dataset.perfProfile;
    }

    currentProfile = nextProfile;
  };

  updateProfile();

  let resizeScheduled = false;
  const scheduleUpdate = () => {
    if (resizeScheduled) {
      return;
    }
    resizeScheduled = true;
    window.requestAnimationFrame(() => {
      resizeScheduled = false;
      updateProfile();
    });
  };

  window.addEventListener('resize', scheduleUpdate, { passive: true });

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(min-resolution: 1.75dppx)');
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateProfile);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(updateProfile);
    }
  }
};

applyDensityOptimizations();

const timer = createTimerController({ elements, translate });
const history = createHistoryManager({ elements, translate, getLocale });
const mobileView = createMobileViewController({ elements, translate });
const breakReminder = createBreakReminder({ elements, timer, translate, onLanguageChange });

const settings = createSettingsPanel({
  elements,
  onLanguageChange: (nextLanguage) => {
    if (nextLanguage && nextLanguage !== getLanguage()) {
      setLanguage(nextLanguage);
    }
  },
  getLanguage
});

const applyLanguage = () => {
  applyDocumentTranslations({ translate, language: getLanguage(), elements });
  timer.refreshLabels();
  history.refresh();
  mobileView.refreshLabels();
  settings.refreshLanguageSelection();
  breakReminder?.refreshLanguage?.();
};

applyLanguage();
onLanguageChange(applyLanguage);

initializeAppVersion(elements.appVersion);

const blurPresetButtons = () => {
  if (!elements.presetButtons) {
    return;
  }
  elements.presetButtons.forEach((button) => button.blur());
};

if (elements.taskForm) {
  elements.taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(elements.taskForm);
    const taskName = String(formData.get('taskName') || '').trim();

    if (!taskName) {
      return;
    }

    const trackedMs = timer.getTrackedMs();
    if (trackedMs <= 0) {
      alert(translate('alerts.noTrackedTime'));
      return;
    }

    const mode = timer.getMode();
    const entry = {
      id: createId(),
      taskName,
      plannedMs: mode === 'countdown' ? timer.getDuration() : null,
      mode,
      trackedMs,
      completedAtMs: Date.now(),
      completedAt: new Date().toISOString()
    };

    try {
      const result = await history.addEntry(entry);
      if (!result) {
        console.warn('[app] Received no result after storing history entry');
        return;
      }
    } catch (error) {
      console.error('[app] Failed to store history entry', error);
      alert(translate('alerts.saveFailed') || 'Eintrag konnte nicht gespeichert werden.');
      return;
    }

    timer.resetAfterTaskSave();

    elements.taskForm.reset();
    blurPresetButtons();
  });
}
