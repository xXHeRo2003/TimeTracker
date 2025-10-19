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
  elements.taskForm.addEventListener('submit', (event) => {
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
      completedAt: new Date().toISOString()
    };

    history.addEntry(entry);
    timer.resetAfterTaskSave();

    elements.taskForm.reset();
    blurPresetButtons();
  });
}
