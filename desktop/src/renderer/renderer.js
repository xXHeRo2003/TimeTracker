const timerDisplay = document.getElementById('timerDisplay');
const totalTimeEl = document.getElementById('totalTime');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const taskForm = document.getElementById('taskForm');
const taskHistoryEl = document.getElementById('taskHistory');
const historyItemTemplate = document.getElementById('historyItemTemplate');
const presetButtons = Array.from(document.querySelectorAll('.timer__presets .chip'));
const filterButtons = Array.from(document.querySelectorAll('.filters .chip'));

const STORAGE_KEY = 'flowtime-history';

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

let timerDuration = 25 * 60 * 1000;
let remainingMs = timerDuration;
let deadline = null;
let timerId = null;
let isRunning = false;
let activeFilter = 'today';

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
    console.warn('Konnte gespeicherte Daten nicht laden', error);
    return [];
  }
};

const saveHistory = (history) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

let history = loadHistory();

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const segments = [hours, minutes, seconds].map((segment) => String(segment).padStart(2, '0'));
  return segments.join(':');
};

const updateTimerDisplay = () => {
  timerDisplay.textContent = formatTime(remainingMs);
};

const updateTotalTime = () => {
  const totalMs = history.reduce((acc, entry) => acc + entry.trackedMs, 0);
  totalTimeEl.textContent = formatTime(totalMs);
};

const renderHistory = () => {
  taskHistoryEl.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const now = new Date();

  const filtered = history.filter((entry) => {
    if (activeFilter === 'all') {
      return true;
    }

    const completed = new Date(entry.completedAt);
    if (activeFilter === 'today') {
      return completed.toDateString() === now.toDateString();
    }

    if (activeFilter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      return completed >= startOfWeek && completed < endOfWeek;
    }

    return true;
  });

  filtered
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .forEach((entry) => {
      const node = historyItemTemplate.content.cloneNode(true);
      node.querySelector('.history__task').textContent = entry.taskName;
      node.querySelector('.history__time').textContent = new Date(entry.completedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      node.querySelector('.history__duration').textContent = `⏱ ${formatTime(entry.trackedMs)}`;
      node.querySelector('.history__timestamp').textContent = new Date(entry.completedAt).toLocaleDateString([], {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      });
      fragment.appendChild(node);
    });

  if (!filtered.length) {
    const emptyState = document.createElement('li');
    emptyState.className = 'history__item';
    emptyState.textContent = 'Sobald du eine Session speicherst, taucht sie hier auf.';
    fragment.appendChild(emptyState);
  }

  taskHistoryEl.appendChild(fragment);
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
  startPauseBtn.textContent = remainingMs > 0 ? 'Weiter' : 'Start';
  startPauseBtn.classList.toggle('btn--primary', true);
};

const tick = () => {
  const diff = deadline - Date.now();
  remainingMs = Math.max(0, diff);
  updateTimerDisplay();

  if (remainingMs <= 0) {
    clearTimer();
    isRunning = false;
    startPauseBtn.textContent = 'Start';
    triggerCompletionFeedback();
  }
};

const triggerCompletionFeedback = () => {
  timerDisplay.classList.add('timer__display--complete');
  timerDisplay.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(59, 130, 246, 0.12))';
  setTimeout(() => {
    timerDisplay.classList.remove('timer__display--complete');
    timerDisplay.style.background = '';
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
  startPauseBtn.textContent = 'Pause';
  clearTimer();
  timerId = setInterval(tick, 250);
  tick();
};

startPauseBtn.addEventListener('click', startTimer);

resetBtn.addEventListener('click', () => {
  clearTimer();
  isRunning = false;
  remainingMs = timerDuration;
  updateTimerDisplay();
  startPauseBtn.textContent = 'Start';
});

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    presetButtons.forEach((btn) => btn.classList.remove('chip--active'));
    button.classList.add('chip--active');

    const minutes = Number(button.dataset.minutes || '25');
    timerDuration = minutes * 60 * 1000;
    remainingMs = timerDuration;
    updateTimerDisplay();
    clearTimer();
    isRunning = false;
    startPauseBtn.textContent = 'Start';
  });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('chip--active'));
    button.classList.add('chip--active');
    activeFilter = button.dataset.filter || 'today';
    renderHistory();
  });
});

const handleTaskSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const taskName = String(formData.get('taskName') || '').trim();

  if (!taskName) {
    return;
  }

  const trackedMs = timerDuration - remainingMs;
  if (trackedMs <= 0) {
    alert('Starte den Timer und arbeite mindestens ein paar Sekunden, bevor du die Aufgabe speicherst.');
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
  updateTimerDisplay();
  startPauseBtn.textContent = 'Start';
};

taskForm.addEventListener('submit', handleTaskSubmit);

updateTimerDisplay();
updateTotalTime();
renderHistory();

