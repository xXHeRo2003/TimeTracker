const DAY_INDEX_BY_KEY = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

const cache = new Map();

export const resolveFirstDayOfWeekIndex = (locale) => {
  const cacheKey = locale || 'default';
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
    try {
      const localeInstance = new Intl.Locale(locale || 'en-US');
      if (localeInstance?.weekInfo?.firstDay) {
        const mapped = DAY_INDEX_BY_KEY[localeInstance.weekInfo.firstDay];
        if (mapped != null) {
          cache.set(cacheKey, mapped);
          return mapped;
        }
      }
    } catch (error) {
      console.warn('[dateRange] Unable to resolve first day of week from Intl API', error);
    }
  }

  const fallback = locale && locale.startsWith('de') ? 1 : 0;
  cache.set(cacheKey, fallback);
  return fallback;
};

export const getStartOfWeek = (referenceDate, locale) => {
  const base = new Date(referenceDate);
  const firstDayOfWeek = resolveFirstDayOfWeekIndex(locale);
  const day = base.getDay();

  base.setHours(0, 0, 0, 0);

  const diff = (day < firstDayOfWeek ? 7 : 0) + day - firstDayOfWeek;
  base.setDate(base.getDate() - diff);

  return base;
};

export const getEndOfWeek = (referenceDate, locale) => {
  const start = getStartOfWeek(referenceDate, locale);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
};

export const resetDateRangeCache = () => {
  cache.clear();
};

