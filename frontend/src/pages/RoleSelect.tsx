import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useWalletStore } from '../store/walletStore';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  tagline: string;
  freelancerTitle: string;
  freelancerDescription: string;
  connectingWallet: string;
  connectWalletEnter: string;
  clientTitle: string;
  clientDescription: string;
  payInvoice: string;
  failedConnectWallet: string;
}> = {
  en: {
    tagline: 'Instant payment links powered by the Stellar network',
    freelancerTitle: 'Builder',
    freelancerDescription:
      'Create payment links, manage hosted checkout, and track on-chain settlements from your dashboard.',
    connectingWallet: 'Authenticating...',
    connectWalletEnter: 'Connect Wallet & Enter Dashboard',
    clientTitle: 'Payer',
    clientDescription:
      'Complete a payment through a secure, hosted checkout link. Instant settlement, no account required.',
    payInvoice: 'Open Payment Link',
    failedConnectWallet: 'Wallet connection failed',
  },
  es: {
    tagline: 'Links de pago instantaneos impulsados por la red Stellar',
    freelancerTitle: 'Builder',
    freelancerDescription:
      'Crea links de pago, gestiona checkout hospedado y rastrea liquidaciones on-chain desde tu panel.',
    connectingWallet: 'Autenticando...',
    connectWalletEnter: 'Conectar wallet y entrar al panel',
    clientTitle: 'Pagador',
    clientDescription:
      'Completa un pago a traves de un link de checkout seguro y hospedado. Liquidacion instantanea, sin cuenta requerida.',
    payInvoice: 'Abrir link de pago',
    failedConnectWallet: 'Fallo la conexion de wallet',
  },
  pt: {
    tagline: 'Links de pagamento instantaneos na rede Stellar',
    freelancerTitle: 'Builder',
    freelancerDescription:
      'Crie links de pagamento, gerencie checkout hospedado e acompanhe liquidacoes on-chain no seu painel.',
    connectingWallet: 'Autenticando...',
    connectWalletEnter: 'Conectar wallet e entrar no painel',
    clientTitle: 'Pagador',
    clientDescription:
      'Complete um pagamento atraves de um link de checkout seguro e hospedado. Liquidacao instantanea, sem conta necessaria.',
    payInvoice: 'Abrir link de pagamento',
    failedConnectWallet: 'Falha na conexao da wallet',
  },
};

export default function RoleSelect() {
  const navigate = useNavigate();
  const { connected, isConnecting, error, connect } = useWalletStore();
  const { language } = useI18n();
  const [walletError, setWalletError] = useState<string | null>(null);

  const copy = COPY[language];

  const handleFreelancer = async () => {
    if (connected) {
      navigate('/dashboard');
      return;
    }

    setWalletError(null);
    try {
      await connect();
      navigate('/dashboard');
    } catch (err: any) {
      setWalletError(err.message || copy.failedConnectWallet);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex justify-end gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="animate-in">
          <div className="mb-8 text-center sm:mb-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-primary-foreground text-xl font-bold font-display">S</span>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground font-display sm:text-3xl">Link2Pay</h1>
            <p className="text-sm text-muted-foreground">{copy.tagline}</p>
          </div>
          <div className="mb-8 grid grid-cols-1 gap-4 md:mb-12 md:grid-cols-2 md:gap-6">
            <button
              onClick={handleFreelancer}
              disabled={isConnecting}
              className="glass-card group p-5 text-left transition-all duration-300 hover:scale-[1.02] neon-border hover:shadow-lg hover:shadow-primary/10 sm:p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-2">{copy.freelancerTitle}</h2>
              <p className="text-sm text-muted-foreground mb-4">{copy.freelancerDescription}</p>
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {copy.connectingWallet}
                  </span>
                ) : (
                  <>
                    {copy.connectWalletEnter}
                    <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
                  </>
                )}
              </div>
            </button>

            <button
              onClick={() => navigate('/client')}
              className="glass-card group p-5 text-left transition-all duration-300 hover:scale-[1.02] neon-border hover:shadow-lg hover:shadow-primary/10 sm:p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-2">{copy.clientTitle}</h2>
              <p className="text-sm text-muted-foreground mb-4">{copy.clientDescription}</p>
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                {copy.payInvoice}
                <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
              </div>
            </button>
          </div>

          {(walletError || error) && (
            <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center max-w-md mx-auto">
              {walletError || error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
