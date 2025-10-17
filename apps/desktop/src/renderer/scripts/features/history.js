import { loadHistory, saveHistory } from '../services/storage.js';
import { formatDuration } from '../utils/time.js';
import { getEndOfWeek, getStartOfWeek, resetDateRangeCache } from '../utils/dateRange.js';

export const createHistoryManager = ({ elements, translate, getLocale }) => {
  const state = {
    entries: loadHistory(),
    activeFilter: 'today'
  };

  const render = () => {
    if (!elements.taskHistory || !elements.historyItemTemplate) {
      return;
    }

    elements.taskHistory.innerHTML = '';

    const now = new Date();
    const locale = getLocale();
    const startOfWeek = getStartOfWeek(now, locale);
    const endOfWeek = getEndOfWeek(now, locale);

    const filtered = state.entries.filter((entry) => {
      if (state.activeFilter === 'all') {
        return true;
      }

      const completed = new Date(entry.completedAt);
      if (state.activeFilter === 'today') {
        return completed.toDateString() === now.toDateString();
      }

      if (state.activeFilter === 'week') {
        return completed >= startOfWeek && completed < endOfWeek;
      }

      return true;
    });

    const fragment = document.createDocumentFragment();

    filtered
      .slice()
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .forEach((entry) => {
        const node = elements.historyItemTemplate.content.cloneNode(true);
        node.querySelector('.history__task').textContent = entry.taskName;
        node
          .querySelector('.history__time')
          .textContent = new Date(entry.completedAt).toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
          });
        node.querySelector('.history__duration').textContent = `⏱ ${formatDuration(entry.trackedMs)}`;
        node
          .querySelector('.history__timestamp')
          .textContent = new Date(entry.completedAt).toLocaleDateString(locale, {
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

    elements.taskHistory.appendChild(fragment);
  };

  const updateTotalFocusTime = () => {
    if (!elements.totalTime) {
      return;
    }

    const totalMs = state.entries.reduce((acc, entry) => acc + entry.trackedMs, 0);
    elements.totalTime.textContent = formatDuration(totalMs);
  };

  const setActiveFilter = (filter) => {
    state.activeFilter = filter;
    render();
  };

  const setupFilterButtons = () => {
    if (!elements.filterButtons) {
      return;
    }

    elements.filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        elements.filterButtons.forEach((btn) => btn.classList.remove('chip--active'));
        button.classList.add('chip--active');
        const nextFilter = button.dataset.filter || 'today';
        setActiveFilter(nextFilter);
      });
    });
  };

  setupFilterButtons();

  const addEntry = (entry) => {
    state.entries.push(entry);
    saveHistory(state.entries);
    render();
    updateTotalFocusTime();
  };

  const refresh = () => {
    resetDateRangeCache();
    render();
    updateTotalFocusTime();
  };

  refresh();

  return {
    addEntry,
    refresh,
    getEntries: () => state.entries.slice(),
    getTotalTrackedMs: () => state.entries.reduce((acc, entry) => acc + entry.trackedMs, 0),
    getActiveFilter: () => state.activeFilter
  };
};
