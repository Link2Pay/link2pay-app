import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme, getPreferredTheme } from './lib/theme';
import { LanguageProvider } from './i18n/I18nProvider';
import { AcceslyBridgeProvider } from './components/AcceslyBridgeProvider';

applyTheme(getPreferredTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AcceslyBridgeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AcceslyBridgeProvider>
  </React.StrictMode>
);
