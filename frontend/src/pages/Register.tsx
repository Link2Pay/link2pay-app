import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { useI18n } from '../i18n/I18nProvider';
import { getBusinessProfile, saveBusinessProfile } from '../services/api';
import Select from '../components/ui/Select';
import BrandMark from '../components/BrandMark';
import { COUNTRY_OPTIONS, railByCountry } from '../config/rails';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  title: string;
  subtitle: string;
  connectedAs: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  countrySelect: string;
  countryOther: string;
  countryRequired: string;
  required: string;
  getStarted: string;
  saving: string;
  saveError: string;
}> = {
  en: {
    title: 'Welcome to Link2Pay',
    subtitle: 'Complete your business profile to start generating payment links',
    connectedAs: 'Authenticated as',
    name: 'Business or display name',
    email: 'Email address',
    phone: 'Phone',
    country: 'Country',
    namePlaceholder: 'Jane Doe Studio',
    emailPlaceholder: 'you@company.com',
    phonePlaceholder: '+57 300 123 4567',
    countrySelect: 'Select a country',
    countryOther: 'Other / not listed',
    countryRequired: 'Select your country to continue.',
    required: '*',
    getStarted: 'Enter Dashboard',
    saving: 'Saving…',
    saveError: 'Could not save your profile. Please try again.',
  },
  es: {
    title: 'Bienvenido a Link2Pay',
    subtitle: 'Completa tu perfil de negocio para comenzar a generar links de pago',
    connectedAs: 'Autenticado como',
    name: 'Nombre del negocio o público',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    country: 'País',
    namePlaceholder: 'Estudio Jane Doe',
    emailPlaceholder: 'tu@empresa.com',
    phonePlaceholder: '+57 300 123 4567',
    countrySelect: 'Selecciona un país',
    countryOther: 'Otro / no listado',
    countryRequired: 'Selecciona tu país para continuar.',
    required: '*',
    getStarted: 'Entrar al panel',
    saving: 'Guardando…',
    saveError: 'No se pudo guardar tu perfil. Inténtalo de nuevo.',
  },
  pt: {
    title: 'Bem-vindo ao Link2Pay',
    subtitle: 'Complete seu perfil de negócio para começar a gerar links de pagamento',
    connectedAs: 'Autenticado como',
    name: 'Nome do negócio ou público',
    email: 'Endereço de email',
    phone: 'Telefone',
    country: 'País',
    namePlaceholder: 'Estúdio João Silva',
    emailPlaceholder: 'voce@empresa.com',
    phonePlaceholder: '+55 11 91234 5678',
    countrySelect: 'Selecione um país',
    countryOther: 'Outro / não listado',
    countryRequired: 'Selecione seu país para continuar.',
    required: '*',
    getStarted: 'Entrar no painel',
    saving: 'Salvando…',
    saveError: 'Não foi possível salvar seu perfil. Tente novamente.',
  },
};

export default function Register() {
  const navigate = useNavigate();
  const { publicKey, connected, privyLoading } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [manualCountry, setManualCountry] = useState(false);
  const [countryMissing, setCountryMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getBusinessProfile(publicKey);
        if (cancelled || !profile) return;
        setName((v) => v || profile.displayName || '');
        setEmail((v) => v || profile.email || '');
        setPhone((v) => v || profile.phone || '');
        setCountry((v) => v || profile.country || '');
        // Legacy free-text countries (pre-selector) fall back to manual entry.
        setManualCountry(Boolean(profile.country && !railByCountry(profile.country)));
      } catch {
        // Prefill is best-effort — an empty form is fine.
      }
    })();
    return () => { cancelled = true; };
  }, [publicKey]);

  useEffect(() => {
    if (!privyLoading && (!connected || !publicKey)) navigate('/login', { replace: true });
  }, [connected, publicKey, privyLoading, navigate]);

  if (!connected || !publicKey) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The country Select isn't a native form control, so `required` can't
    // cover it — validate by hand.
    if (!country.trim()) {
      setCountryMissing(true);
      return;
    }
    setError(false);
    setSaving(true);
    try {
      await saveBusinessProfile(
        {
          displayName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
        },
        publicKey
      );
      navigate('/dashboard');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md">
        <div className="animate-in">
          <div className="text-center mb-6 sm:mb-8">
            <BrandMark className="mx-auto mb-3 block h-12 w-12" />

            <h1 className="text-xl font-bold text-foreground font-display mb-1 sm:text-2xl">{copy.title}</h1>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="mb-6 p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">{copy.connectedAs}</span>
              </div>
              <p className="text-sm font-mono text-foreground mt-1">{truncateAddress(publicKey)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{copy.name} <span className="text-destructive">{copy.required}</span></label>
                <input type="text" className="input" placeholder={copy.namePlaceholder}
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">{copy.email} <span className="text-destructive">{copy.required}</span></label>
                <input type="email" className="input" placeholder={copy.emailPlaceholder}
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">{copy.phone} <span className="text-destructive">{copy.required}</span></label>
                <input type="tel" className="input" placeholder={copy.phonePlaceholder}
                  value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div>
                <label className="label">{copy.country} <span className="text-destructive">{copy.required}</span></label>
                <Select
                  id="reg-country"
                  placeholder={copy.countrySelect}
                  value={manualCountry ? 'OTHER' : (railByCountry(country)?.country ?? '')}
                  options={[
                    ...COUNTRY_OPTIONS.map((o) => ({ value: o.code, label: o.name })),
                    { value: 'OTHER', label: copy.countryOther },
                  ]}
                  onChange={(v) => {
                    setCountryMissing(false);
                    if (v === 'OTHER') { setManualCountry(true); setCountry(''); }
                    else { setManualCountry(false); setCountry(v); }
                  }}
                />
                {manualCountry && (
                  <input type="text" className="input mt-2" placeholder={copy.countryOther}
                    value={country}
                    onChange={(e) => { setCountryMissing(false); setCountry(e.target.value); }} required />
                )}
                {countryMissing && <p className="mt-1 text-xs text-danger">{copy.countryRequired}</p>}
              </div>

              {error && <p className="text-xs text-danger">{copy.saveError}</p>}

              <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={saving}>
                {saving ? copy.saving : copy.getStarted}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
