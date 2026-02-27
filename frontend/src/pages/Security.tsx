import { ShieldCheck, KeyRound, Lock, RefreshCw, TimerReset } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

type SecurityCopy = {
  title: string;
  subtitle: string;
  nonCustodialTitle: string;
  nonCustodialDesc: string;
  dataModelTitle: string;
  dataModelDesc: string;
  webhooksTitle: string;
  webhooksDesc: string;
  abuseTitle: string;
  abuseDesc: string;
  statesTitle: string;
  statesDesc: string;
};

const COPY: Record<Language, SecurityCopy> = {
  en: {
    title: 'Security',
    subtitle: 'Security architecture for payment links, checkout, and event delivery.',
    nonCustodialTitle: 'Non-custodial by default',
    nonCustodialDesc: 'Payers sign transactions with their wallet. Link2Pay does not custody payer or merchant funds.',
    dataModelTitle: 'Data model and storage',
    dataModelDesc: 'Server-side stores link metadata, state, and event history. Settlement proof remains verifiable on-chain.',
    webhooksTitle: 'Webhook signatures',
    webhooksDesc: 'Events use HMAC signatures with timestamp headers to support verification and replay protection.',
    abuseTitle: 'Rate limiting and anti-abuse',
    abuseDesc: 'Sandbox endpoints enforce rate limits and abuse controls to keep checkout and API availability stable.',
    statesTitle: 'Deterministic status transitions',
    statesDesc: 'Payment links move through Created, Pending, Confirmed, and Expired states with auditable transition history.',
  },
  es: {
    title: 'Seguridad',
    subtitle: 'Arquitectura de seguridad para links de pago, checkout y eventos.',
    nonCustodialTitle: 'Non-custodial por defecto',
    nonCustodialDesc: 'El pagador firma la transaccion con su wallet. Link2Pay no custodia fondos.',
    dataModelTitle: 'Modelo de datos y almacenamiento',
    dataModelDesc: 'Se almacena metadata, estado y eventos. La prueba de liquidacion es verificable on-chain.',
    webhooksTitle: 'Firmas de webhook',
    webhooksDesc: 'Los eventos usan firma HMAC con timestamp para verificacion y proteccion anti-replay.',
    abuseTitle: 'Rate limiting y anti-abuso',
    abuseDesc: 'Sandbox aplica limites y controles anti-abuso para mantener disponibilidad de API y checkout.',
    statesTitle: 'Transiciones deterministas',
    statesDesc: 'Los links pasan por Created, Pending, Confirmed y Expired con historial auditable.',
  },
  pt: {
    title: 'Seguranca',
    subtitle: 'Arquitetura de seguranca para links de pagamento, checkout e entrega de eventos.',
    nonCustodialTitle: 'Non-custodial por padrao',
    nonCustodialDesc: 'O pagador assina a transacao na wallet. Link2Pay nao custodia fundos.',
    dataModelTitle: 'Modelo de dados e armazenamento',
    dataModelDesc: 'Servidor guarda metadata, estado e historico de eventos. A prova de liquidacao fica on-chain.',
    webhooksTitle: 'Assinatura de webhook',
    webhooksDesc: 'Eventos usam assinatura HMAC com timestamp para verificacao e protecao anti-replay.',
    abuseTitle: 'Rate limiting e anti-abuso',
    abuseDesc: 'Sandbox aplica limites e controles anti-abuso para manter API e checkout estaveis.',
    statesTitle: 'Transicoes deterministas',
    statesDesc: 'Links passam por Created, Pending, Confirmed e Expired com historico auditavel.',
  },
};

const ICONS = [ShieldCheck, Lock, KeyRound, RefreshCw, TimerReset] as const;

export default function Security() {
  const { language } = useI18n();
  const copy = COPY[language];

  const blocks = [
    { title: copy.nonCustodialTitle, desc: copy.nonCustodialDesc },
    { title: copy.dataModelTitle, desc: copy.dataModelDesc },
    { title: copy.webhooksTitle, desc: copy.webhooksDesc },
    { title: copy.abuseTitle, desc: copy.abuseDesc },
    { title: copy.statesTitle, desc: copy.statesDesc },
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{copy.title}</h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{copy.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block, index) => {
            const Icon = ICONS[index];
            return (
              <article key={block.title} className="card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-foreground">{block.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{block.desc}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
