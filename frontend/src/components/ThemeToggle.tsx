import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { ThemeMode, setTheme } from '../lib/theme';
import { useI18n } from '../i18n/I18nProvider';

const getCurrentTheme = (): ThemeMode => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
};

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getCurrentTheme());
  const { t } = useI18n();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-ghost rounded-lg border border-border bg-card px-3 py-2 text-xs sm:text-sm"
      aria-label={theme === 'dark' ? t('theme.switchToWhite') : t('theme.switchToDark')}
      title={theme === 'dark' ? t('theme.switchToWhite') : t('theme.switchToDark')}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === 'dark' ? t('theme.white') : t('theme.dark')}
    </button>
  );
}
