import { Landmark, QrCode, Wallet } from 'lucide-react';
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
  timeline: Array<{ code: string; description: string }>;
  settlementLine: string;
  auditLine: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'The solution',
    title: "We're simplified payment infrastructure: Scan and pay.",
    description:
      'The buyer sees a simple checkout. Under the hood, Link2Pay creates, tracks, and confirms the payment until it settles on-chain and is ready for the local payout rail.',
    customerLabel: 'For your customer',
    customerTitle: 'Scan the QR. Pay from the wallet already in use.',
    customerDescription: 'A simple checkout, even when settlement is not.',
    steps: [
      { title: 'Scan the QR or open the link', description: 'A live checkout opens with the amount ready.' },
      { title: 'Approve the payment from the wallet', description: 'Signed client-side and sent straight to the receiver.' },
    ],
    confirmLine: '3-5 seconds later, the payment is confirmed on-chain.',
    operationsLabel: 'For your operation',
    operationsTitle: 'Behind the scenes, the flow moves from created to confirmed.',
    operationsDescription: 'Every state is tracked in the dashboard and public checkout.',
    timeline: [
      { code: 'CREATED', description: 'Generated and ready to share.' },
      { code: 'PENDING', description: 'Awaiting wallet confirmation.' },
      { code: 'CONFIRMED', description: 'Settled on Stellar, ready for the local rail.' },
    ],
    settlementLine: 'You receive locally through your payout rail once confirmed.',
    auditLine: 'Every payment stays auditable from the dashboard.',
  },
  es: {
    eyebrow: 'La solución',
    title: 'Somos infraestructura de pagos simplificada: Escanear y pagar.',
    description:
      'El cliente ve un checkout simple. Por detrás, Link2Pay crea, sigue y confirma el pago hasta que liquida on-chain y queda listo para pasar al riel local.',
    customerLabel: 'Para tu cliente',
    customerTitle: 'Escanea el QR. Paga desde la wallet que ya usa.',
    customerDescription: 'Un checkout simple, aunque la liquidación no lo sea.',
    steps: [
      { title: 'Escaneá el QR o abrí el link', description: 'Se abre un checkout vivo con el monto ya listo.' },
      { title: 'Aprobá el pago desde la wallet', description: 'Se firma del lado del cliente y va directo al receptor.' },
    ],
    confirmLine: '3-5 segundos después, el pago queda confirmado on-chain.',
    operationsLabel: 'Para tu operación',
    operationsTitle: 'Por detrás, el flujo va de creado a confirmado.',
    operationsDescription: 'Cada estado se sigue en el dashboard y el checkout público.',
    timeline: [
      { code: 'CREADA', description: 'Generado y listo para compartir.' },
      { code: 'PENDIENTE', description: 'Esperando confirmación de la wallet.' },
      { code: 'CONFIRMADA', description: 'Liquidado en Stellar, listo para el riel local.' },
    ],
    settlementLine: 'Recibís localmente por tu riel configurado una vez confirmado.',
    auditLine: 'Cada pago queda auditable desde el dashboard.',
  },
  pt: {
    eyebrow: 'A solução',
    title: 'Somos infraestrutura de pagamentos simplificada: Escanear e pagar.',
    description:
      'O cliente vê um checkout simples. Nos bastidores, a Link2Pay cria, acompanha e confirma o pagamento até liquidar on-chain e ficar pronto para o trilho local.',
    customerLabel: 'Para o seu cliente',
    customerTitle: 'Escaneie o QR. Pague da wallet que já está em uso.',
    customerDescription: 'Um checkout simples, mesmo quando a liquidação não é.',
    steps: [
      { title: 'Escaneie o QR ou abra o link', description: 'Abre um checkout ativo com o valor já pronto.' },
      { title: 'Aprove o pagamento na wallet', description: 'Assinada do lado do cliente e enviada direto a quem recebe.' },
    ],
    confirmLine: '3-5 segundos depois, o pagamento está confirmado on-chain.',
    operationsLabel: 'Para a sua operação',
    operationsTitle: 'Nos bastidores, o fluxo vai de criado a confirmado.',
    operationsDescription: 'Cada estado é acompanhado no dashboard e no checkout público.',
    timeline: [
      { code: 'CRIADA', description: 'Gerado e pronto para compartilhar.' },
      { code: 'PENDENTE', description: 'Aguardando confirmação da wallet.' },
      { code: 'CONFIRMADA', description: 'Liquidado na Stellar, pronto para o trilho local.' },
    ],
    settlementLine: 'Você recebe localmente pelo seu trilho assim que confirmado.',
    auditLine: 'Cada pagamento fica auditável no dashboard.',
  },
};

export default function HomeTwoSteps() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section id="solucion" className="border-b border-border">
      <div className={`${MARKETING_CONTAINER} py-20`}>
        <SectionHeading
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          align="center"
          className="max-w-3xl"
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <article className="card flex flex-col border border-border p-6">
          <p className="text-2xs font-medium uppercase tracking-label text-muted-foreground">
            {copy.customerLabel}
          </p>

          <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground [text-wrap:balance]">
            {copy.customerTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.customerDescription}
          </p>

          <ol className="mt-6 divide-y divide-border">
            {copy.steps.map((step, index) => {
              const Icon = index === 0 ? QrCode : Wallet;
              return (
                <li key={step.title} className="flex gap-3 py-4 first:pt-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/40 text-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">
                      <span className="mr-2 font-mono text-2xs text-muted-foreground">0{index + 1}</span>
                      {step.title}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-auto border-t border-border pt-4 font-mono text-xs text-foreground [font-variant-numeric:tabular-nums]">
            {copy.confirmLine}
          </p>
        </article>

        <article className="card flex flex-col border border-border p-6">
          <p className="text-2xs font-medium uppercase tracking-label text-muted-foreground">
            {copy.operationsLabel}
          </p>

          <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground [text-wrap:balance]">
            {copy.operationsTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.operationsDescription}
          </p>

          <ol className="mt-6 mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {copy.timeline.map((item) => (
              <li
                key={item.code}
                className="min-w-0 rounded-xl border border-border bg-muted/40 px-3.5 py-3.5"
              >
                <p className="font-mono text-xs font-semibold tracking-label text-foreground">
                  {item.code}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground [text-wrap:pretty]">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-auto flex items-start gap-3 border-t border-border pt-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
              <Landmark className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground [text-wrap:pretty]">
                {copy.settlementLine}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                {copy.auditLine}
              </p>
            </div>
          </div>
        </article>
        </div>
      </div>
    </section>
  );
}
