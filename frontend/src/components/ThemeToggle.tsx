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
  const whiteLabel = t('theme.white');
  const darkLabel = t('theme.dark');
  const switchLabel = theme === 'dark' ? whiteLabel : darkLabel;
  const switchTitle = theme === 'dark' ? t('theme.switchToWhite') : t('theme.switchToDark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-ghost rounded-lg border border-border bg-card px-2.5 py-2 text-xs sm:px-3 sm:text-sm"
      aria-label={switchTitle}
      title={switchTitle}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="relative hidden min-[420px]:inline-grid">
        <span className="invisible col-start-1 row-start-1">{whiteLabel}</span>
        <span className="invisible col-start-1 row-start-1">{darkLabel}</span>
        <span className="col-start-1 row-start-1">{switchLabel}</span>
      </span>
    </button>
  );
}
