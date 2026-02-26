import { Download, ScrollText } from 'lucide-react';
import PlanGate from '../components/PlanGate';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    gateTitle: string;
    gateDescription: string;
    retention: string;
    retentionValue: string;
    exportCard: string;
    exportDesc: string;
    exportCsv: string;
    exportJson: string;
  }
> = {
  en: {
    title: 'Exports & Logs',
    subtitle: 'Compliance-focused export and audit workflows.',
    gateTitle: 'Exports and logs are Business features',
    gateDescription:
      'Upgrade to Business for long retention, advanced exports, and detailed audit trail access.',
    retention: 'Retention window',
    retentionValue: '12 months',
    exportCard: 'Advanced exports',
    exportDesc:
      'Export CSV/JSON datasets and link-level audit history for operations and finance.',
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
  },
  es: {
    title: 'Exportaciones y logs',
    subtitle: 'Flujos de exportacion y auditoria orientados a compliance.',
    gateTitle: 'Exportaciones y logs son Business',
    gateDescription:
      'Mejora a Business para mayor retencion, exportaciones avanzadas y trazabilidad detallada.',
    retention: 'Ventana de retencion',
    retentionValue: '12 meses',
    exportCard: 'Exportaciones avanzadas',
    exportDesc:
      'Exporta datasets CSV/JSON e historial de auditoria por link para operaciones y finanzas.',
    exportCsv: 'Exportar CSV',
    exportJson: 'Exportar JSON',
  },
  pt: {
    title: 'Exportacoes e logs',
    subtitle: 'Fluxos de exportacao e auditoria para compliance.',
    gateTitle: 'Exportacoes e logs sao recursos Business',
    gateDescription:
      'Faça upgrade para Business para maior retencao, exportacoes avancadas e trilha de auditoria detalhada.',
    retention: 'Janela de retencao',
    retentionValue: '12 meses',
    exportCard: 'Exportacoes avancadas',
    exportDesc:
      'Exporte datasets CSV/JSON e historico de auditoria por link para operacoes e financeiro.',
    exportCsv: 'Exportar CSV',
    exportJson: 'Exportar JSON',
  },
};

export default function ExportsLogs() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <PlanGate
      requiredTier="business"
      title={copy.gateTitle}
      description={copy.gateDescription}
    >
      <div className="space-y-6 animate-in">
        <div>
          <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
          <p className="text-sm text-ink-3">{copy.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card p-5">
            <p className="text-xs text-ink-3">{copy.retention}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{copy.retentionValue}</p>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
              <ScrollText className="h-4 w-4 text-primary" />
              {copy.exportCard}
            </h3>
            <p className="text-sm text-ink-3">{copy.exportDesc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary text-xs">
                <Download className="h-3.5 w-3.5" />
                {copy.exportCsv}
              </button>
              <button type="button" className="btn-secondary text-xs">
                <Download className="h-3.5 w-3.5" />
                {copy.exportJson}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PlanGate>
  );
}
