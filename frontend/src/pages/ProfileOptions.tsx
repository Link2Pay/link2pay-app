import { useState } from 'react';
import { Copy, LogOut, Settings2, UserCircle2 } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import NetworkToggle from '../components/NetworkToggle';
import ThemeToggle from '../components/ThemeToggle';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useWalletStore } from '../store/walletStore';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    profileTitle: string;
    wallet: string;
    connected: string;
    preferencesTitle: string;
    preferencesDesc: string;
    actionsTitle: string;
    disconnect: string;
    copied: string;
    copy: string;
    notConnected: string;
  }
> = {
  en: {
    title: 'Profile & Options',
    subtitle: 'Manage account access and workspace preferences',
    profileTitle: 'Account Profile',
    wallet: 'Wallet address',
    connected: 'Connected',
    preferencesTitle: 'Workspace Preferences',
    preferencesDesc: 'Language, theme, and network are applied instantly.',
    actionsTitle: 'Session',
    disconnect: 'Disconnect wallet',
    copied: 'Copied',
    copy: 'Copy',
    notConnected: 'No wallet connected',
  },
  es: {
    title: 'Perfil y opciones',
    subtitle: 'Gestiona el acceso de la cuenta y las preferencias del espacio',
    profileTitle: 'Perfil de cuenta',
    wallet: 'Direccion de wallet',
    connected: 'Conectada',
    preferencesTitle: 'Preferencias del espacio',
    preferencesDesc: 'Idioma, tema y red se aplican al instante.',
    actionsTitle: 'Sesion',
    disconnect: 'Desconectar wallet',
    copied: 'Copiado',
    copy: 'Copiar',
    notConnected: 'No hay wallet conectada',
  },
  pt: {
    title: 'Perfil e opcoes',
    subtitle: 'Gerencie acesso da conta e preferencias do workspace',
    profileTitle: 'Perfil da conta',
    wallet: 'Endereco da wallet',
    connected: 'Conectada',
    preferencesTitle: 'Preferencias do workspace',
    preferencesDesc: 'Idioma, tema e rede sao aplicados instantaneamente.',
    actionsTitle: 'Sessao',
    disconnect: 'Desconectar wallet',
    copied: 'Copiado',
    copy: 'Copiar',
    notConnected: 'Nenhuma wallet conectada',
  },
};

const shorten = (value: string) => `${value.slice(0, 8)}...${value.slice(-8)}`;

export default function ProfileOptions() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey, disconnect } = useWalletStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures.
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <UserCircle2 className="h-4 w-4 text-primary" />
            {copy.profileTitle}
          </h3>
          <p className="text-xs text-ink-3">{copy.wallet}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 font-mono text-xs text-ink-1">
              {publicKey ? shorten(publicKey) : copy.notConnected}
            </p>
            {publicKey && (
              <button
                type="button"
                onClick={handleCopy}
                className="btn-ghost px-2 py-2 text-xs"
                title={copy.copy}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? copy.copied : copy.copy}
              </button>
            )}
          </div>
          {publicKey && (
            <span className="mt-3 inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
              {copy.connected}
            </span>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <Settings2 className="h-4 w-4 text-primary" />
            {copy.preferencesTitle}
          </h3>
          <p className="mb-4 text-xs text-ink-3">{copy.preferencesDesc}</p>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <NetworkToggle />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-0">{copy.actionsTitle}</h3>
        <button type="button" onClick={disconnect} className="btn-danger text-sm">
          <LogOut className="h-4 w-4" />
          {copy.disconnect}
        </button>
      </div>
    </div>
  );
}
