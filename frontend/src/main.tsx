import React from 'react';
import ReactDOM from 'react-dom/client';
import { AcceslyProvider } from 'accesly';
import App from './App';
import './index.css';
import { applyTheme, getPreferredTheme } from './lib/theme';
import { LanguageProvider } from './i18n/I18nProvider';
import { useNetworkStore } from './store/networkStore';

applyTheme(getPreferredTheme());

const appId = import.meta.env.VITE_ACCESLY_APP_ID as string | undefined;
const network = (useNetworkStore.getState().network === 'mainnet' ? 'mainnet' : 'testnet') as 'testnet' | 'mainnet';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AcceslyProvider appId={appId ?? ''} network={network} theme="dark">
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AcceslyProvider>
  </React.StrictMode>
);
