import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';
import './index.css';
import { applyTheme, getPreferredTheme } from './lib/theme';
import { LanguageProvider } from './i18n/I18nProvider';
import { config } from './config';
import PrivyWalletBridge from './components/Auth/PrivyWalletBridge';

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

const inner = (
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  config.privyAppId ? (
    <PrivyProvider
      appId={config.privyAppId}
      clientId={config.privyClientId || undefined}
      // linkedin/twitter return once their OAuth apps are configured in the
      // Privy dashboard — without credentials those buttons 403 in production.
      // `appearance.theme: 'light'` fija el look nativo del modal de Privy para
      // que NO herede el modo oscuro/colores de la app (input de email, etc.).
      config={{
        loginMethods: ['google', 'email'],
        appearance: { theme: 'light' },
      }}
    >
      <PrivyWalletBridge />
      {inner}
    </PrivyProvider>
  ) : inner
);

// Once the app has stayed up for a while, whatever chunk failed earlier has
// since loaded — clear the one-shot guard so a *future* failure (e.g. a chunk
// hash change after a new deploy mid-session) can self-heal once more. The
// delay is what prevents an immediately-refailing chunk from looping.
if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
    } catch {
      /* sessionStorage unavailable — nothing to reset */
    }
  }, 10_000);
}
