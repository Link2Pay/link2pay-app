import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, LogOut, Save, UserCircle2 } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import ThemeToggle from '../components/ThemeToggle';
import KycGate from '../components/Kyc/KycGate';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import Field from '../components/ui/Field';
import Select from '../components/ui/Select';
import LinkedAccounts from '../components/Profile/LinkedAccounts';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import { getBusinessProfile, saveBusinessProfile } from '../services/api';
import { shortenAddress } from '../lib/format';
import { COUNTRY_OPTIONS, railByCountry } from '../config/rails';
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
    countrySelect: string;
    countryOther: string;
    logoUrlLabel: string;
    defaultCurrencyLabel: string;
    defaultSettlementLabel: string;
    defaultAliasLabel: string;
    aliasHint: string;
    aliasKycLocked: string;
    crypto: string;
    breb: string;
    save: string;
    saving: string;
    saved: string;
    saveError: string;
    optional: string;
    kycTitle: string;
    kycDesc: string;
    addressSectionTitle: string;
    payoutSectionTitle: string;
    heroFallback: string;
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
    countrySelect: 'Select a country',
    countryOther: 'Other / not listed',
    logoUrlLabel: 'Logo URL',
    defaultCurrencyLabel: 'Default currency',
    defaultSettlementLabel: 'Default settlement',
    defaultAliasLabel: 'Default Bre-B alias (llave)',
    aliasHint: 'Saved even if your default settlement is Crypto — lets you offer Bre-B on individual invoices.',
    aliasKycLocked: 'Verify your identity below to add a Bre-B key.',
    crypto: 'Crypto',
    breb: 'Bre-B (COP)',
    save: 'Save profile',
    saving: 'Saving...',
    saved: 'Business profile saved',
    saveError: 'Failed to save profile',
    optional: 'Optional',
    kycTitle: 'Identity verification',
    kycDesc: 'Required to receive fiat (Bre-B) payouts. Crypto payouts need no verification.',
    addressSectionTitle: 'Address',
    payoutSectionTitle: 'Payout preferences',
    heroFallback: 'Your profile',
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
    countrySelect: 'Selecciona un pais',
    countryOther: 'Otro / no listado',
    logoUrlLabel: 'URL del logo',
    defaultCurrencyLabel: 'Moneda predeterminada',
    defaultSettlementLabel: 'Liquidacion predeterminada',
    defaultAliasLabel: 'Llave Bre-B predeterminada',
    aliasHint: 'Se guarda aunque tu liquidación por defecto sea Cripto — te permite ofrecer Bre-B en facturas puntuales.',
    aliasKycLocked: 'Verifica tu identidad más abajo para agregar una llave Bre-B.',
    crypto: 'Cripto',
    breb: 'Bre-B (COP)',
    save: 'Guardar perfil',
    saving: 'Guardando...',
    saved: 'Perfil de negocio guardado',
    saveError: 'No se pudo guardar el perfil',
    optional: 'Opcional',
    kycTitle: 'Verificación de identidad',
    kycDesc: 'Requerida para recibir pagos en fiat (Bre-B). Los pagos en cripto no requieren verificación.',
    addressSectionTitle: 'Dirección',
    payoutSectionTitle: 'Preferencias de cobro',
    heroFallback: 'Tu perfil',
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
    countrySelect: 'Selecione um pais',
    countryOther: 'Outro / nao listado',
    logoUrlLabel: 'URL do logo',
    defaultCurrencyLabel: 'Moeda padrao',
    defaultSettlementLabel: 'Liquidacao padrao',
    defaultAliasLabel: 'Chave Bre-B padrao',
    aliasHint: 'Salva mesmo que sua liquidacao padrao seja Cripto — permite oferecer Bre-B em faturas pontuais.',
    aliasKycLocked: 'Verifique sua identidade abaixo para adicionar uma chave Bre-B.',
    crypto: 'Cripto',
    breb: 'Bre-B (COP)',
    save: 'Salvar perfil',
    saving: 'Salvando...',
    saved: 'Perfil de negocio salvo',
    saveError: 'Falha ao salvar o perfil',
    optional: 'Opcional',
    kycTitle: 'Verificação de identidade',
    kycDesc: 'Necessária para receber pagamentos em fiat (Bre-B). Pagamentos em cripto não exigem verificação.',
    addressSectionTitle: 'Endereço',
    payoutSectionTitle: 'Preferências de recebimento',
    heroFallback: 'Seu perfil',
  },
};

