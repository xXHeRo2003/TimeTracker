export const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const segments = [hours, minutes, seconds].map((segment) => String(segment).padStart(2, '0'));
  return segments.join(':');
};

export const clampDuration = (value, { min, max }) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

export const parseTimerInput = (value) => {
  if (value == null) {
    return null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  if (!raw.includes(':')) {
    const minutes = Number(raw.replace(',', '.'));
    if (!Number.isFinite(minutes) || minutes < 0) {
      return null;
    }
    return Math.round(minutes * 60 * 1000);
  }

  const parts = raw.split(':').map((part) => part.trim());
  if (parts.some((part) => part === '' || /[^0-9]/.test(part))) {
    return null;
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 2) {
    [minutes, seconds] = parts.map(Number);
  } else if (parts.length === 3) {
    [hours, minutes, seconds] = parts.map(Number);
  } else {
    return null;
  }

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    minutes > 59 ||
    seconds > 59 ||
    hours < 0 ||
    minutes < 0 ||
    seconds < 0
  ) {
    return null;
  }

  const totalMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;
  if (totalMs < 0) {
    return null;
  }

  return totalMs;
};

