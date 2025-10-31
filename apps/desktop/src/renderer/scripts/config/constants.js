export const LANGUAGE_STORAGE_KEY = 'flowtime-language';
export const BREAK_REMINDER_STORAGE_KEY = 'flowtime-break-reminder';
export const DEFAULT_LANGUAGE = 'de';

export const MIN_TIMER_MS = 0;
export const MAX_TIMER_MS = 99 * 60 * 60 * 1000;
export const DEFAULT_TIMER_MINUTES = 25;
export const TIMER_TICK_INTERVAL = 250;

export const BREAK_REMINDER_DEFAULT_INTERVAL_MINUTES = 50;
export const BREAK_REMINDER_MIN_INTERVAL_MINUTES = 5;
export const BREAK_REMINDER_MAX_INTERVAL_MINUTES = 240;

export const TIME_SEGMENTS = [
  { id: 'hours', start: 0, end: 2, stepMs: 60 * 60 * 1000 },
  { id: 'minutes', start: 3, end: 5, stepMs: 60 * 1000 },
  { id: 'seconds', start: 6, end: 8, stepMs: 1000 }
];

export const DEFAULT_SEGMENT_ID = 'minutes';
