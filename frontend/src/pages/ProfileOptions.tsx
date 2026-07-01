import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Copy, LogOut, Save, Settings2, ShieldCheck, UserCircle2 } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import ThemeToggle from '../components/ThemeToggle';
import KycGate from '../components/Kyc/KycGate';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useWalletStore } from '../store/walletStore';
import { getBusinessProfile, saveBusinessProfile } from '../services/api';
import type { Currency, SaveProfileData } from '../types';

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
    businessTitle: string;
    businessDesc: string;
    displayName: string;
    legalName: string;
    taxIdLabel: string;
    emailLabel: string;
    phoneLabel: string;
    addressLabel: string;
    cityLabel: string;
    countryLabel: string;
    logoUrlLabel: string;
    defaultCurrencyLabel: string;
    defaultSettlementLabel: string;
    defaultAliasLabel: string;
    crypto: string;
    breb: string;
    save: string;
    saving: string;
    saved: string;
    saveError: string;
    optional: string;
    kycTitle: string;
    kycDesc: string;
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
    businessTitle: 'Business Profile',
    businessDesc: 'Saved once and reused to auto-fill every invoice and your Get Paid page.',
    displayName: 'Business / display name',
    legalName: 'Legal name',
    taxIdLabel: 'Tax ID (NIT / RUT / CUIT)',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    addressLabel: 'Address',
    cityLabel: 'City',
    countryLabel: 'Country',
    logoUrlLabel: 'Logo URL',
    defaultCurrencyLabel: 'Default currency',
    defaultSettlementLabel: 'Default settlement',
    defaultAliasLabel: 'Default Bre-B alias (llave)',
    crypto: 'Crypto',
    breb: 'Bre-B (COP)',
    save: 'Save profile',
    saving: 'Saving...',
    saved: 'Business profile saved',
    saveError: 'Failed to save profile',
    optional: 'Optional',
    kycTitle: 'Identity verification',
    kycDesc: 'Required to receive fiat (Bre-B) payouts. Crypto payouts need no verification.',
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
    businessTitle: 'Perfil de negocio',
    businessDesc: 'Se guarda una vez y se reutiliza para autocompletar cada factura y tu pagina de cobro.',
    displayName: 'Nombre del negocio',
    legalName: 'Razon social',
    taxIdLabel: 'ID fiscal (NIT / RUT / CUIT)',
    emailLabel: 'Email',
    phoneLabel: 'Telefono',
    addressLabel: 'Direccion',
    cityLabel: 'Ciudad',
    countryLabel: 'Pais',
    logoUrlLabel: 'URL del logo',
    defaultCurrencyLabel: 'Moneda predeterminada',
    defaultSettlementLabel: 'Liquidacion predeterminada',
    defaultAliasLabel: 'Llave Bre-B predeterminada',
    crypto: 'Cripto',
    breb: 'Bre-B (COP)',
    save: 'Guardar perfil',
    saving: 'Guardando...',
    saved: 'Perfil de negocio guardado',
    saveError: 'No se pudo guardar el perfil',
    optional: 'Opcional',
    kycTitle: 'Verificación de identidad',
    kycDesc: 'Requerida para recibir pagos en fiat (Bre-B). Los pagos en cripto no requieren verificación.',
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
    businessTitle: 'Perfil de negocio',
    businessDesc: 'Salvo uma vez e reutilizado para preencher cada fatura e sua pagina de cobranca.',
    displayName: 'Nome do negocio',
    legalName: 'Razao social',
    taxIdLabel: 'ID fiscal (CNPJ / CPF)',
    emailLabel: 'Email',
    phoneLabel: 'Telefone',
    addressLabel: 'Endereco',
    cityLabel: 'Cidade',
    countryLabel: 'Pais',
    logoUrlLabel: 'URL do logo',
    defaultCurrencyLabel: 'Moeda padrao',
    defaultSettlementLabel: 'Liquidacao padrao',
    defaultAliasLabel: 'Chave Bre-B padrao',
    crypto: 'Cripto',
    breb: 'Bre-B (COP)',
    save: 'Salvar perfil',
    saving: 'Salvando...',
    saved: 'Perfil de negocio salvo',
    saveError: 'Falha ao salvar o perfil',
    optional: 'Opcional',
    kycTitle: 'Verificação de identidade',
    kycDesc: 'Necessária para receber pagamentos em fiat (Bre-B). Pagamentos em cripto não exigem verificação.',
  },
};

