import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { ThemeMode, setTheme } from '../lib/theme';
import { useI18n } from '../i18n/I18nProvider';

const getCurrentTheme = (): ThemeMode => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
};

interface ThemeToggleProps {
  /** 'button' = pill con borde (default); 'menuItem' = fila para el menú de cuenta. */
  variant?: 'button' | 'menuItem' | 'actionRow';
  /** Muestra siempre la etiqueta (por defecto se oculta en pantallas < 420px). */
  alwaysShowLabel?: boolean;
}

export default function ThemeToggle({ variant = 'button', alwaysShowLabel = false }: ThemeToggleProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getCurrentTheme());
  const { t } = useI18n();
  const whiteLabel = t('theme.white');
  const darkLabel = t('theme.dark');
  const switchLabel = theme === 'dark' ? whiteLabel : darkLabel;
  const switchTitle = theme === 'dark' ? t('theme.switchToWhite') : t('theme.switchToDark');
  const Icon = theme === 'dark' ? Sun : Moon;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  if (variant === 'menuItem' || variant === 'actionRow') {
    // Fila de acción contextual para menús y paneles de cuenta.
    return (
      <button
        type="button"
        role={variant === 'menuItem' ? 'menuitem' : undefined}
        onClick={toggleTheme}
        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
        aria-label={switchTitle}
        title={switchTitle}
      >
        <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        {switchLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-ghost rounded-lg border border-border bg-card px-2.5 py-2 text-xs sm:px-3 sm:text-sm"
      aria-label={switchTitle}
      title={switchTitle}
    >
      <Icon className="h-4 w-4" />
      <span className={`relative ${alwaysShowLabel ? 'inline-grid' : 'hidden min-[420px]:inline-grid'}`}>
        <span className="invisible col-start-1 row-start-1">{whiteLabel}</span>
        <span className="invisible col-start-1 row-start-1">{darkLabel}</span>
        <span className="col-start-1 row-start-1">{switchLabel}</span>
      </span>
    </button>
  );
}
