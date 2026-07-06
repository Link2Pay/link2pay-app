import { ArrowUpRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import { MARKETING_CONTAINER } from '../layout';
import SectionHeading from './SectionHeading';

type ProofStep = {
  title: string;
  detail: string;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  signals: string[];
  panelLabel: string;
  proofStatus: string;
  proofSteps: [ProofStep, ProofStep, ProofStep];
  auditLink: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Trust',
    title: 'Your money is always safe.',
    description:
      'You stay in control the whole time: signatures happen on your device and every payment is recorded on-chain, so you can verify it whenever you want.',
    signals: ['Non-custodial', 'Signed on your device', 'On-chain verifiable', 'No locked funds'],
    panelLabel: 'Payment',
    proofStatus: 'Confirmed',
    proofSteps: [
      { title: 'Signed on your device', detail: 'The signature never leaves your wallet.' },
      { title: 'Sent straight to the receiver', detail: 'Funds never pass through Link2Pay.' },
      { title: 'Confirmed on Stellar', detail: 'Settled on-chain in seconds.' },
    ],
    auditLink: 'View on stellar.expert',
  },
  es: {
    eyebrow: 'Confianza',
    title: 'Tu plata siempre está segura.',
    description:
      'Vos mantenés el control en todo momento: las firmas ocurren en tu dispositivo y cada pago queda registrado on-chain para que puedas verificarlo cuando quieras.',
    signals: ['No custodial', 'Firmas en tu dispositivo', 'Verificable on-chain', 'Sin bloqueo de fondos'],
    panelLabel: 'Pago',
    proofStatus: 'Confirmado',
    proofSteps: [
      { title: 'Firmado en tu dispositivo', detail: 'La firma nunca sale de tu wallet.' },
      { title: 'Enviado directo al receptor', detail: 'Los fondos no pasan por Link2Pay.' },
      { title: 'Confirmado en Stellar', detail: 'Liquidado on-chain en segundos.' },
    ],
    auditLink: 'Ver en stellar.expert',
  },
  pt: {
    eyebrow: 'Confiança',
    title: 'O seu dinheiro está sempre seguro.',
    description:
      'Você mantém o controle o tempo todo: as assinaturas acontecem no seu dispositivo e cada pagamento fica registrado on-chain para você verificar quando quiser.',
    signals: ['Não custodial', 'Assinado no seu dispositivo', 'Verificável on-chain', 'Sem bloqueio de fundos'],
    panelLabel: 'Pagamento',
    proofStatus: 'Confirmado',
    proofSteps: [
      { title: 'Assinado no seu dispositivo', detail: 'A assinatura nunca sai da sua wallet.' },
      { title: 'Enviado direto ao recebedor', detail: 'Os fundos não passam pela Link2Pay.' },
      { title: 'Confirmado na Stellar', detail: 'Liquidado on-chain em segundos.' },
    ],
    auditLink: 'Ver na stellar.expert',
  },
};

export default function HomeTrust() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className={`${MARKETING_CONTAINER} py-20`}>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
        {/* Left — reassurance statement */}
        <div>
          <SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

          <div className="mt-6 flex flex-wrap gap-2.5">
            {copy.signals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-success-border"
              >
                <Lock className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                {signal}
              </span>
            ))}
          </div>

        </div>

        {/* Right — verifiable proof panel */}
        <div className="card overflow-hidden border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
              <span className="text-2xs font-medium uppercase tracking-label">{copy.panelLabel}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-subtle px-2.5 py-1 text-2xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.proofStatus}
            </span>
          </div>

          <ol className="px-5 py-5 sm:px-6">
            {copy.proofSteps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                {index !== copy.proofSteps.length - 1 ? (
                  <span
                    className="absolute bottom-1 left-[9px] top-7 w-px bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                <CheckCircle2 className="relative z-10 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-0.5 text-2xs leading-5 text-muted-foreground [text-wrap:pretty]">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="border-t border-border px-5 py-4 sm:px-6">
            <a
              href="https://stellar.expert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent-ink"
            >
              {copy.auditLink}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
