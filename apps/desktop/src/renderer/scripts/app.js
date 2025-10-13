const layout = document.querySelector('.layout');
const timerDisplay = document.getElementById('timerDisplay');
const timerInput = document.getElementById('timerInput');
const timerIncreaseBtn = document.getElementById('timerIncreaseBtn');
const timerDecreaseBtn = document.getElementById('timerDecreaseBtn');
const totalTimeEl = document.getElementById('totalTime');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const taskForm = document.getElementById('taskForm');
const taskHistoryEl = document.getElementById('taskHistory');
const historyItemTemplate = document.getElementById('historyItemTemplate');
const presetButtons = Array.from(document.querySelectorAll('.timer__presets .chip'));
const filterButtons = Array.from(document.querySelectorAll('.filters .chip'));
const settingsToggle = document.getElementById('settingsToggle');
const settingsSidebar = document.getElementById('settingsSidebar');
const settingsClose = document.getElementById('settingsClose');
const settingsBackdrop = document.getElementById('settingsBackdrop');
const languageSelect = document.getElementById('languageSelect');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const appVersionEl = document.getElementById('appVersion');

const LANGUAGE_STORAGE_KEY = 'flowtime-language';
const DEFAULT_LANGUAGE = 'de';

const MIN_TIMER_MS = 1000;
const MAX_TIMER_MS = 99 * 60 * 60 * 1000;
const TIME_SEGMENTS = [
  { id: 'hours', start: 0, end: 2, stepMs: 60 * 60 * 1000 },
  { id: 'minutes', start: 3, end: 5, stepMs: 60 * 1000 },
  { id: 'seconds', start: 6, end: 8, stepMs: 1000 }
];
const DEFAULT_SEGMENT_ID = 'minutes';
let cachedFirstDayOfWeekIndex = null;

const translations = {
  de: {
    app: {
      title: 'Flowtime',
      subtitle: 'Dein smarter Fokus-Timer',
      totalFocus: 'Gesamte Fokuszeit'
    },
    alerts: {
      invalidTime:
        'Bitte gib eine gültige Zeit ein. Beispiele: 25 (Minuten), 15:00, 01:30:00',
      noTrackedTime:
        'Starte den Timer und arbeite mindestens ein paar Sekunden, bevor du die Aufgabe speicherst.'
    },
    console: {
      loadWarning: 'Konnte gespeicherte Daten nicht laden'
    },
    document: {
      title: 'Flowtime - Desktop'
    },
    history: {
      title: 'Produktivitätsjournal',
      empty: 'Sobald du eine Session speicherst, taucht sie hier auf.',
      filter: {
        today: 'Heute',
        week: 'Woche',
        all: 'Alles'
      }
    },
    settings: {
      toggle: '⚙ Einstellungen',
      title: 'Einstellungen',
      close: 'Sidebar schließen',
      infoTitle: 'App-Informationen',
      version: {
        label: 'Version',
        placeholder: 'Lade...'
      },
      language: {
        heading: 'Sprache',
        description: 'Wähle die Sprache der App.',
        de: 'Deutsch',
        en: 'Englisch'
      }
    },
    task: {
      prompt: 'Was möchtest du fokussiert erledigen?',
      placeholder: 'z. B. Marktanalyse präsentieren',
      save: 'Task speichern'
    },
    mobile: {
      showTasks: 'Aufgaben anzeigen',
      showTimer: 'Timer anzeigen'
    },
    timer: {
      presets: {
        '15': '15 Min',
        '25': '25 Min',
        '45': '45 Min',
        '60': '60 Min'
      },
      adjust: {
        increase: 'Zeit erhöhen',
        decrease: 'Zeit verringern',
        groupAria: 'Timer anpassen'
      },
      input: {
        ariaLabel: 'Timer bearbeiten'
      },
      start: 'Start',
      pause: 'Pause',
      resume: 'Weiter',
      reset: 'Reset'
    }
  },
  en: {
    app: {
      title: 'Flowtime',
      subtitle: 'Your smart focus timer',
      totalFocus: 'Total focus time'
    },
    alerts: {
      invalidTime:
        'Please enter a valid time. Examples: 25 (minutes), 15:00, 01:30:00',
      noTrackedTime:
        'Start the timer and work for at least a few seconds before saving the task.'
    },
    console: {
      loadWarning: 'Could not load saved data'
    },
    document: {
      title: 'Flowtime - Desktop'
    },
    history: {
      title: 'Productivity journal',
      empty: 'Sessions you save will appear here.',
      filter: {
        today: 'Today',
        week: 'Week',
        all: 'All'
      }
    },
    settings: {
      toggle: '⚙ Settings',
      title: 'Settings',
      close: 'Close settings sidebar',
      infoTitle: 'App information',
      version: {
        label: 'Version',
        placeholder: 'Loading...'
      },
      language: {
        heading: 'Language',
        description: 'Choose the language for the app.',
        de: 'German',
        en: 'English'
      }
    },
    task: {
      prompt: 'What do you want to focus on?',
      placeholder: 'e.g. Present market analysis',
      save: 'Save task'
    },
    mobile: {
      showTasks: 'Show tasks',
      showTimer: 'Show timer'
    },
    timer: {
      presets: {
        '15': '15 min',
        '25': '25 min',
        '45': '45 min',
        '60': '60 min'
      },
      adjust: {
        increase: 'Increase timer',
        decrease: 'Decrease timer',
        groupAria: 'Adjust timer'
      },
      input: {
        ariaLabel: 'Edit timer'
      },
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset'
    }
  }
};

