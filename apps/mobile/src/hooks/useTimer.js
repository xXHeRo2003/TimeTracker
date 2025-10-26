import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_TIMER_MINUTES,
  MAX_TIMER_MS,
  MIN_TIMER_MS,
  TIMER_TICK_INTERVAL
} from '../config/constants';
import { clampDuration, formatDuration, parseTimerInput } from '../utils/time';

const TIMER_MODE = {
  COUNTDOWN: 'countdown',
  STOPWATCH: 'stopwatch'
};

const minutesToMs = (minutes) => Math.round(minutes * 60 * 1000);

export const useTimer = ({ onComplete } = {}) => {
  const [mode, setModeState] = useState(TIMER_MODE.COUNTDOWN);
  const [durationMs, setDurationMs] = useState(minutesToMs(DEFAULT_TIMER_MINUTES));
  const [remainingMs, setRemainingMs] = useState(minutesToMs(DEFAULT_TIMER_MINUTES));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const durationRef = useRef(durationMs);
  const remainingRef = useRef(remainingMs);
  const elapsedRef = useRef(elapsedMs);
  const modeRef = useRef(mode);
  const isRunningRef = useRef(isRunning);
  const intervalRef = useRef(null);
  const countdownDeadlineRef = useRef(null);
  const stopwatchOriginRef = useRef(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    remainingRef.current = remainingMs;
  }, [remainingMs]);

  useEffect(() => {
    elapsedRef.current = elapsedMs;
  }, [elapsedMs]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    countdownDeadlineRef.current = null;
    stopwatchOriginRef.current = null;
    hasCompletedRef.current = false;
    setIsRunning(false);
  }, []);

  const tick = useCallback(() => {
    if (!isRunningRef.current) {
      return;
    }

    if (modeRef.current === TIMER_MODE.COUNTDOWN) {
      const deadline = countdownDeadlineRef.current;
      if (!deadline) {
        return;
      }
      const nextRemaining = Math.max(0, deadline - Date.now());
      setRemainingMs(nextRemaining);
      setElapsedMs(Math.min(durationRef.current, durationRef.current - nextRemaining));

      if (nextRemaining <= 0) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          stopTimer();
          setRemainingMs(0);
          setElapsedMs(durationRef.current);
          onComplete?.({ mode: TIMER_MODE.COUNTDOWN });
        }
      }
      return;
    }

    // Stopwatch mode
    const origin = stopwatchOriginRef.current;
    if (!origin) {
      return;
    }
    const nextElapsed = Math.max(0, Date.now() - origin);
    setElapsedMs(nextElapsed);
  }, [onComplete, stopTimer]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(tick, TIMER_TICK_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, tick]);

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    []
  );

  const setMode = useCallback((nextMode) => {
    const resolvedMode = nextMode === TIMER_MODE.STOPWATCH ? TIMER_MODE.STOPWATCH : TIMER_MODE.COUNTDOWN;
    setModeState((current) => {
      if (current === resolvedMode) {
        return current;
      }
      stopTimer();
      if (resolvedMode === TIMER_MODE.COUNTDOWN) {
        setRemainingMs(durationRef.current);
        setElapsedMs(0);
      } else {
        setElapsedMs(0);
      }
      return resolvedMode;
    });
  }, [stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    setRemainingMs(durationRef.current);
    setElapsedMs(0);
  }, [stopTimer]);

  const start = useCallback(() => {
    if (isRunningRef.current) {
      return;
    }

    if (modeRef.current === TIMER_MODE.COUNTDOWN) {
      const currentRemaining = remainingRef.current <= 0 ? durationRef.current : remainingRef.current;
      setRemainingMs(currentRemaining);
      setElapsedMs(durationRef.current - currentRemaining);
      countdownDeadlineRef.current = Date.now() + currentRemaining;
    } else {
      stopwatchOriginRef.current = Date.now() - elapsedRef.current;
    }

    hasCompletedRef.current = false;
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (!isRunningRef.current) {
      return;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (modeRef.current === TIMER_MODE.COUNTDOWN) {
      const nextRemaining = Math.max(0, countdownDeadlineRef.current - Date.now());
      setRemainingMs(nextRemaining);
      setElapsedMs(durationRef.current - nextRemaining);
    } else {
      const nextElapsed = Math.max(0, Date.now() - stopwatchOriginRef.current);
      setElapsedMs(nextElapsed);
    }
    countdownDeadlineRef.current = null;
    stopwatchOriginRef.current = null;
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (isRunningRef.current) {
      return;
    }
    if (modeRef.current === TIMER_MODE.COUNTDOWN) {
      const currentRemaining = Math.max(0, remainingRef.current);
      if (currentRemaining <= 0) {
        setRemainingMs(durationRef.current);
        countdownDeadlineRef.current = Date.now() + durationRef.current;
      } else {
        countdownDeadlineRef.current = Date.now() + currentRemaining;
      }
    } else {
      stopwatchOriginRef.current = Date.now() - elapsedRef.current;
    }
    hasCompletedRef.current = false;
    setIsRunning(true);
  }, []);

  const setDurationFromMs = useCallback(
    (value) => {
      const clamped = clampDuration(value, { min: MIN_TIMER_MS, max: MAX_TIMER_MS });
      setDurationMs(clamped);
      if (modeRef.current === TIMER_MODE.COUNTDOWN) {
        if (!isRunningRef.current) {
          setRemainingMs(clamped);
          setElapsedMs(0);
        } else {
          setRemainingMs((current) => Math.min(current, clamped));
        }
      }
    },
    []
  );

  const setDurationFromInput = useCallback(
    (value) => {
      const parsed = parseTimerInput(value);
      if (parsed == null) {
        return false;
      }
      setDurationFromMs(parsed);
      return true;
    },
    [setDurationFromMs]
  );

  const adjustDuration = useCallback(
    (deltaMs) => {
      if (modeRef.current !== TIMER_MODE.COUNTDOWN) {
        return;
      }
      if (Math.abs(deltaMs) < 1) {
        return;
      }
      const nextDuration = clampDuration(durationRef.current + deltaMs, {
        min: MIN_TIMER_MS,
        max: MAX_TIMER_MS
      });
      setDurationMs(nextDuration);
      if (!isRunningRef.current) {
        setRemainingMs(nextDuration);
        setElapsedMs(0);
      } else {
        setRemainingMs((current) => clampDuration(current + deltaMs, { min: 0, max: nextDuration }));
      }
    },
    []
  );

  const setDurationFromPreset = useCallback(
    (minutes) => {
      if (typeof minutes !== 'number') {
        return;
      }
      setDurationFromMs(minutesToMs(minutes));
    },
    [setDurationFromMs]
  );

  const trackedMs = useMemo(
    () => (mode === TIMER_MODE.COUNTDOWN ? Math.max(0, durationMs - remainingMs) : elapsedMs),
    [durationMs, elapsedMs, mode, remainingMs]
  );

  const displayMs = useMemo(
    () => (mode === TIMER_MODE.COUNTDOWN ? remainingMs : elapsedMs),
    [mode, remainingMs, elapsedMs]
  );

  const displayValue = useMemo(() => formatDuration(displayMs), [displayMs]);

  const canStart = useMemo(() => {
    if (mode === TIMER_MODE.COUNTDOWN) {
      return durationMs > 0;
    }
    return true;
  }, [mode, durationMs]);

  return {
    mode,
    setMode,
    durationMs,
    remainingMs,
    elapsedMs,
    trackedMs,
    isRunning,
    canStart,
    start,
    pause,
    resume,
    reset,
    setDurationFromMs,
    setDurationFromInput,
    adjustDuration,
    setDurationFromPreset,
    displayMs,
    displayValue,
    TIMER_MODE
  };
};

