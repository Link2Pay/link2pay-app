import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronRight, Clock3, FileText, Lock, Zap, type LucideIcon } from 'lucide-react';
import InvoiceForm from '../components/Invoice/InvoiceForm';
import PageHeader from '../components/ui/PageHeader';
import { useI18n } from '../i18n/I18nProvider';
import { useWalletStore } from '../store/walletStore';
import { getKycStatus } from '../services/api';
import type { Language } from '../i18n/translations';
import type { InvoiceType } from '../types';

const COPY: Record<Language, {
  title: string;
  subtitle: string;
  pickerTitle: string;
  pickerSubtitle: string;
  continue: string;
  back: string;
  selectedType: string;
  kycLockedLabel: string;
  kycLockedCta: string;
  types: Record<InvoiceType, { title: string; description: string; detail: string; badge?: string }>;
}> = {
  en: {
    title: 'Create Payment Link',
    subtitle: 'Fill in the details below to create a new payment link',
    pickerTitle: 'Choose link type',
    pickerSubtitle: 'Select the format that best fits your use case',
    continue: 'Continue',
    back: 'Change type',
    kycLockedLabel: 'Requires identity verification',
    kycLockedCta: 'Verify identity',
    selectedType: 'Selected format',
    types: {
      DIRECT_PAYMENT: {
        title: 'Direct Payment',
        description: 'Quick payment link with a single amount. Perfect for one-time requests and freelance gigs.',
        detail: 'Fixed or payer-entered amount',
        badge: 'Simplest',
      },
      BUSINESS_INVOICE: {
        title: 'Business Invoice',
        description: 'Full B2B invoice with line items, quantities, tax, and client details.',
        detail: 'Items, tax, and client records',
      },
      SERVICE_INVOICE: {
        title: 'Service Invoice',
        description: 'Hours-based billing for consulting, development, or professional services.',
        detail: 'Hours, rate, and service notes',
      },
    },
  },
  es: {
    title: 'Crear link de pago',
    subtitle: 'Completa los detalles para crear un nuevo link de pago',
    pickerTitle: 'Elige el tipo de link',
    pickerSubtitle: 'Selecciona el formato que mejor se adapte a tu caso de uso',
    continue: 'Continuar',
    back: 'Cambiar tipo',
    selectedType: 'Formato seleccionado',
    kycLockedLabel: 'Requiere verificación de identidad',
    kycLockedCta: 'Verificar identidad',
    types: {
      DIRECT_PAYMENT: {
        title: 'Pago directo',
        description: 'Link de pago rápido con un solo monto. Perfecto para cobros únicos.',
        detail: 'Monto fijo o ingresado por el pagador',
        badge: 'Más simple',
      },
      BUSINESS_INVOICE: {
        title: 'Factura de negocio',
        description: 'Factura completa con líneas, cantidades, impuestos y datos del cliente.',
        detail: 'Items, impuestos y datos del cliente',
      },
      SERVICE_INVOICE: {
        title: 'Factura de servicios',
        description: 'Facturación por horas para consultoría, desarrollo o servicios profesionales.',
        detail: 'Horas, tarifa y notas del servicio',
      },
    },
  },
  pt: {
    title: 'Criar link de pagamento',
    subtitle: 'Preencha os detalhes abaixo para criar um novo link de pagamento',
    pickerTitle: 'Escolha o tipo de link',
    pickerSubtitle: 'Selecione o formato que melhor se adapta ao seu caso de uso',
    continue: 'Continuar',
    back: 'Mudar tipo',
    selectedType: 'Formato selecionado',
    kycLockedLabel: 'Requer verificação de identidade',
    kycLockedCta: 'Verificar identidade',
    types: {
      DIRECT_PAYMENT: {
        title: 'Pagamento direto',
        description: 'Link de pagamento rápido com valor único. Perfeito para cobranças pontuais.',
        detail: 'Valor fixo ou informado pelo pagador',
        badge: 'Mais simples',
      },
      BUSINESS_INVOICE: {
        title: 'Fatura empresarial',
        description: 'Fatura completa com itens, quantidades, impostos e dados do cliente.',
        detail: 'Itens, impostos e dados do cliente',
      },
      SERVICE_INVOICE: {
        title: 'Fatura de serviços',
        description: 'Cobrança por horas para consultoria, desenvolvimento ou serviços profissionais.',
        detail: 'Horas, tarifa e notas do serviço',
      },
    },
  },
};

const TYPE_VISUALS: Record<InvoiceType, {
  icon: LucideIcon;
  variant: 'featured' | 'neutral';
  chipClass: string;
  accentClass: string;
}> = {
  DIRECT_PAYMENT: {
    icon: Zap,
    variant: 'featured',
    chipClass: 'bg-accent text-accent-foreground',
    accentClass: 'bg-accent',
  },
  BUSINESS_INVOICE: {
    icon: Building2,
    variant: 'neutral',
    chipClass: 'bg-card-invert text-card-invert-foreground',
    accentClass: 'bg-border',
  },
  SERVICE_INVOICE: {
    icon: Clock3,
    variant: 'neutral',
    chipClass: 'bg-muted text-ink-2',
    accentClass: 'bg-border',
  },
};

