import type { Language } from './translations';

const LANGUAGE_STORAGE_KEY = 'link2pay-language';
const LANGUAGE_SOURCE_STORAGE_KEY = 'link2pay-language-source';
const USER_LANGUAGE_SOURCE = 'user';
const DEFAULT_LANGUAGE: Language = 'es';

export const isLanguage = (value: string | null | undefined): value is Language =>
  value === 'en' || value === 'es' || value === 'pt';

function getLanguageCandidates(): string[] {
  if (typeof navigator === 'undefined') return [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages;
  }
  return navigator.language ? [navigator.language] : [];
}

export function detectDeviceLanguage(): Language {
  for (const candidate of getLanguageCandidates()) {
    const normalized = candidate.toLowerCase().split('-')[0];
    if (isLanguage(normalized)) return normalized;
  }
  return DEFAULT_LANGUAGE;
}

export function getStoredUserLanguage(): Language | null {
  if (typeof window === 'undefined') return null;

  try {
    if (window.localStorage.getItem(LANGUAGE_SOURCE_STORAGE_KEY) !== USER_LANGUAGE_SOURCE) {
      return null;
    }

    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function getPreferredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  return getStoredUserLanguage() ?? detectDeviceLanguage();
}

export function setStoredUserLanguage(language: Language) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.localStorage.setItem(LANGUAGE_SOURCE_STORAGE_KEY, USER_LANGUAGE_SOURCE);
  } catch {
    // Ignore storage errors and still update in-memory language state.
  }
}

