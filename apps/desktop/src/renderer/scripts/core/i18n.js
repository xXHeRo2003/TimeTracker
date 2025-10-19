import { DEFAULT_LANGUAGE } from '../config/constants.js';
import { translations } from '../config/translations.js';
import { readStoredLanguage, writeStoredLanguage } from '../services/storage.js';

const listeners = new Set();

const getTranslationValue = (language, key) => {
  const dictionary = translations[language];
  if (!dictionary) {
    return undefined;
  }

  return key.split('.').reduce((acc, segment) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, segment)) {
      return acc[segment];
    }
    return undefined;
  }, dictionary);
};

const detectPreferredLanguage = () => {
  const navigatorLanguage = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (navigatorLanguage.startsWith('de')) {
    return 'de';
  }
  if (navigatorLanguage.startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LANGUAGE;
};

const resolveInitialLanguage = () => {
  const stored = readStoredLanguage();
  if (stored && translations[stored]) {
    return stored;
  }

  const preferred = detectPreferredLanguage();
  if (translations[preferred]) {
    return preferred;
  }

  return DEFAULT_LANGUAGE;
};

let currentLanguage = resolveInitialLanguage();

export const getLanguage = () => currentLanguage;

export const getLocale = () => (currentLanguage === 'de' ? 'de-DE' : 'en-US');

export const translate = (key) =>
  getTranslationValue(currentLanguage, key) ?? getTranslationValue(DEFAULT_LANGUAGE, key) ?? key;

export const setLanguage = (language) => {
  const nextLanguage = translations[language] ? language : DEFAULT_LANGUAGE;
  if (nextLanguage === currentLanguage) {
    return currentLanguage;
  }

  currentLanguage = nextLanguage;
  writeStoredLanguage(nextLanguage);

  listeners.forEach((listener) => {
    try {
      listener(nextLanguage);
    } catch (error) {
      console.error('[i18n] Listener failed', error);
    }
  });

  return currentLanguage;
};

export const onLanguageChange = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
