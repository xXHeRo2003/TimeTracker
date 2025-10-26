import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../config/constants';
import { translations } from '../i18n/translations';
import { readString, writeString } from '../storage/storage';

const TranslationContext = createContext({
  language: DEFAULT_LANGUAGE,
  locale: 'de-DE',
  isReady: false,
  setLanguage: () => undefined,
  translate: (key) => key
});

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

const normaliseLanguageCode = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const lower = value.toLowerCase();
  if (lower.startsWith('de')) {
    return 'de';
  }
  if (lower.startsWith('en')) {
    return 'en';
  }
  return null;
};

const detectDeviceLanguage = () => {
  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings;
    const locale =
      settings?.AppleLocale || (Array.isArray(settings?.AppleLanguages) ? settings.AppleLanguages[0] : null);
    return normaliseLanguageCode(locale);
  }

  const locale = NativeModules.I18nManager?.localeIdentifier;
  return normaliseLanguageCode(locale);
};

export const TranslationProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await readString(LANGUAGE_STORAGE_KEY);
      if (stored && translations[stored]) {
        setLanguageState(stored);
        setIsReady(true);
        return;
      }

      const detected = detectDeviceLanguage();
      if (detected && translations[detected]) {
        setLanguageState(detected);
      }
      setIsReady(true);
    };

    bootstrap();
  }, []);

  const setLanguage = useCallback(async (nextLanguage) => {
    if (!nextLanguage || !translations[nextLanguage]) {
      return;
    }
    setLanguageState((current) => {
      if (current === nextLanguage) {
        return current;
      }
      return nextLanguage;
    });
    await writeString(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const translate = useCallback(
    (key) =>
      getTranslationValue(language, key) ??
      getTranslationValue(DEFAULT_LANGUAGE, key) ??
      key,
    [language]
  );

  const locale = language === 'de' ? 'de-DE' : 'en-US';

  const value = useMemo(
    () => ({
      language,
      locale,
      translate,
      setLanguage,
      isReady
    }),
    [language, locale, translate, setLanguage, isReady]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => React.useContext(TranslationContext);

