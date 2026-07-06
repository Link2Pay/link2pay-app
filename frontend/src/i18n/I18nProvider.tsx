import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { TRANSLATIONS, type Language, type TranslationKey } from './translations';
import {
  detectDeviceLanguage,
  getPreferredLanguage,
  getStoredUserLanguage,
  setStoredUserLanguage,
} from './language';

type TranslationValues = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const interpolate = (template: string, values?: TranslationValues): string => {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name];
    return value === undefined ? `{${name}}` : String(value);
  });
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getPreferredLanguage());

  const setLanguage = useCallback((nextLanguage: Language) => {
    setStoredUserLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLanguageChange = () => {
      if (getStoredUserLanguage()) return;
      setLanguageState(detectDeviceLanguage());
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  const t = useCallback((key: TranslationKey, values?: TranslationValues) => {
    const template = TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key;
    return interpolate(template, values);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t,
  }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside LanguageProvider');
  }

  return context;
}
