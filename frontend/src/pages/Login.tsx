import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton, useAccesly } from 'accesly';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import BrandMark from '../components/BrandMark';
import BrandWordmark from '../components/BrandWordmark';
import { useWalletStore } from '../store/walletStore';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  tagline: string;
  builderTitle: string;
  builderDescription: string;
  connectFreighter: string;
  connectingWallet: string;
  orDivider: string;
  acceslyLabel: string;
  payerTitle: string;
  payerDescription: string;
  openPaymentLink: string;
  failedConnect: string;
  backToHome: string;
}> = {
  en: {
    tagline: 'Instant payment links powered by the Stellar network',
    builderTitle: 'Builder',
    builderDescription:
      'Create payment links, manage hosted checkout, and track on-chain settlements from your dashboard.',
    connectFreighter: 'Connect Freighter Wallet',
    connectingWallet: 'Connecting...',
    orDivider: 'or',
    acceslyLabel: 'Sign in with email',
    payerTitle: 'Payer',
    payerDescription:
      'Complete a payment through a secure, hosted checkout link. Instant settlement, no account required.',
    openPaymentLink: 'Open Payment Link',
    failedConnect: 'Wallet connection failed',
    backToHome: 'Back to Home',
  },
  es: {
    tagline: 'Links de pago instantaneos impulsados por la red Stellar',
    builderTitle: 'Builder',
    builderDescription:
      'Crea links de pago, gestiona checkout hospedado y rastrea liquidaciones on-chain desde tu panel.',
    connectFreighter: 'Conectar Freighter Wallet',
    connectingWallet: 'Conectando...',
    orDivider: 'o',
    acceslyLabel: 'Iniciar sesion con email',
    payerTitle: 'Pagador',
    payerDescription:
      'Completa un pago a traves de un link de checkout seguro y hospedado. Liquidacion instantanea, sin cuenta requerida.',
    openPaymentLink: 'Abrir link de pago',
    failedConnect: 'Fallo la conexion de wallet',
    backToHome: 'Volver al inicio',
  },
  pt: {
    tagline: 'Links de pagamento instantaneos na rede Stellar',
    builderTitle: 'Builder',
    builderDescription:
      'Crie links de pagamento, gerencie checkout hospedado e acompanhe liquidacoes on-chain no seu painel.',
    connectFreighter: 'Conectar Freighter Wallet',
    connectingWallet: 'Conectando...',
    orDivider: 'ou',
    acceslyLabel: 'Entrar com email',
    payerTitle: 'Pagador',
    payerDescription:
      'Complete um pagamento atraves de um link de checkout seguro e hospedado. Liquidacao instantanea, sem conta necessaria.',
    openPaymentLink: 'Abrir link de pagamento',
    failedConnect: 'Falha na conexao da wallet',
    backToHome: 'Voltar ao inicio',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { connected, isConnecting, error: freighterError, connect } = useWalletStore();
  const { wallet: acceslyWallet } = useAccesly();
  const { language } = useI18n();
  const [connectError, setConnectError] = useState<string | null>(null);

  const copy = COPY[language];

  // Redirect to dashboard when either auth method succeeds
  useEffect(() => {
    if (connected || acceslyWallet) {
      navigate('/dashboard');
    }
  }, [connected, acceslyWallet, navigate]);

  const handleFreighterConnect = async () => {
    setConnectError(null);
    try {
      await connect();
      // navigation is handled by the useEffect above
    } catch (err: any) {
      setConnectError(err.message || copy.failedConnect);
    }
  };

  const displayError = connectError || freighterError;

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-stellar-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {copy.backToHome}
          </button>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="animate-in">
          {/* Brand header */}
          <div className="mb-8 text-center sm:mb-12">
            <BrandMark className="mx-auto mb-4 h-14 w-14 rounded-2xl p-2.5 shadow-lg shadow-primary/25" />
            <h1 className="mb-2 text-2xl font-bold font-display sm:text-3xl">
              <BrandWordmark />
            </h1>
            <p className="text-sm text-muted-foreground">{copy.tagline}</p>
          </div>

          {/* Role cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:mb-12 md:grid-cols-2 md:gap-6">
            {/* Builder card */}
            <div className="glass-card p-5 sm:p-8 neon-border">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-2">{copy.builderTitle}</h2>
              <p className="text-sm text-muted-foreground mb-6">{copy.builderDescription}</p>

              {/* Freighter option */}
              <button
                onClick={handleFreighterConnect}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
              >
                {isConnecting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {copy.connectingWallet}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6" />
                    </svg>
                    {copy.connectFreighter}
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{copy.orDivider}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Accesly ConnectButton */}
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>

            {/* Payer card */}
            <button
              onClick={() => navigate('/checkout')}
              className="glass-card group p-5 text-left transition-all duration-300 hover:scale-[1.02] neon-border hover:shadow-lg hover:shadow-primary/10 sm:p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground font-display mb-2">{copy.payerTitle}</h2>
              <p className="text-sm text-muted-foreground mb-4">{copy.payerDescription}</p>
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                {copy.openPaymentLink}
                <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
              </div>
            </button>
          </div>

          {/* Error display */}
          {displayError && (
            <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center max-w-md mx-auto">
              {displayError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