const getTranslation = (language, key) => {
  if (!translations[language]) {
    return undefined;
  }

  return key.split('.').reduce((acc, part) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
      return acc[part];
    }
    return undefined;
  }, translations[language]);
};

const resolveInitialLanguage = () => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && translations[stored]) {
      return stored;
    }
  } catch (error) {
    console.warn('[i18n] Unable to read stored language preference', error);
  }

  const navigatorLanguage = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (navigatorLanguage.startsWith('de')) {
    return 'de';
  }

  return 'en';
};

let currentLanguage = resolveInitialLanguage();

const translate = (key) =>
  getTranslation(currentLanguage, key) ?? getTranslation(DEFAULT_LANGUAGE, key) ?? key;

const getActiveLocale = () => (currentLanguage === 'de' ? 'de-DE' : 'en-US');

const updateAppVersion = (version) => {
  if (!appVersionEl || typeof version !== 'string' || !version.trim()) {
    return;
  }

  const normalized = version.trim();
  appVersionEl.textContent = normalized;
  appVersionEl.setAttribute('data-version-value', normalized);
  document.body?.setAttribute('data-app-version', version);
};

const initializeAppVersion = async () => {
  if (!window?.timeTracker?.getVersion) {
    return;
  }

  try {
    const version = await window.timeTracker.getVersion();
    updateAppVersion(version);
  } catch (error) {
    console.warn('[app] Unable to retrieve application version', error);
  }
};

const setLanguage = (language) => {
  const nextLanguage = translations[language] ? language : DEFAULT_LANGUAGE;
  currentLanguage = nextLanguage;
  cachedFirstDayOfWeekIndex = null;

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  } catch (error) {
    console.warn('[i18n] Unable to persist language preference', error);
  }

  applyTranslations();
};

const STORAGE_KEY = 'flowtime-history';

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

let timerDuration = 25 * 60 * 1000;
let remainingMs = timerDuration;
let isEditingTimer = false;
let activeTimeSegment = DEFAULT_SEGMENT_ID;
let shouldRevertTimerInput = false;
let deadline = null;
let timerId = null;
let isRunning = false;
let activeFilter = 'today';
let activeMobileView = 'timer';

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    console.warn(translate('console.loadWarning'), error);
    return [];
  }
};

const saveHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('[storage] Unable to persist history', error);
  }
};

let history = loadHistory();

const setStartButtonLabel = (state) => {
  const keyByState = {
    start: 'timer.start',
    pause: 'timer.pause',
    resume: 'timer.resume'
  };

  const key = keyByState[state] || keyByState.start;
  startPauseBtn.textContent = translate(key);
};

const updateStartPauseLabel = () => {
  if (isRunning) {
    setStartButtonLabel('pause');
    return;
  }

  if (remainingMs > 0 && remainingMs < timerDuration) {
    setStartButtonLabel('resume');
    return;
  }

  setStartButtonLabel('start');
};

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const segments = [hours, minutes, seconds].map((segment) => String(segment).padStart(2, '0'));
  return segments.join(':');
};

const updateTimerDisplay = ({ force = false } = {}) => {
  if (!timerInput) {
    return;
  }

  if (isEditingTimer && !force) {
    return;
  }

  timerInput.value = formatTime(remainingMs);
};

const updateTotalTime = () => {
  const totalMs = history.reduce((acc, entry) => acc + entry.trackedMs, 0);
  totalTimeEl.textContent = formatTime(totalMs);
};

const clampTimerMs = (value) => {
  if (!Number.isFinite(value)) {
    return timerDuration;
  }

  return Math.min(Math.max(value, MIN_TIMER_MS), MAX_TIMER_MS);
};

