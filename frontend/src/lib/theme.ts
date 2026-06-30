export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'link2pay-theme';

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark';

export function getStoredTheme(): ThemeMode | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Direction A (fintech) is light-first: default to light unless the user has
// explicitly stored a preference. Respect that stored choice thereafter.
export function getPreferredTheme(): ThemeMode {
  return getStoredTheme() ?? 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors and still apply in-memory theme.
  }
  applyTheme(theme);
}
