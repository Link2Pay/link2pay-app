import { ArrowUpRight, Receipt, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { getPlanLabel, type PlanTier } from '../lib/plans';
import { usePlanStore } from '../store/planStore';

const FEE_BY_PLAN: Record<PlanTier, string> = {
  free: '1.20%',
  pro: '0.85%',
  business: 'Custom volume tier',
};

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    currentPlan: string;
    feeTier: string;
    billingInvoices: string;
    billingDesc: string;
    downloadInvoice: string;
    upgradeTitle: string;
    upgradeDesc: string;
    cta: string;
  }
> = {
  en: {
    title: 'Billing',
    subtitle: 'Track plan, transaction fee tier, and billing documents.',
    currentPlan: 'Current plan',
    feeTier: 'Current fee tier',
    billingInvoices: 'Billing invoices',
    billingDesc: 'Download usage invoices and settlement fee summaries.',
    downloadInvoice: 'Download latest invoice',
    upgradeTitle: 'Reduce fees by upgrading',
    upgradeDesc: 'Pro and Business lower per-transaction fees and unlock extra ops controls.',
    cta: 'View plans',
  },
  es: {
    title: 'Facturacion',
    subtitle: 'Consulta plan, tier de comisiones y documentos de facturacion.',
    currentPlan: 'Plan actual',
    feeTier: 'Tier de comision actual',
    billingInvoices: 'Facturas',
    billingDesc: 'Descarga facturas de uso y resumenes de comisiones.',
    downloadInvoice: 'Descargar ultima factura',
    upgradeTitle: 'Reduce comisiones con upgrade',
    upgradeDesc: 'Pro y Business reducen fees por transaccion y habilitan mas controles.',
    cta: 'Ver planes',
  },
  pt: {
    title: 'Faturamento',
    subtitle: 'Acompanhe plano, tier de taxas e documentos de cobranca.',
    currentPlan: 'Plano atual',
    feeTier: 'Tier de taxa atual',
    billingInvoices: 'Faturas',
    billingDesc: 'Baixe faturas de uso e resumos de taxas de liquidacao.',
    downloadInvoice: 'Baixar ultima fatura',
    upgradeTitle: 'Reduza taxas com upgrade',
    upgradeDesc: 'Pro e Business reduzem taxas por transacao e liberam mais controles.',
    cta: 'Ver planos',
  },
};

export default function Billing() {
  const tier = usePlanStore((state) => state.tier);
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.currentPlan}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{getPlanLabel(tier)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.feeTier}</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{FEE_BY_PLAN[tier]}</p>
        </div>
        <div className="card p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <Receipt className="h-4 w-4 text-primary" />
            {copy.billingInvoices}
          </h3>
          <p className="text-xs text-ink-3">{copy.billingDesc}</p>
          <button type="button" className="btn-secondary mt-3 w-full text-xs">
            {copy.downloadInvoice}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
          <TrendingDown className="h-4 w-4 text-primary" />
          {copy.upgradeTitle}
        </h3>
        <p className="text-sm text-ink-3">{copy.upgradeDesc}</p>
        <Link to="/plans" className="btn-primary mt-3">
          {copy.cta}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