const clearPresetSelection = () => {
  presetButtons.forEach((btn) => btn.classList.remove('chip--active'));
};

const setTimerFromMs = (ms, { preserveRunningState = false } = {}) => {
  const safeValue = clampTimerMs(ms);

  if (!preserveRunningState) {
    clearTimer();
    isRunning = false;
    setStartButtonLabel('start');
  }

  timerDuration = safeValue;
  remainingMs = safeValue;
  updateTimerDisplay({ force: true });
};

const adjustTimerBy = (deltaMs) => {
  const nextDuration = timerDuration + deltaMs;
  clearPresetSelection();
  setTimerFromMs(nextDuration);
};

const runOnNextFrame = (callback) => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback);
    return;
  }

  setTimeout(callback, 0);
};

const findSegmentById = (segmentId) => TIME_SEGMENTS.find((segment) => segment.id === segmentId);

const getSegmentFromPosition = (position = 0) => {
  if (position <= 1) {
    return findSegmentById('hours');
  }
  if (position <= 4) {
    return findSegmentById('minutes');
  }
  return findSegmentById('seconds');
};

const highlightSegment = (segment) => {
  if (!segment || !timerInput || document.activeElement !== timerInput) {
    return;
  }
  timerInput.setSelectionRange(segment.start, segment.end);
};

const setActiveTimeSegment = (segmentId, { highlight = false } = {}) => {
  const segment = findSegmentById(segmentId);
  if (!segment) {
    return;
  }

  activeTimeSegment = segment.id;

  if (highlight) {
    highlightSegment(segment);
  }
};

const adjustTimerByActiveSegment = (direction) => {
  const segment = findSegmentById(activeTimeSegment) ?? findSegmentById(DEFAULT_SEGMENT_ID);
  if (!segment) {
    return;
  }

  adjustTimerBy(direction * segment.stepMs);

  if (timerInput && document.activeElement === timerInput) {
    runOnNextFrame(() => setActiveTimeSegment(segment.id, { highlight: true }));
  }
};

const moveActiveSegment = (offset) => {
  const currentIndex = TIME_SEGMENTS.findIndex((segment) => segment.id === activeTimeSegment);
  const nextIndex = Math.min(Math.max(currentIndex + offset, 0), TIME_SEGMENTS.length - 1);
  const targetSegment = TIME_SEGMENTS[nextIndex];

  if (targetSegment) {
    setActiveTimeSegment(targetSegment.id, { highlight: true });
  }
};

const selectSegmentAtCursor = () => {
  if (!timerInput) {
    return;
  }

  const position = timerInput.selectionStart ?? 0;
  const segment = getSegmentFromPosition(position) ?? findSegmentById(DEFAULT_SEGMENT_ID);

  if (segment) {
    setActiveTimeSegment(segment.id, { highlight: true });
  }
};

const handleTimerInputCommit = () => {
  if (!timerInput) {
    return;
  }

  const parsed = parseTimerInput(timerInput.value);
  if (parsed == null) {
    alert(translate('alerts.invalidTime'));
    updateTimerDisplay({ force: true });
    return;
  }

  clearPresetSelection();
  setTimerFromMs(parsed);
};

// Parses user input like "25" (minutes), "mm:ss" or "hh:mm:ss" into milliseconds
const parseTimerInput = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Allow decimal comma/point for minutes (e.g., 1.5 => 1:30)
  if (!raw.includes(':')) {
    const minutes = Number(raw.replace(',', '.'));
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    return Math.round(minutes * 60 * 1000);
  }

  const parts = raw.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '' || /[^0-9]/.test(p))) return null;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 2) {
    // mm:ss
    [minutes, seconds] = parts.map((n) => Number(n));
  } else if (parts.length === 3) {
    // hh:mm:ss
    [hours, minutes, seconds] = parts.map((n) => Number(n));
  } else {
    return null;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  if (minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59 || hours < 0) return null;

  const totalMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;
  if (totalMs <= 0) return null;
  return totalMs;
};

const DAY_INDEX_BY_KEY = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

const resolveFirstDayOfWeekIndex = () => {
  if (cachedFirstDayOfWeekIndex != null) {
    return cachedFirstDayOfWeekIndex;
  }

  let resolvedIndex = DAY_INDEX_BY_KEY.mon;

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
      const locale = new Intl.Locale(getActiveLocale());
      const weekInfo = locale.weekInfo;
      if (weekInfo?.firstDay && DAY_INDEX_BY_KEY[weekInfo.firstDay] != null) {
        resolvedIndex = DAY_INDEX_BY_KEY[weekInfo.firstDay];
      }
    }
  } catch (error) {
    console.warn('[i18n] Falling back to Monday as start of week', error);
  }

  cachedFirstDayOfWeekIndex = resolvedIndex;
  return resolvedIndex;
};

