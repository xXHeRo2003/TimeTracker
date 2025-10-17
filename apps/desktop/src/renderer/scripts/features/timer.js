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

export const createTimerController = ({ elements, translate, onComplete }) => {
  let durationMs = DEFAULT_TIMER_MINUTES * 60 * 1000;
  let remainingMs = durationMs;
  let isRunning = false;
  let deadline = null;
  let timerId = null;
  let isEditing = false;
  let shouldRevertInput = false;
  let activeSegmentId = DEFAULT_SEGMENT_ID;

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

    if (remainingMs > 0 && remainingMs < durationMs) {
      setStartButtonLabel('resume');
      return;
    }

    setStartButtonLabel('start');
  };

  const updateTimerDisplay = ({ force = false } = {}) => {
    if (!elements.timerInput) {
      return;
    }

    if (isEditing && !force) {
      return;
    }

    elements.timerInput.value = formatDuration(remainingMs);
  };

  const highlightSegment = (segment) => {
    if (!segment || !elements.timerInput || document.activeElement !== elements.timerInput) {
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

  const setDurationFromMs = (ms, { preserveRunningState = false } = {}) => {
    const safeValue = clampDuration(ms, { min: MIN_TIMER_MS, max: MAX_TIMER_MS });

    if (!preserveRunningState) {
      clearTimer();
      isRunning = false;
      setStartButtonLabel('start');
    }

    durationMs = safeValue;
    remainingMs = safeValue;
    deadline = null;
    updateTimerDisplay({ force: true });
  };

  const adjustTimerBy = (deltaMs) => {
    const nextDuration = durationMs + deltaMs;
    clearPresetSelection();
    setDurationFromMs(nextDuration);
  };

  const adjustTimerByActiveSegment = (direction) => {
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
    const currentIndex = TIME_SEGMENTS.findIndex((segment) => segment.id === activeSegmentId);
    const nextIndex = Math.min(Math.max(currentIndex + offset, 0), TIME_SEGMENTS.length - 1);
    const targetSegment = TIME_SEGMENTS[nextIndex];

    if (targetSegment) {
      setActiveSegment(targetSegment.id, { highlight: true });
    }
  };

  const selectSegmentAtCursor = () => {
    if (!elements.timerInput) {
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
    remainingMs = Math.max(0, deadline - Date.now());
    isRunning = false;
    clearTimer();
    setStartButtonLabel(remainingMs > 0 ? 'resume' : 'start');
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
    const diff = deadline - Date.now();
    remainingMs = Math.max(0, diff);
    updateTimerDisplay();

    if (remainingMs <= 0) {
      clearTimer();
      isRunning = false;
      setStartButtonLabel('start');
      triggerCompletionFeedback();
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  };

  const startTimer = () => {
    if (isRunning) {
      pauseTimer();
      return;
    }

    if (remainingMs <= 0) {
      remainingMs = durationMs;
    }

    deadline = Date.now() + remainingMs;
    isRunning = true;
    setStartButtonLabel('pause');
    clearTimer();
    timerId = setInterval(tick, TIMER_TICK_INTERVAL);
    tick();
  };

  const handleTimerInputCommit = () => {
    if (!elements.timerInput) {
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
      remainingMs = durationMs;
      updateTimerDisplay({ force: true });
      setStartButtonLabel('start');
    });
  }

  if (elements.presetButtons) {
    elements.presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        clearPresetSelection();
        button.classList.add('chip--active');

        const minutes = Number(button.dataset.minutes || DEFAULT_TIMER_MINUTES);
        setDurationFromMs(minutes * 60 * 1000);
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
      isEditing = true;
      shouldRevertInput = false;
      runOnNextFrame(() => setActiveSegment(activeSegmentId, { highlight: true }));
    });

    elements.timerInput.addEventListener('keydown', (event) => {
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
      runOnNextFrame(selectSegmentAtCursor);
    });

    elements.timerInput.addEventListener('touchend', () => {
      runOnNextFrame(selectSegmentAtCursor);
    });

    elements.timerInput.addEventListener('blur', () => {
      const revert = shouldRevertInput;
      shouldRevertInput = false;
      isEditing = false;

      if (revert) {
        updateTimerDisplay({ force: true });
        return;
      }

      handleTimerInputCommit();
    });
  }

  updateTimerDisplay({ force: true });
  updateStartPauseLabel();

  return {
    getDuration: () => durationMs,
    getRemaining: () => remainingMs,
    getTrackedMs: () => durationMs - remainingMs,
    resetAfterTaskSave: () => {
      clearTimer();
      isRunning = false;
      deadline = null;
      remainingMs = durationMs;
      updateTimerDisplay({ force: true });
      setStartButtonLabel('start');
    },
    setDurationFromMs,
    refreshLabels: updateStartPauseLabel
  };
};
