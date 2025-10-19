import {
  DEFAULT_SEGMENT_ID,
  DEFAULT_TIMER_MINUTES,
  MAX_TIMER_MS,
  MIN_TIMER_MS,
  TIME_SEGMENTS,
  TIMER_TICK_INTERVAL
} from '../config/constants.js';
import { clampDuration, formatDuration, parseTimerInput } from '../utils/time.js';

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

const TIMER_MODE = Object.freeze({
  COUNTDOWN: 'countdown',
  STOPWATCH: 'stopwatch'
});

export const createTimerController = ({ elements, translate, onComplete }) => {
  let mode = TIMER_MODE.COUNTDOWN;
  let durationMs = DEFAULT_TIMER_MINUTES * 60 * 1000;
  let remainingMs = durationMs;
  let elapsedMs = 0;
  let isRunning = false;
  let deadline = null;
  let stopwatchStartTime = null;
  let timerId = null;
  let isEditing = false;
  let shouldRevertInput = false;
  let activeSegmentId = DEFAULT_SEGMENT_ID;

  const isCountdownMode = () => mode === TIMER_MODE.COUNTDOWN;

  const clearTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const setStartButtonLabel = (state) => {
    const keyByState = {
      start: 'timer.start',
      pause: 'timer.pause',
      resume: 'timer.resume'
    };

    const key = keyByState[state] || keyByState.start;
    if (elements.startPauseBtn) {
      elements.startPauseBtn.textContent = translate(key);
    }
  };

  const updateStartPauseLabel = () => {
    if (isRunning) {
      setStartButtonLabel('pause');
      return;
    }

    if (isCountdownMode()) {
      if (remainingMs > 0 && remainingMs < durationMs) {
        setStartButtonLabel('resume');
        return;
      }
    } else if (elapsedMs > 0) {
      setStartButtonLabel('resume');
      return;
    }

    setStartButtonLabel('start');
  };

  const getDisplayMs = () => (isCountdownMode() ? remainingMs : elapsedMs);

  const updateTimerDisplay = ({ force = false } = {}) => {
    if (!elements.timerInput) {
      return;
    }

    if (isCountdownMode() && isEditing && !force) {
      return;
    }

    elements.timerInput.value = formatDuration(getDisplayMs());
  };

  const highlightSegment = (segment) => {
    if (
      !isCountdownMode() ||
      !segment ||
      !elements.timerInput ||
      document.activeElement !== elements.timerInput
    ) {
      return;
    }
    elements.timerInput.setSelectionRange(segment.start, segment.end);
  };

  const setActiveSegment = (segmentId, { highlight = false } = {}) => {
    const segment = findSegmentById(segmentId);
    if (!segment) {
      return;
    }

    activeSegmentId = segment.id;

    if (highlight) {
      highlightSegment(segment);
    }
  };

  const clearPresetSelection = () => {
    if (!elements.presetButtons) {
      return;
    }
    elements.presetButtons.forEach((button) => button.classList.remove('chip--active'));
  };

  const updateModeUI = () => {
    const countdown = isCountdownMode();

    if (elements.timerModeButtons) {
      elements.timerModeButtons.forEach((button) => {
        const buttonMode = button.dataset.timerMode;
        button.classList.toggle('chip--active', buttonMode === mode);
      });
    }

    if (elements.timerDisplayControls) {
      elements.timerDisplayControls.classList.toggle('is-hidden', !countdown);
    }

    if (elements.timerPresetsContainer) {
      elements.timerPresetsContainer.classList.toggle('is-hidden', !countdown);
    }

    if (elements.presetButtons) {
      elements.presetButtons.forEach((button) => {
        button.disabled = !countdown;
      });
    }

    if (elements.timerIncreaseBtn) {
      elements.timerIncreaseBtn.disabled = !countdown;
    }

    if (elements.timerDecreaseBtn) {
      elements.timerDecreaseBtn.disabled = !countdown;
    }

    if (elements.timerInput) {
      if (countdown) {
        elements.timerInput.removeAttribute('readonly');
        elements.timerInput.classList.remove('timer__display-input--readonly');
      } else {
        elements.timerInput.setAttribute('readonly', 'readonly');
        elements.timerInput.classList.add('timer__display-input--readonly');
      }
    }
  };

  const setDurationFromMs = (ms, { preserveRunningState = false } = {}) => {
    const safeValue = clampDuration(ms, { min: MIN_TIMER_MS, max: MAX_TIMER_MS });

    durationMs = safeValue;
    remainingMs = safeValue;
    if (!preserveRunningState) {
      clearTimer();
      isRunning = false;
      deadline = null;
      stopwatchStartTime = null;
    }

    if (isCountdownMode()) {
      updateTimerDisplay({ force: true });
    }

    updateStartPauseLabel();
  };

  const adjustTimerBy = (deltaMs) => {
    if (!isCountdownMode()) {
      return;
    }

    const nextDuration = durationMs + deltaMs;
    clearPresetSelection();
    setDurationFromMs(nextDuration);
  };

  const adjustTimerByActiveSegment = (direction) => {
    if (!isCountdownMode()) {
      return;
    }

    const segment = findSegmentById(activeSegmentId) ?? findSegmentById(DEFAULT_SEGMENT_ID);
    if (!segment) {
      return;
    }

    adjustTimerBy(direction * segment.stepMs);

    if (elements.timerInput && document.activeElement === elements.timerInput) {
      runOnNextFrame(() => setActiveSegment(segment.id, { highlight: true }));
    }
  };

  const moveActiveSegment = (offset) => {
    if (!isCountdownMode()) {
      return;
    }

    const currentIndex = TIME_SEGMENTS.findIndex((segment) => segment.id === activeSegmentId);
    const nextIndex = Math.min(Math.max(currentIndex + offset, 0), TIME_SEGMENTS.length - 1);
    const targetSegment = TIME_SEGMENTS[nextIndex];

    if (targetSegment) {
      setActiveSegment(targetSegment.id, { highlight: true });
    }
  };

  const selectSegmentAtCursor = () => {
    if (!isCountdownMode() || !elements.timerInput) {
      return;
    }

    const position = elements.timerInput.selectionStart ?? 0;
    const segment = getSegmentFromPosition(position) ?? findSegmentById(DEFAULT_SEGMENT_ID);

    if (segment) {
      setActiveSegment(segment.id, { highlight: true });
    }
  };

  const pauseTimer = () => {
    if (!isRunning) {
      return;
    }

    if (isCountdownMode() && deadline != null) {
      remainingMs = Math.max(0, deadline - Date.now());
    } else if (!isCountdownMode() && stopwatchStartTime != null) {
      elapsedMs = Math.min(MAX_TIMER_MS, Math.max(0, Date.now() - stopwatchStartTime));
    }

    isRunning = false;
    clearTimer();
    deadline = null;
    stopwatchStartTime = null;
    updateStartPauseLabel();
    elements.startPauseBtn?.classList.toggle('btn--primary', true);
  };

  const triggerCompletionFeedback = () => {
    if (!elements.timerDisplay) {
      return;
    }

    elements.timerDisplay.classList.add('timer__display--complete');
    setTimeout(() => {
      elements.timerDisplay.classList.remove('timer__display--complete');
    }, 2500);
  };

  const tick = () => {
    if (isCountdownMode()) {
      if (deadline == null) {
        return;
      }

      const diff = deadline - Date.now();
      remainingMs = Math.max(0, diff);
      updateTimerDisplay();

      if (remainingMs <= 0) {
        clearTimer();
        isRunning = false;
        deadline = null;
        updateStartPauseLabel();
        triggerCompletionFeedback();
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
      return;
    }

    if (stopwatchStartTime == null) {
      return;
    }

    const diff = Date.now() - stopwatchStartTime;
    elapsedMs = Math.min(MAX_TIMER_MS, Math.max(0, diff));
    updateTimerDisplay();

    if (elapsedMs >= MAX_TIMER_MS) {
      pauseTimer();
    }
  };

  const setMode = (nextMode) => {
    const normalizedMode =
      nextMode === TIMER_MODE.STOPWATCH ? TIMER_MODE.STOPWATCH : TIMER_MODE.COUNTDOWN;

    if (mode === normalizedMode) {
      updateModeUI();
      updateTimerDisplay({ force: true });
      updateStartPauseLabel();
      return;
    }

    if (isRunning) {
      pauseTimer();
    } else {
      clearTimer();
    }

    mode = normalizedMode;
    deadline = null;
    stopwatchStartTime = null;
    isEditing = false;
    shouldRevertInput = false;

    updateModeUI();
    updateTimerDisplay({ force: true });
    updateStartPauseLabel();
  };

  const startTimer = () => {
    if (isRunning) {
      pauseTimer();
      return;
    }

    if (isCountdownMode()) {
      if (remainingMs <= 0) {
        remainingMs = durationMs;
      }

      if (remainingMs <= 0) {
        updateTimerDisplay({ force: true });
        updateStartPauseLabel();
        return;
      }

      deadline = Date.now() + remainingMs;
    } else {
      if (elapsedMs >= MAX_TIMER_MS) {
        updateTimerDisplay({ force: true });
        updateStartPauseLabel();
        return;
      }

      stopwatchStartTime = Date.now() - elapsedMs;
    }

    isRunning = true;
    clearTimer();
    updateStartPauseLabel();
    timerId = setInterval(tick, TIMER_TICK_INTERVAL);
    tick();
  };

  const handleTimerInputCommit = () => {
    if (!elements.timerInput) {
      return;
    }

    if (!isCountdownMode()) {
      updateTimerDisplay({ force: true });
      return;
    }

    const parsed = parseTimerInput(elements.timerInput.value);
    if (parsed == null) {
      alert(translate('alerts.invalidTime'));
      updateTimerDisplay({ force: true });
      return;
    }

    clearPresetSelection();
    setDurationFromMs(parsed);
  };

  if (elements.startPauseBtn) {
    elements.startPauseBtn.addEventListener('click', startTimer);
  }

  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', () => {
      clearTimer();
      isRunning = false;
      deadline = null;
      stopwatchStartTime = null;
      remainingMs = durationMs;
      elapsedMs = 0;
      updateTimerDisplay({ force: true });
      updateStartPauseLabel();
    });
  }

  if (elements.presetButtons) {
    elements.presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!isCountdownMode()) {
          return;
        }

        clearPresetSelection();
        button.classList.add('chip--active');

        const minutes = Number(button.dataset.minutes || DEFAULT_TIMER_MINUTES);
        setDurationFromMs(minutes * 60 * 1000);
      });
    });
  }

  if (elements.timerModeButtons) {
    elements.timerModeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setMode(button.dataset.timerMode);
      });
    });
  }

  if (elements.timerIncreaseBtn) {
    elements.timerIncreaseBtn.addEventListener('click', () => {
      adjustTimerByActiveSegment(1);
    });
  }

  if (elements.timerDecreaseBtn) {
    elements.timerDecreaseBtn.addEventListener('click', () => {
      adjustTimerByActiveSegment(-1);
    });
  }

  if (elements.timerInput) {
    elements.timerInput.addEventListener('focus', () => {
      if (!isCountdownMode()) {
        shouldRevertInput = false;
        isEditing = false;
        return;
      }

      isEditing = true;
      shouldRevertInput = false;
      runOnNextFrame(() => setActiveSegment(activeSegmentId, { highlight: true }));
    });

    elements.timerInput.addEventListener('keydown', (event) => {
      if (!isCountdownMode()) {
        if (event.key === 'Enter' || event.key === 'Escape') {
          event.preventDefault();
          elements.timerInput.blur();
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        elements.timerInput.blur();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        shouldRevertInput = true;
        elements.timerInput.blur();
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

    elements.timerInput.addEventListener('mouseup', () => {
      if (!isCountdownMode()) {
        return;
      }
      runOnNextFrame(selectSegmentAtCursor);
    });

    elements.timerInput.addEventListener('touchend', () => {
      if (!isCountdownMode()) {
        return;
      }
      runOnNextFrame(selectSegmentAtCursor);
    });

    elements.timerInput.addEventListener('blur', () => {
      const revert = shouldRevertInput;
      shouldRevertInput = false;
      if (!isCountdownMode()) {
        isEditing = false;
        updateTimerDisplay({ force: true });
        return;
      }

      isEditing = false;

      if (revert) {
        updateTimerDisplay({ force: true });
        return;
      }

      handleTimerInputCommit();
    });
  }

  updateModeUI();
  updateTimerDisplay({ force: true });
  updateStartPauseLabel();

  return {
    getMode: () => mode,
    getDuration: () => durationMs,
    getRemaining: () => remainingMs,
    getTrackedMs: () => (isCountdownMode() ? Math.max(0, durationMs - remainingMs) : elapsedMs),
    isRunning: () => isRunning,
    resetAfterTaskSave: () => {
      clearTimer();
      isRunning = false;
      deadline = null;
      stopwatchStartTime = null;
      remainingMs = durationMs;
      elapsedMs = 0;
      updateTimerDisplay({ force: true });
      updateStartPauseLabel();
    },
    setDurationFromMs,
    setMode,
    refreshLabels: () => {
      updateStartPauseLabel();
      updateModeUI();
      updateTimerDisplay({ force: true });
    }
  };
};