const shorten = (value: string) => shortenAddress(value, 8, 8);

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
  const { network } = useNetworkStore();
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);

  const [form, setForm] = useState<SaveProfileData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // True when the saved country isn't one of the three supported rails — keeps
  // a free-text field available so legacy / other-country values aren't lost.
  const [manualCountry, setManualCountry] = useState(false);

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
        setManualCountry(Boolean(profile.country && !railByCountry(profile.country)));
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

  // The fiat off-ramp option and its alias adapt to the merchant's country.
  const settlementRail = railByCountry(form.country);

  // Reintenta cargar el logo cuando cambia la URL (tras un error previo).
  useEffect(() => setLogoError(false), [form.logoUrl]);

  const profileInitial = (form.displayName?.[0] || publicKey?.[0] || 'L').toUpperCase();
  const showLogo = Boolean(form.logoUrl) && !logoError;

  const handleSave = async () => {
    if (!publicKey) return;
    setSaving(true);
    try {
      await saveBusinessProfile(form, publicKey);
      toast.success(copy.saved);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('KYC_REQUIRED') || message.toLowerCase().includes('identity verification')) {
        toast.error(copy.aliasKycLocked);
      } else {
        toast.error(err?.message || copy.saveError);
      }
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
    <div className="space-y-6 animate-in sm:space-y-8">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        icon={UserCircle2}
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !publicKey}
            className="btn-primary w-full text-sm sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {saving ? copy.saving : copy.save}
          </button>
        }
      />

      {/* Hero de identidad: avatar (logo o inicial) + nombre + wallet + red */}
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-lg font-semibold text-primary">
          {showLogo ? (
            <img
              src={form.logoUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            profileInitial
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold tracking-tight text-ink-0">
            {form.displayName?.trim() || copy.heroFallback}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-sm text-ink-3">
              {publicKey ? shorten(publicKey) : copy.notConnected}
            </span>
            {publicKey && (
              <button type="button" onClick={handleCopy} className="btn-ghost h-8 px-2 text-xs" title={copy.copy}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? copy.copied : copy.copy}
              </button>
            )}
            {publicKey && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  network === 'testnet' ? 'text-warning' : 'text-success'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${network === 'testnet' ? 'bg-warning' : 'bg-success'}`} />
                {network === 'testnet' ? 'Testnet' : 'Mainnet'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Identidad del negocio */}
      <SectionCard title={copy.businessTitle} hint={copy.businessDesc}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="pf-displayName" label={copy.displayName}>
            <input id="pf-displayName" className="input" value={form.displayName ?? ''}
              onChange={(e) => set('displayName', e.target.value)} placeholder={copy.optional} />
          </Field>
          <Field id="pf-legalName" label={copy.legalName}>
            <input id="pf-legalName" className="input" value={form.legalName ?? ''}
              onChange={(e) => set('legalName', e.target.value)} placeholder={copy.optional} />
          </Field>
          <Field id="pf-taxId" label={copy.taxIdLabel}>
            <input id="pf-taxId" className="input" value={form.taxId ?? ''}
              onChange={(e) => set('taxId', e.target.value)} placeholder={copy.optional} />
          </Field>
          <Field id="pf-email" label={copy.emailLabel}>
            <input id="pf-email" type="email" className="input" value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)} placeholder={copy.optional} />
          </Field>
          <Field id="pf-phone" label={copy.phoneLabel}>
            <input id="pf-phone" className="input" value={form.phone ?? ''}
              onChange={(e) => set('phone', e.target.value)} placeholder={copy.optional} />
          </Field>
          <Field id="pf-logoUrl" label={copy.logoUrlLabel}>
            <div className="flex items-center gap-3">
              {showLogo && (
                <img
                  src={form.logoUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-xl border border-border object-cover"
                  onError={() => setLogoError(true)}
                />
              )}
              <input id="pf-logoUrl" className="input" value={form.logoUrl ?? ''}
                onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://..." />
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Dirección */}
      <SectionCard title={copy.addressSectionTitle}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="pf-address" label={copy.addressLabel}>
              <input id="pf-address" className="input" value={form.addressLine ?? ''}
                onChange={(e) => set('addressLine', e.target.value)} placeholder={copy.optional} />
            </Field>
          </div>
          <Field id="pf-city" label={copy.cityLabel}>
            <input id="pf-city" className="input" value={form.city ?? ''}
              onChange={(e) => set('city', e.target.value)} placeholder={copy.optional} />
          </Field>
          <Field id="pf-country" label={copy.countryLabel}>
            <Select
              id="pf-country"
              placeholder={copy.countrySelect}
              value={manualCountry ? 'OTHER' : (railByCountry(form.country)?.country ?? '')}
              options={[
                ...COUNTRY_OPTIONS.map((o) => ({ value: o.code, label: o.name })),
                { value: 'OTHER', label: copy.countryOther },
              ]}
              onChange={(v) => {
                if (v === 'OTHER') { setManualCountry(true); set('country', ''); }
                else { setManualCountry(false); set('country', v); }
              }}
            />
            {manualCountry && (
              <input className="input mt-2" value={form.country ?? ''}
                onChange={(e) => set('country', e.target.value)} placeholder={copy.optional} />
            )}
          </Field>
        </div>
      </SectionCard>

      {/* Preferencias de cobro */}
      <SectionCard id="payout-section" title={copy.payoutSectionTitle}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="pf-currency" label={copy.defaultCurrencyLabel}>
            <Select
              id="pf-currency"
              value={form.defaultCurrency ?? 'USDC'}
              options={[
                { value: 'USDC', label: 'USDC' },
                { value: 'EURC', label: 'EURC' },
                { value: 'XLM', label: 'XLM' },
              ]}
              onChange={(v) => set('defaultCurrency', v as Currency)}
            />
          </Field>
          <Field id="pf-settlement" label={copy.defaultSettlementLabel}>
            <Select
              id="pf-settlement"
              value={form.defaultPayoutMethod ?? 'CRYPTO'}
              options={[
                { value: 'CRYPTO', label: copy.crypto },
                {
                  value: 'BRE_B',
                  label: settlementRail ? `${settlementRail.railName} (${settlementRail.currency})` : copy.breb,
                },
              ]}
              onChange={(v) => set('defaultPayoutMethod', v)}
            />
          </Field>
          {/* Always visible, independent of defaultPayoutMethod: a merchant may
              want a saved Bre-B key for occasional fiat invoices without
              switching their default settlement method (see Wall 2 —
              requireBreBKeyForFiat only checks this field's presence). */}
          <div className="sm:col-span-2">
            <Field
              id="pf-alias"
              label={settlementRail ? settlementRail.aliasLabel : copy.defaultAliasLabel}
              hint={kycVerified ? copy.aliasHint : copy.aliasKycLocked}
            >
              <input id="pf-alias" className="input" value={form.defaultPayoutAlias ?? ''}
                onChange={(e) => set('defaultPayoutAlias', e.target.value)}
                placeholder={settlementRail?.aliasPlaceholder ?? '@nequi-3001234567'}
                disabled={!kycVerified} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Verificación de identidad (KYC) — required for fiat (Bre-B) payouts
          AND for BUSINESS_INVOICE/SERVICE_INVOICE links regardless of payout
          method, so it stays visible even on fiat-disabled environments. */}
      <SectionCard id="kyc-section" title={copy.kycTitle} hint={copy.kycDesc}>
        <KycGate active onVerifiedChange={setKycVerified} />
      </SectionCard>

      {/* Cuentas vinculadas — Google/LinkedIn/X/Email para iniciar sesión */}
      <LinkedAccounts />

      {/* Preferencias del espacio */}
      <SectionCard title={copy.preferencesTitle} hint={copy.preferencesDesc}>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </SectionCard>

      {/* Sesión */}
      <SectionCard title={copy.actionsTitle}>
        <button type="button" onClick={disconnect} className="btn-danger text-sm">
          <LogOut className="h-4 w-4" />
          {copy.disconnect}
        </button>
      </SectionCard>
    </div>
  );
}
