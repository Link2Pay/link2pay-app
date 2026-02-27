import { useState } from 'react';
import { Activity, Lock, RefreshCw, Webhook } from 'lucide-react';
import { Link } from 'react-router-dom';
import PlanLockModal from '../components/PlanLockModal';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { tierAtLeast } from '../lib/plans';
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
    endpoint: string;
    endpointHint: string;
    save: string;
    retriesTitle: string;
    retriesDesc: string;
    businessCard: string;
    businessDesc: string;
    lockTitle: string;
    lockDescription: string;
  }
> = {
  en: {
    title: 'Webhooks',
    subtitle: 'Reliability layer for payment events and delivery retries.',
    gateTitle: 'Webhooks are used to confirm payments server-side in real time.',
    gateDescription: 'Upgrade to Pro to unlock webhook endpoints and signed delivery.',
    gateWhatYouGet: 'Pro includes retries and signing secret. Business adds replay and detailed logs.',
    gateCta: 'Upgrade to Pro',
    endpoint: 'Webhook endpoint',
    endpointHint: 'Example: https://api.yourapp.com/link2pay/webhooks',
    save: 'Save endpoint',
    retriesTitle: 'Delivery retries and signing',
    retriesDesc: 'Automatic retries and signing secret support for verification.',
    businessCard: 'Delivery logs and replay',
    businessDesc: 'Business unlocks per-attempt logs, response codes, and event replay workflows.',
    lockTitle: 'Delivery logs and replay are Business',
    lockDescription: 'Upgrade to Business to inspect webhook attempts and replay specific events.',
  },
  es: {
    title: 'Webhooks',
    subtitle: 'Capa de confiabilidad para eventos de pago y reintentos.',
    gateTitle: 'Webhooks se usan para confirmar pagos en tiempo real desde backend.',
    gateDescription: 'Mejora a Pro para habilitar endpoint y delivery firmado.',
    gateWhatYouGet: 'Pro incluye reintentos y secreto de firma. Business agrega replay y logs.',
    gateCta: 'Mejorar a Pro',
    endpoint: 'Endpoint de webhook',
    endpointHint: 'Ejemplo: https://api.tuapp.com/link2pay/webhooks',
    save: 'Guardar endpoint',
    retriesTitle: 'Reintentos y firma',
    retriesDesc: 'Reintentos automaticos y secreto de firma para verificacion.',
    businessCard: 'Logs de delivery y replay',
    businessDesc: 'Business habilita logs por intento, codigos de respuesta y replay de eventos.',
    lockTitle: 'Logs y replay son Business',
    lockDescription: 'Mejora a Business para inspeccionar intentos y reenviar eventos.',
  },
  pt: {
    title: 'Webhooks',
    subtitle: 'Camada de confiabilidade para eventos de pagamento e retentativas.',
    gateTitle: 'Webhooks sao usados para confirmar pagamentos em tempo real no backend.',
    gateDescription: 'Faca upgrade para Pro para habilitar endpoint e entrega assinada.',
    gateWhatYouGet: 'Pro inclui retries e segredo de assinatura. Business adiciona replay e logs.',
    gateCta: 'Fazer upgrade para Pro',
    endpoint: 'Endpoint de webhook',
    endpointHint: 'Exemplo: https://api.seuapp.com/link2pay/webhooks',
    save: 'Salvar endpoint',
    retriesTitle: 'Retentativas e assinatura',
    retriesDesc: 'Retentativas automaticas e segredo de assinatura para verificacao.',
    businessCard: 'Logs de entrega e replay',
    businessDesc: 'Business libera logs por tentativa, codigos de resposta e replay de eventos.',
    lockTitle: 'Logs e replay sao Business',
    lockDescription: 'Faca upgrade para Business para inspecionar tentativas e reenviar eventos.',
  },
};

export default function Webhooks() {
  const tier = usePlanStore((state) => state.tier);
  const { language } = useI18n();
  const copy = COPY[language];
  const [endpoint, setEndpoint] = useState('');
  const [showBusinessLock, setShowBusinessLock] = useState(false);
  const canUseWebhooks = tierAtLeast(tier, 'pro');
  const canUseBusinessLogs = tierAtLeast(tier, 'business');

  return (
    <>
      <div className="space-y-6 animate-in">
        <div>
          <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
          <p className="text-sm text-ink-3">{copy.subtitle}</p>
        </div>

        {!canUseWebhooks && (
          <div className="card p-5">
            <div className="mb-2 inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-primary">
              Pro
            </div>
            <h3 className="text-sm font-semibold text-ink-0">{copy.gateTitle}</h3>
            <p className="mt-1 text-sm text-ink-3">{copy.gateDescription}</p>
            <p className="mt-2 text-xs text-ink-2">{copy.gateWhatYouGet}</p>
            <Link to="/plans" className="btn-primary mt-4 text-sm">
              {copy.gateCta}
            </Link>
          </div>
        )}

        <div className={`card p-5 ${!canUseWebhooks ? 'opacity-75' : ''}`}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <Webhook className="h-4 w-4 text-primary" />
            {copy.endpoint}
          </h3>
          <input
            className="input"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder={copy.endpointHint}
            disabled={!canUseWebhooks}
          />
          <button type="button" className="btn-primary mt-3" disabled={!canUseWebhooks}>
            {copy.save}
          </button>
        </div>

        <div className={`card p-5 ${!canUseWebhooks ? 'opacity-75' : ''}`}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
            <RefreshCw className="h-4 w-4 text-primary" />
            {copy.retriesTitle}
          </h3>
          <p className="text-sm text-ink-3">{copy.retriesDesc}</p>
        </div>

        <div className={`card p-5 ${!canUseWebhooks ? 'opacity-75' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
                <Activity className="h-4 w-4 text-primary" />
                {copy.businessCard}
              </h3>
              <p className="text-sm text-ink-3">{copy.businessDesc}</p>
            </div>
            {!canUseBusinessLogs && (
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs"
                onClick={() => setShowBusinessLock(true)}
              >
                <Lock className="h-3.5 w-3.5" />
                Business
              </button>
            )}
          </div>
        </div>
      </div>

      <PlanLockModal
        open={showBusinessLock}
        requiredTier="business"
        title={copy.lockTitle}
        description={copy.lockDescription}
        onClose={() => setShowBusinessLock(false)}
      />
    </>
  );
}