const getStartOfWeek = (referenceDate) => {
  const firstDayIndex = resolveFirstDayOfWeekIndex();
  const start = new Date(referenceDate);
  const dayIndex = start.getDay();
  const diff = (dayIndex - firstDayIndex + 7) % 7;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfWeek = (referenceDate) => {
  const end = new Date(getStartOfWeek(referenceDate));
  end.setDate(end.getDate() + 7);
  return end;
};

const renderHistory = () => {
  taskHistoryEl.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const now = new Date();
  const locale = getActiveLocale();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(now);

  const filtered = history.filter((entry) => {
    if (activeFilter === 'all') {
      return true;
    }

    const completed = new Date(entry.completedAt);
    if (activeFilter === 'today') {
      return completed.toDateString() === now.toDateString();
    }

    if (activeFilter === 'week') {
      return completed >= startOfWeek && completed < endOfWeek;
    }

    return true;
  });

  filtered
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .forEach((entry) => {
      const node = historyItemTemplate.content.cloneNode(true);
      node.querySelector('.history__task').textContent = entry.taskName;
      node.querySelector('.history__time').textContent = new Date(entry.completedAt).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
      node.querySelector('.history__duration').textContent = `⏱ ${formatTime(entry.trackedMs)}`;
      node.querySelector('.history__timestamp').textContent = new Date(entry.completedAt).toLocaleDateString(locale, {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      });
      fragment.appendChild(node);
    });

  if (!filtered.length) {
    const emptyState = document.createElement('li');
    emptyState.className = 'history__item';
    emptyState.textContent = translate('history.empty');
    fragment.appendChild(emptyState);
  }

  taskHistoryEl.appendChild(fragment);
};

const updateMobileViewToggleLabel = () => {
  if (!viewToggleBtn) {
    return;
  }

  const key = activeMobileView === 'timer' ? 'mobile.showTasks' : 'mobile.showTimer';
  const label = translate(key);
  viewToggleBtn.textContent = label;
  viewToggleBtn.setAttribute('aria-label', label);
};

const setActiveMobileView = (view) => {
  if (!layout) {
    return;
  }

  activeMobileView = view === 'tasks' ? 'tasks' : 'timer';
  layout.setAttribute('data-active-view', activeMobileView);
  updateMobileViewToggleLabel();
};

const applyTranslations = () => {
  document.documentElement.lang = currentLanguage;
  document.title = translate('document.title');

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (!key) {
      return;
    }

    if (element.dataset?.versionValue != null) {
      return;
    }

    element.textContent = translate(key);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    const config = element.getAttribute('data-i18n-attr');
    if (!config) {
      return;
    }

    config.split(';').forEach((entry) => {
      const [attr, key] = entry.split(':').map((part) => part && part.trim());
      if (attr && key) {
        element.setAttribute(attr, translate(key));
      }
    });
  });

  if (languageSelect) {
    languageSelect.value = currentLanguage;
  }

  if (appVersionEl && !appVersionEl.getAttribute('data-version-value')) {
    appVersionEl.textContent = translate('settings.version.placeholder');
  }

  updateStartPauseLabel();
  renderHistory();
  updateMobileViewToggleLabel();
};

const clearTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

const pauseTimer = () => {
  if (!isRunning) {
    return;
  }
  remainingMs = Math.max(0, deadline - Date.now());
  isRunning = false;
  clearTimer();
  setStartButtonLabel(remainingMs > 0 ? 'resume' : 'start');
  startPauseBtn.classList.toggle('btn--primary', true);
};

const tick = () => {
  const diff = deadline - Date.now();
  remainingMs = Math.max(0, diff);
  updateTimerDisplay();

  if (remainingMs <= 0) {
    clearTimer();
    isRunning = false;
    setStartButtonLabel('start');
    triggerCompletionFeedback();
  }
};

const triggerCompletionFeedback = () => {
  if (!timerDisplay) {
    return;
  }

  timerDisplay.classList.add('timer__display--complete');
  setTimeout(() => {
    timerDisplay.classList.remove('timer__display--complete');
  }, 2500);
};

const startTimer = () => {
  if (isRunning) {
    pauseTimer();
    return;
  }

  if (remainingMs <= 0) {
    remainingMs = timerDuration;
  }

  deadline = Date.now() + remainingMs;
  isRunning = true;
  setStartButtonLabel('pause');
  clearTimer();
  timerId = setInterval(tick, 250);
  tick();
};

