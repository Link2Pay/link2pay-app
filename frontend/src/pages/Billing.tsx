import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Receipt, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listInvoices } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { getPlanLabel, type PlanTier } from '../lib/plans';
import { usePlanStore } from '../store/planStore';
import { useActorWallet } from '../hooks/useActorWallet';

const FEE_RATE_BY_PLAN: Record<PlanTier, number> = {
  free: 0.012,
  pro: 0.008,
  business: 0.005,
};

const FEE_LABEL_BY_PLAN: Record<PlanTier, string> = {
  free: '1.20%',
  pro: '0.80%',
  business: '0.50%',
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
    savingsTitle: string;
    monthlyVolume: string;
    currentFee: string;
    proFee: string;
    businessFee: string;
    saveWithPro: string;
    saveWithBusiness: string;
    exampleNote: string;
  }
> = {
  en: {
    title: 'Billing',
    subtitle: 'Track plan, fee tier, and billing documents.',
    currentPlan: 'Current plan',
    feeTier: 'Current fee tier',
    billingInvoices: 'Billing invoices',
    billingDesc: 'Download usage invoices and settlement fee summaries.',
    downloadInvoice: 'Download latest invoice',
    upgradeTitle: 'Reduce fees by upgrading',
    upgradeDesc: 'Pro and Business lower per-transaction fees and unlock extra ops controls.',
    cta: 'View plans',
    savingsTitle: 'You saved / you could save',
    monthlyVolume: 'Last 30d volume basis',
    currentFee: 'Your current fee',
    proFee: 'Pro fee',
    businessFee: 'Business fee',
    saveWithPro: 'Savings vs current on Pro',
    saveWithBusiness: 'Savings vs current on Business',
    exampleNote: 'No recent volume yet. Showing example on $10,000/mo.',
  },
  es: {
    title: 'Facturacion',
    subtitle: 'Consulta plan, fee tier y documentos de facturacion.',
    currentPlan: 'Plan actual',
    feeTier: 'Fee tier actual',
    billingInvoices: 'Facturas',
    billingDesc: 'Descarga facturas de uso y resumen de comisiones.',
    downloadInvoice: 'Descargar ultima factura',
    upgradeTitle: 'Reduce comisiones con upgrade',
    upgradeDesc: 'Pro y Business reducen fees por transaccion y agregan controles.',
    cta: 'Ver planes',
    savingsTitle: 'Lo que ahorras / podrias ahorrar',
    monthlyVolume: 'Base de volumen ultimos 30d',
    currentFee: 'Tu fee actual',
    proFee: 'Fee Pro',
    businessFee: 'Fee Business',
    saveWithPro: 'Ahorro vs actual en Pro',
    saveWithBusiness: 'Ahorro vs actual en Business',
    exampleNote: 'Sin volumen reciente. Mostrando ejemplo sobre $10,000/mes.',
  },
  pt: {
    title: 'Faturamento',
    subtitle: 'Acompanhe plano, fee tier e documentos de cobranca.',
    currentPlan: 'Plano atual',
    feeTier: 'Fee tier atual',
    billingInvoices: 'Faturas',
    billingDesc: 'Baixe faturas de uso e resumo de taxas.',
    downloadInvoice: 'Baixar ultima fatura',
    upgradeTitle: 'Reduza taxas com upgrade',
    upgradeDesc: 'Pro e Business reduzem fees por transacao e agregam controles.',
    cta: 'Ver planos',
    savingsTitle: 'Quanto voce economizou / pode economizar',
    monthlyVolume: 'Base de volume ultimos 30d',
    currentFee: 'Sua taxa atual',
    proFee: 'Taxa Pro',
    businessFee: 'Taxa Business',
    saveWithPro: 'Economia vs atual no Pro',
    saveWithBusiness: 'Economia vs atual no Business',
    exampleNote: 'Sem volume recente. Exemplo aplicado em $10,000/mes.',
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function Billing() {
  const tier = usePlanStore((state) => state.tier);
  const actorWallet = useActorWallet();
  const { language } = useI18n();
  const copy = COPY[language];

  const [paidVolume30d, setPaidVolume30d] = useState(0);

  useEffect(() => {
    if (!actorWallet) return;

    listInvoices(actorWallet, undefined, 200, 0)
      .then(({ invoices }) => {
        const now = Date.now();
        const cutoff = now - 30 * DAY_MS;
        const volume = (Array.isArray(invoices) ? invoices : []).reduce((sum, invoice) => {
          if (invoice.status !== 'PAID') return sum;
          const paidAtMs = new Date(invoice.paidAt || invoice.updatedAt || invoice.createdAt).getTime();
          if (!Number.isFinite(paidAtMs) || paidAtMs < cutoff) return sum;
          const amount = Number.parseFloat(invoice.total || '0');
          return Number.isFinite(amount) ? sum + amount : sum;
        }, 0);

        setPaidVolume30d(volume);
      })
      .catch(() => setPaidVolume30d(0));
  }, [actorWallet]);

  const currentRate = FEE_RATE_BY_PLAN[tier];

  const savings = useMemo(() => {
    const basis = paidVolume30d > 0 ? paidVolume30d : 10000;
    const currentCost = basis * currentRate;
    const proCost = basis * FEE_RATE_BY_PLAN.pro;
    const businessCost = basis * FEE_RATE_BY_PLAN.business;

    return {
      basis,
      currentCost,
      proCost,
      businessCost,
      saveOnPro: Math.max(0, currentCost - proCost),
      saveOnBusiness: Math.max(0, currentCost - businessCost),
      usingExample: paidVolume30d <= 0,
    };
  }, [currentRate, paidVolume30d]);

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
          <p className="mt-2 text-2xl font-semibold text-primary">{FEE_LABEL_BY_PLAN[tier]}</p>
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
          {copy.savingsTitle}
        </h3>
        <p className="text-xs text-ink-3">
          {copy.monthlyVolume}: <span className="font-mono text-ink-1">{formatUsd(savings.basis)}</span>
        </p>
        {savings.usingExample && <p className="mt-1 text-xs text-ink-3">{copy.exampleNote}</p>}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-surface-3 bg-surface-1 p-3">
            <p className="text-xs text-ink-3">{copy.currentFee}</p>
            <p className="mt-1 text-sm font-semibold text-ink-1">{FEE_LABEL_BY_PLAN[tier]}</p>
            <p className="mt-1 text-xs text-ink-3">{formatUsd(savings.currentCost)}</p>
          </div>
          <div className="rounded-lg border border-surface-3 bg-surface-1 p-3">
            <p className="text-xs text-ink-3">{copy.proFee}</p>
            <p className="mt-1 text-sm font-semibold text-ink-1">{FEE_LABEL_BY_PLAN.pro}</p>
            <p className="mt-1 text-xs text-emerald-600">{copy.saveWithPro}: {formatUsd(savings.saveOnPro)}</p>
          </div>
          <div className="rounded-lg border border-surface-3 bg-surface-1 p-3">
            <p className="text-xs text-ink-3">{copy.businessFee}</p>
            <p className="mt-1 text-sm font-semibold text-ink-1">{FEE_LABEL_BY_PLAN.business}</p>
            <p className="mt-1 text-xs text-emerald-600">{copy.saveWithBusiness}: {formatUsd(savings.saveOnBusiness)}</p>
          </div>
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
