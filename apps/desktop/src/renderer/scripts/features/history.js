import { formatDuration } from '../utils/time.js';
import { getEndOfWeek, getStartOfWeek, resetDateRangeCache } from '../utils/dateRange.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const historyBridge = window?.timeTracker?.history;

const normalizeHistoryEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const trackedMs = Number.isFinite(entry.trackedMs) ? Math.max(0, entry.trackedMs) : 0;
  const completedAtMsCandidate = Number.isFinite(entry.completedAtMs)
    ? entry.completedAtMs
    : Date.parse(entry.completedAt ?? '');
  const completedAtMs = Number.isFinite(completedAtMsCandidate)
    ? completedAtMsCandidate
    : Date.now();
  const completedAt =
    typeof entry.completedAt === 'string' && entry.completedAt
      ? entry.completedAt
      : new Date(completedAtMs).toISOString();

  return {
    ...entry,
    trackedMs,
    completedAt,
    completedAtMs
  };
};

const calculateTotalTrackedMs = (entries) =>
  entries.reduce((acc, entry) => acc + (Number.isFinite(entry.trackedMs) ? entry.trackedMs : 0), 0);

const removeEntryById = (entries, id) => {
  const index = entries.findIndex((current) => current.id === id);
  if (index !== -1) {
    entries.splice(index, 1);
  }
};

const insertEntrySorted = (entries, entry) => {
  const index = entries.findIndex((current) => current.completedAtMs <= entry.completedAtMs);
  if (index === -1) {
    entries.push(entry);
    return;
  }
  entries.splice(index, 0, entry);
};

const loadPersistedEntries = async () => {
  if (!historyBridge?.listEntries) {
    console.warn('[history] History bridge is not available; falling back to empty list.');
    return [];
  }

  try {
    const entries = await historyBridge.listEntries();
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    console.warn('[history] Failed to load entries from database', error);
    return [];
  }
};

const persistEntry = async (entry) => {
  if (!historyBridge?.addEntry) {
    console.warn('[history] History bridge is not available; skipping persistence.');
    return entry;
  }

  return historyBridge.addEntry(entry);
};

export const createHistoryManager = ({ elements, translate, getLocale }) => {
  const state = {
    entries: [],
    totalTrackedMs: 0,
    activeFilter: 'today',
    isReady: false,
    readinessPromise: null
  };

  const render = () => {
    if (!elements.taskHistory || !elements.historyItemTemplate) {
      return;
    }

    elements.taskHistory.innerHTML = '';

    const locale = getLocale();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStartMs = todayStart.getTime();
    const tomorrowStartMs = todayStartMs + MS_PER_DAY;
    const startOfWeek = getStartOfWeek(now, locale);
    const endOfWeek = getEndOfWeek(now, locale);
    const startOfWeekMs = startOfWeek.getTime();
    const endOfWeekMs = endOfWeek.getTime();

    const fragment = document.createDocumentFragment();
    let renderedEntries = 0;

    state.entries.forEach((entry) => {
      const completedAtMs = entry.completedAtMs;

      if (state.activeFilter === 'today') {
        if (completedAtMs < todayStartMs || completedAtMs >= tomorrowStartMs) {
          return;
        }
      } else if (state.activeFilter === 'week') {
        if (completedAtMs < startOfWeekMs || completedAtMs >= endOfWeekMs) {
          return;
        }
      }

      const node = elements.historyItemTemplate.content.cloneNode(true);
      const completedAtDate = new Date(completedAtMs);

      node.querySelector('.history__task').textContent = entry.taskName || '';
      node.querySelector('.history__time').textContent = completedAtDate.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
      node.querySelector('.history__duration').textContent = `⏱ ${formatDuration(entry.trackedMs)}`;
      node.querySelector('.history__timestamp').textContent = completedAtDate.toLocaleDateString(
        locale,
        {
          weekday: 'short',
          day: '2-digit',
          month: 'short'
        }
      );

      fragment.appendChild(node);
      renderedEntries += 1;
    });

    if (renderedEntries === 0) {
      const emptyState = document.createElement('li');
      emptyState.className = 'history__item';
      emptyState.textContent = translate('history.empty');
      fragment.appendChild(emptyState);
    }

    elements.taskHistory.appendChild(fragment);
  };

  const updateTotalFocusTime = () => {
    if (!elements.totalTime) {
      return;
    }

    elements.totalTime.textContent = formatDuration(state.totalTrackedMs);
  };

  const setActiveFilter = (filter) => {
    if (state.activeFilter === filter) {
      return;
    }
    state.activeFilter = filter;
    render();
  };

  const setupFilterButtons = () => {
    if (!elements.filterButtons) {
      return;
    }

    elements.filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.classList.contains('chip--active')) {
          return;
        }
        elements.filterButtons.forEach((btn) => btn.classList.remove('chip--active'));
        button.classList.add('chip--active');
        const nextFilter = button.dataset.filter || 'today';
        setActiveFilter(nextFilter);
      });
    });
  };

  setupFilterButtons();

  const ensureInitialized = () => {
    if (state.readinessPromise) {
      return state.readinessPromise;
    }

    state.readinessPromise = (async () => {
      const persisted = await loadPersistedEntries();
      const normalized = persisted.map(normalizeHistoryEntry).filter(Boolean);
      normalized.sort((a, b) => b.completedAtMs - a.completedAtMs);

      state.entries = normalized;
      state.totalTrackedMs = calculateTotalTrackedMs(normalized);
      state.isReady = true;

      render();
      updateTotalFocusTime();
    })().catch((error) => {
      console.warn('[history] Initialization failed', error);
      state.entries = [];
      state.totalTrackedMs = 0;
      state.isReady = true;
      render();
      updateTotalFocusTime();
    });

    return state.readinessPromise;
  };

  const addEntry = async (entry) => {
    const normalized = normalizeHistoryEntry(entry);
    if (!normalized) {
      return null;
    }

    await ensureInitialized();

    let persisted;
    try {
      persisted = await persistEntry(normalized);
    } catch (error) {
      console.warn('[history] Failed to persist entry', error);
      return null;
    }

    const stored = normalizeHistoryEntry(persisted);
    if (!stored) {
      return null;
    }

    removeEntryById(state.entries, stored.id);
    insertEntrySorted(state.entries, stored);
    state.totalTrackedMs = calculateTotalTrackedMs(state.entries);
    render();
    updateTotalFocusTime();
    return stored;
  };

  const ready = () => ensureInitialized();

  const refresh = () => {
    resetDateRangeCache();
    if (!state.isReady) {
      ensureInitialized().catch(() => {});
      return;
    }
    state.totalTrackedMs = calculateTotalTrackedMs(state.entries);
    render();
    updateTotalFocusTime();
  };

  ensureInitialized();
  refresh();

  return {
    addEntry,
    getEntries: () => state.entries.slice(),
    getTotalTrackedMs: () => state.totalTrackedMs,
    getActiveFilter: () => state.activeFilter,
    refresh,
    ready
  };
};