startPauseBtn.addEventListener('click', startTimer);

resetBtn.addEventListener('click', () => {
  clearTimer();
  isRunning = false;
  remainingMs = timerDuration;
  updateTimerDisplay({ force: true });
  setStartButtonLabel('start');
});

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    clearPresetSelection();
    button.classList.add('chip--active');

    const minutes = Number(button.dataset.minutes || '25');
    setTimerFromMs(minutes * 60 * 1000);
  });
});

if (timerIncreaseBtn) {
  timerIncreaseBtn.addEventListener('click', () => {
    adjustTimerByActiveSegment(1);
  });
}

if (timerDecreaseBtn) {
  timerDecreaseBtn.addEventListener('click', () => {
    adjustTimerByActiveSegment(-1);
  });
}

if (timerInput) {
  timerInput.addEventListener('focus', () => {
    isEditingTimer = true;
    shouldRevertTimerInput = false;
    runOnNextFrame(() => setActiveTimeSegment(activeTimeSegment, { highlight: true }));
  });

  timerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      timerInput.blur();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      shouldRevertTimerInput = true;
      timerInput.blur();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      adjustTimerByActiveSegment(1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      adjustTimerByActiveSegment(-1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveActiveSegment(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveActiveSegment(1);
    }
  });

  timerInput.addEventListener('mouseup', () => {
    runOnNextFrame(selectSegmentAtCursor);
  });

  timerInput.addEventListener('touchend', () => {
    runOnNextFrame(selectSegmentAtCursor);
  });

  timerInput.addEventListener('blur', () => {
    const revert = shouldRevertTimerInput;
    shouldRevertTimerInput = false;
    isEditingTimer = false;

    if (revert) {
      updateTimerDisplay({ force: true });
      return;
    }

    handleTimerInputCommit();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('chip--active'));
    button.classList.add('chip--active');
    activeFilter = button.dataset.filter || 'today';
    renderHistory();
  });
});

if (languageSelect) {
  languageSelect.addEventListener('change', (event) => {
    const { value } = event.target;
    if (value && value !== currentLanguage) {
      setLanguage(value);
    }
  });
}

const handleTaskSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const taskName = String(formData.get('taskName') || '').trim();

  if (!taskName) {
    return;
  }

  const trackedMs = timerDuration - remainingMs;
  if (trackedMs <= 0) {
    alert(translate('alerts.noTrackedTime'));
    return;
  }

  const now = new Date();
  history.push({
    id: createId(),
    taskName,
    plannedMs: timerDuration,
    trackedMs,
    completedAt: now.toISOString()
  });

  saveHistory(history);
  updateTotalTime();
  renderHistory();
  taskForm.reset();
  presetButtons.forEach((btn) => btn.blur());

  clearTimer();
  isRunning = false;
  remainingMs = timerDuration;
  updateTimerDisplay({ force: true });
  setStartButtonLabel('start');
};

taskForm.addEventListener('submit', handleTaskSubmit);

const setSettingsVisibility = (visible) => {
  if (!settingsSidebar || !settingsToggle || !settingsBackdrop) {
    return;
  }

  settingsSidebar.classList.toggle('settings--visible', visible);
  settingsBackdrop.classList.toggle('settings-backdrop--visible', visible);
  settingsSidebar.setAttribute('aria-hidden', String(!visible));
  settingsBackdrop.setAttribute('aria-hidden', String(!visible));
  settingsToggle.setAttribute('aria-expanded', String(visible));
  settingsToggle.classList.toggle('settings-toggle--hidden', visible);

  if (visible) {
    settingsClose?.focus();
  } else {
    settingsToggle.focus();
  }
};

const toggleSettingsSidebar = () => {
  const isVisible = settingsSidebar?.classList.contains('settings--visible');
  setSettingsVisibility(!isVisible);
};

if (settingsToggle) {
  settingsToggle.addEventListener('click', toggleSettingsSidebar);
}

if (settingsClose) {
  settingsClose.addEventListener('click', () => setSettingsVisibility(false));
}

if (settingsBackdrop) {
  settingsBackdrop.addEventListener('click', () => setSettingsVisibility(false));
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && settingsSidebar?.classList.contains('settings--visible')) {
    setSettingsVisibility(false);
  }
});

if (viewToggleBtn && layout) {
  viewToggleBtn.addEventListener('click', () => {
    const nextView = activeMobileView === 'timer' ? 'tasks' : 'timer';
    setActiveMobileView(nextView);
  });
}

setActiveMobileView(activeMobileView);

updateTimerDisplay({ force: true });
updateTotalTime();
applyTranslations();
initializeAppVersion();
