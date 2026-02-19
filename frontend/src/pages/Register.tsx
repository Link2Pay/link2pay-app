import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useWalletStore } from '../store/walletStore';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  title: string;
  subtitle: string;
  connectedAs: string;
  name: string;
  email: string;
  company: string;
  required: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  optional: string;
  getStarted: string;
  skipNow: string;
}> = {
  en: {
    title: 'Welcome to Link2Pay',
    subtitle: 'Set up your freelancer profile to get started',
    connectedAs: 'Connected as',
    name: 'Name',
    email: 'Email',
    company: 'Company',
    required: '*',
    namePlaceholder: 'Your full name',
    emailPlaceholder: 'you@example.com',
    optional: 'Optional',
    getStarted: 'Get Started',
    skipNow: 'Skip for now',
  },
  es: {
    title: 'Bienvenido a Link2Pay',
    subtitle: 'Configura tu perfil freelancer para comenzar',
    connectedAs: 'Conectado como',
    name: 'Nombre',
    email: 'Email',
    company: 'Empresa',
    required: '*',
    namePlaceholder: 'Tu nombre completo',
    emailPlaceholder: 'tu@email.com',
    optional: 'Opcional',
    getStarted: 'Comenzar',
    skipNow: 'Saltar por ahora',
  },
  pt: {
    title: 'Bem-vindo ao Link2Pay',
    subtitle: 'Configure seu perfil freelancer para comecar',
    connectedAs: 'Conectado como',
    name: 'Nome',
    email: 'Email',
    company: 'Empresa',
    required: '*',
    namePlaceholder: 'Seu nome completo',
    emailPlaceholder: 'voce@email.com',
    optional: 'Opcional',
    getStarted: 'Comecar',
    skipNow: 'Pular por enquanto',
  },
};

export default function Register() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWalletStore();
  const { language } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  const copy = COPY[language];

  if (!connected || !publicKey) {
    navigate('/');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex justify-end gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="animate-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-bold font-display">S</span>
            </div>
            <h1 className="text-xl font-bold text-foreground font-display mb-1 sm:text-2xl">{copy.title}</h1>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="mb-6 p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">{copy.connectedAs}</span>
              </div>
              <p className="text-sm font-mono text-foreground mt-1">{truncateAddress(publicKey)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{copy.name} <span className="text-destructive">{copy.required}</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder={copy.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">{copy.email} <span className="text-destructive">{copy.required}</span></label>
                <input
                  type="email"
                  className="input"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">{copy.company}</label>
                <input
                  type="text"
                  className="input"
                  placeholder={copy.optional}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3 text-base mt-2">
                {copy.getStarted}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {copy.skipNow}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
