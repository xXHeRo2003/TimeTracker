import { HISTORY_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from '../config/constants.js';

export const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[storage] Unable to read history from localStorage', error);
    return [];
  }
};

export const saveHistory = (entries) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('[storage] Unable to persist history to localStorage', error);
  }
};

export const readStoredLanguage = () => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('[storage] Unable to read stored language preference', error);
    return null;
  }
};

export const writeStoredLanguage = (language) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('[storage] Unable to persist language preference', error);
  }
};