const shorten = (value: string) => `${value.slice(0, 8)}...${value.slice(-8)}`;

const EMPTY_FORM: SaveProfileData = {
  displayName: '',
  legalName: '',
  taxId: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  country: '',
  logoUrl: '',
  defaultCurrency: 'USDC',
  defaultPayoutMethod: 'CRYPTO',
  defaultPayoutAlias: '',
};

export default function ProfileOptions() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey, disconnect } = useWalletStore();
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<SaveProfileData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getBusinessProfile(publicKey);
        if (cancelled || !profile) return;
        setForm({
          displayName: profile.displayName ?? '',
          legalName: profile.legalName ?? '',
          taxId: profile.taxId ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          addressLine: profile.addressLine ?? '',
          city: profile.city ?? '',
          country: profile.country ?? '',
          logoUrl: profile.logoUrl ?? '',
          defaultCurrency: profile.defaultCurrency ?? 'USDC',
          defaultPayoutMethod: profile.defaultPayoutMethod ?? 'CRYPTO',
          defaultPayoutAlias: profile.defaultPayoutAlias ?? '',
        });
      } catch {
        // Profile is optional — leave the form empty on failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const set = (key: keyof SaveProfileData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!publicKey) return;
    setSaving(true);
    try {
      await saveBusinessProfile(form, publicKey);
      toast.success(copy.saved);
    } catch (err: any) {
      toast.error(err?.message || copy.saveError);
    } finally {
      setSaving(false);
    }
  };

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

      {/* Business profile — primary editable identity reused across invoices */}
      <div className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-ink-0">{copy.businessTitle}</h3>
        </div>
        <p className="mb-4 text-xs text-ink-3">{copy.businessDesc}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{copy.displayName}</label>
            <input className="input" value={form.displayName ?? ''}
              onChange={(e) => set('displayName', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.legalName}</label>
            <input className="input" value={form.legalName ?? ''}
              onChange={(e) => set('legalName', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.taxIdLabel}</label>
            <input className="input" value={form.taxId ?? ''}
              onChange={(e) => set('taxId', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.emailLabel}</label>
            <input type="email" className="input" value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.phoneLabel}</label>
            <input className="input" value={form.phone ?? ''}
              onChange={(e) => set('phone', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.logoUrlLabel}</label>
            <input className="input" value={form.logoUrl ?? ''}
              onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{copy.addressLabel}</label>
            <input className="input" value={form.addressLine ?? ''}
              onChange={(e) => set('addressLine', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.cityLabel}</label>
            <input className="input" value={form.city ?? ''}
              onChange={(e) => set('city', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.countryLabel}</label>
            <input className="input" value={form.country ?? ''}
              onChange={(e) => set('country', e.target.value)} placeholder={copy.optional} />
          </div>
          <div>
            <label className="label">{copy.defaultCurrencyLabel}</label>
            <select className="input" value={form.defaultCurrency ?? 'USDC'}
              onChange={(e) => set('defaultCurrency', e.target.value as Currency)}>
              <option value="USDC">USDC</option>
              <option value="EURC">EURC</option>
              <option value="XLM">XLM</option>
            </select>
          </div>
          <div>
            <label className="label">{copy.defaultSettlementLabel}</label>
            <select className="input" value={form.defaultPayoutMethod ?? 'CRYPTO'}
              onChange={(e) => set('defaultPayoutMethod', e.target.value)}>
              <option value="CRYPTO">{copy.crypto}</option>
              <option value="BRE_B">{copy.breb}</option>
            </select>
          </div>
          {form.defaultPayoutMethod === 'BRE_B' && (
            <div className="sm:col-span-2">
              <label className="label">{copy.defaultAliasLabel}</label>
              <input className="input" value={form.defaultPayoutAlias ?? ''}
                onChange={(e) => set('defaultPayoutAlias', e.target.value)}
                placeholder="@nequi-3001234567" />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={handleSave} disabled={saving || !publicKey} className="btn-primary text-sm">
            <Save className="h-4 w-4" />
            {saving ? copy.saving : copy.save}
          </button>
        </div>
      </div>

      {/* Merchant KYC — proactively verify so fiat (Bre-B) links can be created */}
      <div className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-ink-0">{copy.kycTitle}</h3>
        </div>
        <p className="mb-1 text-xs text-ink-3">{copy.kycDesc}</p>
        <KycGate active />
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
            <span className="mt-3 inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
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
