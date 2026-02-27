import { Download, Lock, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { PLAN_HISTORY_RETENTION, tierAtLeast } from '../lib/plans';
import { usePlanStore } from '../store/planStore';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    gateTitle: string;
    gateDescription: string;
    gateWhatYouGet: string;
    gateCta: string;
    retention: string;
    exportCard: string;
    exportDesc: string;
    exportCsv: string;
    exportJson: string;
    exportAudit: string;
  }
> = {
  en: {
    title: 'Exports & Logs',
    subtitle: 'Compliance-focused export and audit workflows.',
    gateTitle: 'Exports and logs are used for finance reconciliation and audits.',
    gateDescription: 'Upgrade to Business for long retention and advanced export controls.',
    gateWhatYouGet: 'Business unlocks JSON export, audit trail, and event replay workflows.',
    gateCta: 'Upgrade to Business',
    retention: 'Retention window',
    exportCard: 'Advanced exports',
    exportDesc: 'Export CSV/JSON datasets and link-level audit history for operations and finance.',
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
    exportAudit: 'Export audit log',
  },
  es: {
    title: 'Exportaciones y logs',
    subtitle: 'Flujos de exportacion y auditoria orientados a compliance.',
    gateTitle: 'Exportaciones y logs se usan para conciliacion y auditorias.',
    gateDescription: 'Mejora a Business para retencion larga y controles avanzados.',
    gateWhatYouGet: 'Business habilita JSON, audit trail y replay de eventos.',
    gateCta: 'Mejorar a Business',
    retention: 'Ventana de retencion',
    exportCard: 'Exportaciones avanzadas',
    exportDesc: 'Exporta CSV/JSON e historial por link para operaciones y finanzas.',
    exportCsv: 'Exportar CSV',
    exportJson: 'Exportar JSON',
    exportAudit: 'Exportar auditoria',
  },
  pt: {
    title: 'Exportacoes e logs',
    subtitle: 'Fluxos de exportacao e auditoria para compliance.',
    gateTitle: 'Exportacoes e logs sao usados para conciliacao e auditorias.',
    gateDescription: 'Faca upgrade para Business para retencao longa e controles avancados.',
    gateWhatYouGet: 'Business libera JSON, trilha de auditoria e replay de eventos.',
    gateCta: 'Fazer upgrade para Business',
    retention: 'Janela de retencao',
    exportCard: 'Exportacoes avancadas',
    exportDesc: 'Exporte CSV/JSON e historico por link para operacoes e financeiro.',
    exportCsv: 'Exportar CSV',
    exportJson: 'Exportar JSON',
    exportAudit: 'Exportar auditoria',
  },
};

export default function ExportsLogs() {
  const { language } = useI18n();
  const tier = usePlanStore((state) => state.tier);
  const copy = COPY[language];

  const canUseBusiness = tierAtLeast(tier, 'business');

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>

      {!canUseBusiness && (
        <div className="card p-5">
          <div className="mb-2 inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-primary">
            Business
          </div>
          <h3 className="text-sm font-semibold text-ink-0">{copy.gateTitle}</h3>
          <p className="mt-1 text-sm text-ink-3">{copy.gateDescription}</p>
          <p className="mt-2 text-xs text-ink-2">{copy.gateWhatYouGet}</p>
          <Link to="/plans" className="btn-primary mt-4 text-sm">
            {copy.gateCta}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.retention}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{PLAN_HISTORY_RETENTION[tier]}</p>
        </div>

        <div className={`card p-5 ${!canUseBusiness ? 'opacity-75' : ''}`}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <ScrollText className="h-4 w-4 text-primary" />
            {copy.exportCard}
          </h3>
          <p className="text-sm text-ink-3">{copy.exportDesc}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-xs" disabled={!tierAtLeast(tier, 'pro')}>
              <Download className="h-3.5 w-3.5" />
              {copy.exportCsv}
            </button>
            <button type="button" className="btn-secondary text-xs" disabled={!canUseBusiness}>
              <Download className="h-3.5 w-3.5" />
              {copy.exportJson}
            </button>
            <button type="button" className="btn-secondary text-xs" disabled={!canUseBusiness}>
              {!canUseBusiness && <Lock className="h-3.5 w-3.5" />}
              {copy.exportAudit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
