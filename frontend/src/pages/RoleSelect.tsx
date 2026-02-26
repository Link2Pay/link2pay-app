import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import BrandMark from '../components/BrandMark';
import BrandWordmark from '../components/BrandWordmark';
import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';
import {
  loginWithEmail,
  loginWithFreighterWallet,
  registerWithEmail,
} from '../services/accountAuth';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

type Mode = 'login' | 'register';

type CopyBlock = {
  title: string;
  subtitle: string;
  loginTab: string;
  registerTab: string;
  name: string;
  email: string;
  password: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  loginCta: string;
  registerCta: string;
  walletCta: string;
  payerLink: string;
  walletLinkRequired: string;
  homeLink: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    title: 'Sign in to Link2Pay',
    subtitle: 'Use email/password or wallet to access your dashboard.',
    loginTab: 'Login',
    registerTab: 'Create account',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    namePlaceholder: 'Jane Doe',
    emailPlaceholder: 'you@company.com',
    passwordPlaceholder: 'At least 8 characters',
    loginCta: 'Login',
    registerCta: 'Create account',
    walletCta: 'Continue with Wallet',
    payerLink: 'I have a payment link',
    walletLinkRequired: 'Your account has no linked wallet yet. Link a wallet to continue.',
    homeLink: 'Back to Home',
  },
  es: {
    title: 'Inicia sesion en Link2Pay',
    subtitle: 'Usa email/password o wallet para entrar al panel.',
    loginTab: 'Ingresar',
    registerTab: 'Crear cuenta',
    name: 'Nombre',
    email: 'Email',
    password: 'Contrasena',
    namePlaceholder: 'Juan Perez',
    emailPlaceholder: 'tu@empresa.com',
    passwordPlaceholder: 'Minimo 8 caracteres',
    loginCta: 'Ingresar',
    registerCta: 'Crear cuenta',
    walletCta: 'Continuar con wallet',
    payerLink: 'Tengo un link de pago',
    walletLinkRequired: 'Tu cuenta aun no tiene wallet vinculada. Vincula una wallet para continuar.',
    homeLink: 'Volver al inicio',
  },
  pt: {
    title: 'Entrar no Link2Pay',
    subtitle: 'Use email/senha ou wallet para acessar o painel.',
    loginTab: 'Entrar',
    registerTab: 'Criar conta',
    name: 'Nome',
    email: 'Email',
    password: 'Senha',
    namePlaceholder: 'Joao Silva',
    emailPlaceholder: 'voce@empresa.com',
    passwordPlaceholder: 'Pelo menos 8 caracteres',
    loginCta: 'Entrar',
    registerCta: 'Criar conta',
    walletCta: 'Continuar com wallet',
    payerLink: 'Tenho um link de pagamento',
    walletLinkRequired: 'Sua conta ainda nao possui wallet vinculada. Vincule uma wallet para continuar.',
    homeLink: 'Voltar ao inicio',
  },
};

export default function RoleSelect() {
  const navigate = useNavigate();
  const { language } = useI18n();
  const copy = COPY[language];
  const { connect, isConnecting } = useWalletStore();
  const setSession = useAuthStore((state) => state.setSession);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<string | null>(null);

  const applySession = (session: {
    token: string;
    user: {
      id: string;
      email: string | null;
      displayName: string | null;
      wallets: Array<{
        walletAddress: string;
        provider: 'FREIGHTER';
        providerEmail: string | null;
        isPrimary: boolean;
      }>;
    };
    activeWallet: string | null;
  }) => {
    setSession(session);
    if (session.activeWallet) {
      navigate('/app');
    } else {
      setWalletInfo(copy.walletLinkRequired);
    }
  };

  const handleEmailAuth = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setWalletInfo(null);

    try {
      const session =
        mode === 'register'
          ? await registerWithEmail({
              email,
              password,
              displayName: name || undefined,
            })
          : await loginWithEmail({ email, password });

      applySession(session);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFreighterLogin = async () => {
    setSubmitting(true);
    setError(null);
    setWalletInfo(null);

    try {
      await connect();
      const walletAddress = useWalletStore.getState().publicKey;
      if (!walletAddress) {
        throw new Error('Wallet connection failed');
      }

      const session = await loginWithFreighterWallet({
        walletAddress,
        email: email || undefined,
        displayName: name || undefined,
      });
      applySession(session);
    } catch (err: any) {
      setError(err?.message || 'Wallet login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="text-sm text-muted-foreground transition-colors hover:text-stellar-500"
          >
            {copy.homeLink}
          </Link>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="animate-in">
          <div className="mb-6 text-center sm:mb-8">
            <BrandMark className="mx-auto mb-4 h-14 w-14 rounded-2xl p-2.5 shadow-lg shadow-primary/25" />
            <h1 className="mb-2 text-2xl font-bold font-display sm:text-3xl">
              <BrandWordmark />
            </h1>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{copy.title}</h2>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {copy.loginTab}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {copy.registerTab}
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="label">{copy.name}</label>
                  <input
                    type="text"
                    className="input"
                    placeholder={copy.namePlaceholder}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="label">{copy.email}</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div>
                <label className="label">{copy.password}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="input"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
                {submitting ? '...' : mode === 'register' ? copy.registerCta : copy.loginCta}
              </button>
            </form>

            <div className="my-4 text-center text-xs text-muted-foreground">OR</div>

            <button
              type="button"
              onClick={handleFreighterLogin}
              disabled={submitting || isConnecting}
              className="btn-secondary w-full py-3 text-sm"
            >
              {copy.walletCta}
            </button>

            {(error || walletInfo) && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error || walletInfo}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/checkout" className="text-sm text-muted-foreground hover:text-stellar-500 transition-colors">
              {copy.payerLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
