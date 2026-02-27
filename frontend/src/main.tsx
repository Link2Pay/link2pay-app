import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme, getPreferredTheme } from './lib/theme';
import { LanguageProvider } from './i18n/I18nProvider';

applyTheme(getPreferredTheme());

const CHUNK_RELOAD_FLAG = 'l2p_chunk_reload_attempted';

const isDynamicImportFailure = (reason: unknown): boolean => {
  const message =
    typeof reason === 'string'
      ? reason
      : typeof reason === 'object' && reason && 'message' in reason
        ? String((reason as { message?: unknown }).message ?? '')
        : '';

  if (!message) return false;

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Importing a module script failed')
  );
};

const reloadOnChunkFailure = () => {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(CHUNK_RELOAD_FLAG) === '1') return;
  sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
  window.location.reload();
};

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnChunkFailure();
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (isDynamicImportFailure(event.reason)) {
      event.preventDefault();
      reloadOnChunkFailure();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
