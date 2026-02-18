import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { ThemeMode, setTheme } from '../lib/theme';

const getCurrentTheme = (): ThemeMode => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
};

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getCurrentTheme());

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
      aria-label={`Switch to ${theme === 'dark' ? 'white' : 'dark'} mode`}
      title={theme === 'dark' ? 'Switch to white mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === 'dark' ? 'White' : 'Dark'}
    </button>
  );
}