const TYPE_ORDER: InvoiceType[] = ['DIRECT_PAYMENT', 'BUSINESS_INVOICE', 'SERVICE_INVOICE'];

// BUSINESS_INVOICE and SERVICE_INVOICE require a verified merchant (Wall 1);
// DIRECT_PAYMENT is always free.
const KYC_GATED_TYPES = new Set<InvoiceType>(['BUSINESS_INVOICE', 'SERVICE_INVOICE']);

export default function CreateInvoice() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey } = useWalletStore();
  const [invoiceType, setInvoiceType] = useState<InvoiceType | null>(null);
  // Fail closed: locked until we know otherwise, so a not-yet-verified
  // merchant never sees a brief unlocked flash before the check resolves.
  const [kycVerified, setKycVerified] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setKycVerified(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const view = await getKycStatus(publicKey);
        if (!cancelled) setKycVerified(!view.enforced || view.status === 'VERIFIED');
      } catch {
        // Non-fatal — leave the gate closed and let the backend be the source of truth.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!invoiceType) {
    return (
      <div className="space-y-6 animate-in sm:space-y-8">
        <PageHeader title={copy.title} subtitle={copy.subtitle} icon={FileText} />

        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-0">{copy.pickerTitle}</h2>
            <p className="max-w-2xl text-sm text-ink-3">{copy.pickerSubtitle}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {TYPE_ORDER.map((type) => {
              const info = copy.types[type];
              const visual = TYPE_VISUALS[type];
              const Icon = visual.icon;
              const isFeatured = visual.variant === 'featured';
              const isLocked = KYC_GATED_TYPES.has(type) && !kycVerified;
              const descriptionId = `invoice-type-${type}`;
              const lockedHintId = `invoice-type-locked-${type}`;
              return (
                <div key={type} className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => setInvoiceType(type)}
                    aria-describedby={isLocked ? `${descriptionId} ${lockedHintId}` : descriptionId}
                    className={`group relative min-h-[244px] overflow-hidden rounded-2xl p-5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isLocked
                        ? 'card cursor-not-allowed border border-transparent opacity-50'
                        : isFeatured
                          ? 'bg-card-invert text-card-invert-foreground'
                          : 'card border border-transparent hover:border-border hover:bg-muted'
                    }`}
                  >
                    {isFeatured ? (
                      <div aria-hidden="true" className="pipeline-microtexture pointer-events-none absolute inset-0" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-5 top-0 h-px rounded-b-full ${visual.accentClass}`}
                      />
                    )}

                    <div className="relative flex h-full flex-col">
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${visual.chipClass}`}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-3xs font-bold uppercase tracking-label text-ink-3">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                          </span>
                        ) : (
                          info.badge && (
                            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-3xs font-bold uppercase tracking-label text-card-invert-foreground">
                              {info.badge}
                            </span>
                          )
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`font-display text-xl font-bold tracking-tight ${isFeatured && !isLocked ? '' : 'text-ink-0'}`}>
                          {info.title}
                        </p>
                        <p
                          id={descriptionId}
                          className={`mt-2 text-sm leading-relaxed ${isFeatured && !isLocked ? 'text-card-invert-foreground/70' : 'text-ink-3'}`}
                        >
                          {info.description}
                        </p>
                      </div>

                      <div className={`mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between ${isFeatured && !isLocked ? 'border-white/15' : 'border-border'}`}>
                        <span className={`text-xs font-medium ${isFeatured && !isLocked ? 'text-card-invert-foreground/70' : 'text-ink-3'}`}>
                          {info.detail}
                        </span>
                        {!isLocked && (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold ${isFeatured ? '' : 'text-secondary-foreground group-hover:text-foreground'}`}>
                            {copy.continue}
                            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {isLocked && (
                    <p id={lockedHintId} className="flex items-center gap-1.5 px-1 text-2xs text-ink-3">
                      <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {copy.kycLockedLabel}
                      <Link
                        to="/dashboard/profile-options#kyc-section"
                        className="font-semibold text-accent-ink hover:underline"
                      >
                        {copy.kycLockedCta}
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  const selectedVisual = TYPE_VISUALS[invoiceType];
  const SelectedIcon = selectedVisual.icon;

  return (
    <div className="space-y-6 animate-in sm:space-y-8">
      <PageHeader title={copy.title} subtitle={copy.subtitle} icon={FileText} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setInvoiceType(null)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.back}
        </button>
        <span className="text-xs text-ink-4" aria-hidden="true">/</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-ink-2">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${selectedVisual.chipClass}`}>
            <SelectedIcon className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="text-ink-3">{copy.selectedType}</span>
          <span className="font-bold text-ink-0">{copy.types[invoiceType].title}</span>
        </span>
      </div>

      <InvoiceForm invoiceType={invoiceType} />
    </div>
  );
}
