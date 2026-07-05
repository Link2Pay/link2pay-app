import { CheckCircle2, Landmark, QrCode, Wallet } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import { MARKETING_CONTAINER } from '../layout';
import SectionHeading from './SectionHeading';

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  customerLabel: string;
  customerTitle: string;
  customerDescription: string;
  steps: Array<{ title: string; description: string }>;
  confirmLine: string;
  operationsLabel: string;
  operationsTitle: string;
  operationsDescription: string;
  timeline: Array<{ code: string; description: string; badgeClass: string }>;
  settlementLine: string;
  auditLine: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'The solution',
    title: 'Not another app. Payment infrastructure in two simple steps: scan and pay.',
    description:
      'The buyer sees a simple checkout. Under the hood, Link2Pay creates, tracks, and confirms the payment until it settles on-chain and is ready for the local payout rail.',
    customerLabel: 'For your customer',
    customerTitle: 'Scan the QR. Pay from the wallet already in use.',
    customerDescription: 'The checkout stays simple even when the settlement logic is not.',
    steps: [
      { title: 'Scan the QR or open the link', description: 'The payer enters a live checkout with the amount already prepared.' },
      { title: 'Approve the payment from the wallet', description: 'The payment is signed client-side and moves directly to the receiver.' },
    ],
    confirmLine: '3-5 seconds later, the payment is confirmed on-chain.',
    operationsLabel: 'For your operation',
    operationsTitle: 'Behind the scenes, the flow moves from created to confirmed.',
    operationsDescription: 'The product already tracks each state and exposes it in the dashboard and public checkout.',
    timeline: [
      { code: 'CREATED', description: 'Link generated and ready to share.', badgeClass: 'badge-draft' },
      { code: 'PENDING', description: 'Waiting for wallet confirmation and submission.', badgeClass: 'badge-processing' },
      { code: 'CONFIRMED', description: 'Settled on Stellar and ready for the payout rail.', badgeClass: 'badge-paid' },
    ],
    settlementLine: 'You receive locally through the configured payout rail once the payment is confirmed.',
    auditLine: 'Every confirmed payment can be checked later from the checkout and the dashboard.',
  },
  es: {
    eyebrow: 'La solución',
    title: 'No somos otra app. Somos infraestructura de pagos en dos pasos simples: escanear y pagar.',
    description:
      'El cliente ve un checkout simple. Por detrás, Link2Pay crea, sigue y confirma el pago hasta que liquida on-chain y queda listo para pasar al riel local.',
    customerLabel: 'Para tu cliente',
    customerTitle: 'Escanea el QR. Paga desde la wallet que ya usa.',
    customerDescription: 'El checkout se siente simple, aunque la lógica de liquidación no lo sea.',
    steps: [
      { title: 'Escaneá el QR o abrí el link', description: 'El pagador entra a un checkout vivo con el monto ya preparado.' },
      { title: 'Aprobá el pago desde la wallet', description: 'La transacción se firma del lado del cliente y va directo al receptor.' },
    ],
    confirmLine: '3-5 segundos después, el pago queda confirmado on-chain.',
    operationsLabel: 'Para tu operación',
    operationsTitle: 'Por detrás, el flujo va de creado a confirmado.',
    operationsDescription: 'El producto ya sigue cada estado y lo muestra tanto en el dashboard como en el checkout público.',
    timeline: [
      { code: 'CREATED', description: 'Link generado y listo para compartir.', badgeClass: 'badge-draft' },
      { code: 'PENDING', description: 'Esperando confirmación y envío desde la wallet.', badgeClass: 'badge-processing' },
      { code: 'CONFIRMED', description: 'Liquidado en Stellar y listo para pasar al riel local.', badgeClass: 'badge-paid' },
    ],
    settlementLine: 'Vos recibís localmente por el riel configurado una vez que el pago queda confirmado.',
    auditLine: 'Cada pago confirmado se puede revisar después desde el checkout y el dashboard.',
  },
  pt: {
    eyebrow: 'A solução',
    title: 'Não somos outro app. Somos infraestrutura de pagamentos em dois passos simples: escanear e pagar.',
    description:
      'O cliente vê um checkout simples. Nos bastidores, a Link2Pay cria, acompanha e confirma o pagamento até liquidar on-chain e ficar pronto para o trilho local.',
    customerLabel: 'Para o seu cliente',
    customerTitle: 'Escaneie o QR. Pague da wallet que já está em uso.',
    customerDescription: 'O checkout parece simples, mesmo quando a liquidação não é.',
    steps: [
      { title: 'Escaneie o QR ou abra o link', description: 'Quem paga entra em um checkout ativo com o valor já preparado.' },
      { title: 'Aprove o pagamento na wallet', description: 'A transação é assinada do lado do cliente e segue direto para quem recebe.' },
    ],
    confirmLine: '3-5 segundos depois, o pagamento está confirmado on-chain.',
    operationsLabel: 'Para a sua operação',
    operationsTitle: 'Nos bastidores, o fluxo vai de criado a confirmado.',
    operationsDescription: 'O produto já acompanha cada estado e o expõe no dashboard e no checkout público.',
    timeline: [
      { code: 'CREATED', description: 'Link gerado e pronto para compartilhar.', badgeClass: 'badge-draft' },
      { code: 'PENDING', description: 'Aguardando confirmação e envio pela wallet.', badgeClass: 'badge-processing' },
      { code: 'CONFIRMED', description: 'Liquidado na Stellar e pronto para o trilho local.', badgeClass: 'badge-paid' },
    ],
    settlementLine: 'Você recebe localmente pelo trilho configurado assim que o pagamento é confirmado.',
    auditLine: 'Cada pagamento confirmado pode ser conferido depois no checkout e no dashboard.',
  },
};

export default function HomeTwoSteps() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section id="solucion" className={`${MARKETING_CONTAINER} py-20`}>
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        align="center"
        className="max-w-3xl"
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <article className="card border border-border p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-2xs font-medium uppercase tracking-label text-muted-foreground">
              {copy.customerLabel}
            </p>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground [text-wrap:balance]">
            {copy.customerTitle}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.customerDescription}
          </p>

          <ol className="mt-8 space-y-4">
            {copy.steps.map((step, index) => {
              const Icon = index === 0 ? QrCode : Wallet;
              return (
                <li key={step.title} className="flex gap-4 rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-2xs font-semibold text-muted-foreground">
                      0{index + 1}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-foreground">{step.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-8 border-t border-border pt-5 font-mono text-xs text-foreground [font-variant-numeric:tabular-nums]">
            {copy.confirmLine}
          </p>
        </article>

        <article className="card border border-border p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-2xs font-medium uppercase tracking-label text-muted-foreground">
              {copy.operationsLabel}
            </p>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-subtle text-success">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground [text-wrap:balance]">
            {copy.operationsTitle}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.operationsDescription}
          </p>

          <div className="mt-8 space-y-4">
            {copy.timeline.map((item, index) => (
              <div key={item.code} className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-2xs font-semibold text-muted-foreground">
                      0{index + 1}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-foreground">{item.code}</h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                      {item.description}
                    </p>
                  </div>
                  <span className={item.badgeClass}>{item.code}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-success-border bg-success-subtle p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-success">
                <Landmark className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground [text-wrap:pretty]">
                  {copy.settlementLine}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                  {copy.auditLine}
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
