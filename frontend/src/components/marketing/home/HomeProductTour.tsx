import {
  ArrowUpRight,
  BarChart3,
  FileText,
  Router,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import SectionHeading from './SectionHeading';

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  checkoutTitle: string;
  checkoutDescription: string;
  checkoutSteps: [string, string, string, string];
  checkoutFootnote: string;
  checkoutLink: string;
  walletsTitle: string;
  walletsDescription: string;
  walletChips: string[];
  invoicesTitle: string;
  invoicesDescription: string;
  analyticsTitle: string;
  analyticsDescription: string;
  custodyTitle: string;
  custodyDescription: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Product tour',
    title: 'This is not a mockup. The product already works.',
    description:
      'The landing only sells what the product already does today: public checkout, on-chain confirmation, multi-wallet support, invoices, analytics, and non-custodial settlement.',
    checkoutTitle: 'Public checkout with a 4-step tracker',
    checkoutDescription:
      'Every payment moves through link loaded, wallet connected, transaction signed, and settlement confirmed.',
    checkoutSteps: ['Link loaded', 'Wallet connected', 'Transaction signed', 'Settlement confirmed'],
    checkoutFootnote: 'Each confirmed payment can end in an auditable receipt on stellar.expert.',
    checkoutLink: 'Open stellar.expert',
    walletsTitle: 'Wallets already supported',
    walletsDescription:
      'Freighter, xBull, Albedo, Rabet, Lobstr, Hana, social login with embedded wallet, and SEP-7 deep links on mobile.',
    walletChips: ['Freighter', 'xBull', 'Albedo', 'Rabet', 'Lobstr', 'Hana', 'Privy', 'SEP-7'],
    invoicesTitle: 'Invoices with PDF and QR',
    invoicesDescription:
      'Fixed amounts, open amounts, commercial invoices, service invoices, and ready-to-share payment links from the same flow.',
    analyticsTitle: 'Contacts and payment analytics',
    analyticsDescription:
      'Track conversion, average ticket, settlement speed, and payment activity from the dashboard instead of reconciling by hand.',
    custodyTitle: 'Funds never stop in Link2Pay',
    custodyDescription:
      'The payer signs client-side and the funds move directly to the receiver account, which keeps the operational model non-custodial.',
  },
  es: {
    eyebrow: 'Producto real',
    title: 'No es un mockup. El producto ya funciona.',
    description:
      'El landing vende solo lo que el producto ya hace hoy: checkout público, confirmación on-chain, soporte multi-wallet, facturas, analítica y liquidación no custodial.',
    checkoutTitle: 'Checkout público con tracker de 4 pasos',
    checkoutDescription:
      'Cada pago pasa por link cargado, wallet conectada, transacción firmada y liquidación confirmada.',
    checkoutSteps: ['Link cargado', 'Wallet conectada', 'Transacción firmada', 'Liquidación confirmada'],
    checkoutFootnote: 'Cada pago confirmado puede terminar en un recibo auditable en stellar.expert.',
    checkoutLink: 'Abrir stellar.expert',
    walletsTitle: 'Wallets ya soportadas',
    walletsDescription:
      'Freighter, xBull, Albedo, Rabet, Lobstr, Hana, login social con wallet embebida y deep links SEP-7 en móvil.',
    walletChips: ['Freighter', 'xBull', 'Albedo', 'Rabet', 'Lobstr', 'Hana', 'Privy', 'SEP-7'],
    invoicesTitle: 'Facturas con PDF y QR',
    invoicesDescription:
      'Montos fijos, montos abiertos, factura comercial, factura de servicios y links listos para compartir desde el mismo flujo.',
    analyticsTitle: 'Contactos y analítica de cobros',
    analyticsDescription:
      'Seguís conversión, ticket medio, velocidad de liquidación y actividad de pagos desde el dashboard en lugar de conciliar a mano.',
    custodyTitle: 'Los fondos nunca paran en Link2Pay',
    custodyDescription:
      'El pagador firma del lado del cliente y los fondos viajan directo a la cuenta receptora, manteniendo el modelo operativo no custodial.',
  },
  pt: {
    eyebrow: 'Produto real',
    title: 'Não é um mockup. O produto já funciona.',
    description:
      'A landing vende apenas o que o produto já entrega hoje: checkout público, confirmação on-chain, suporte multiwallet, faturas, analítica e liquidação não custodial.',
    checkoutTitle: 'Checkout público com tracker de 4 passos',
    checkoutDescription:
      'Cada pagamento passa por link carregado, wallet conectada, transação assinada e liquidação confirmada.',
    checkoutSteps: ['Link carregado', 'Wallet conectada', 'Transação assinada', 'Liquidação confirmada'],
    checkoutFootnote: 'Cada pagamento confirmado pode terminar em um recibo auditável na stellar.expert.',
    checkoutLink: 'Abrir stellar.expert',
    walletsTitle: 'Wallets já suportadas',
    walletsDescription:
      'Freighter, xBull, Albedo, Rabet, Lobstr, Hana, login social com wallet embutida e deep links SEP-7 no mobile.',
    walletChips: ['Freighter', 'xBull', 'Albedo', 'Rabet', 'Lobstr', 'Hana', 'Privy', 'SEP-7'],
    invoicesTitle: 'Faturas com PDF e QR',
    invoicesDescription:
      'Valores fixos, valores abertos, fatura comercial, fatura de serviço e links prontos para compartilhar no mesmo fluxo.',
    analyticsTitle: 'Contatos e analítica de cobranças',
    analyticsDescription:
      'Acompanhe conversão, ticket médio, velocidade de liquidação e atividade de pagamentos no dashboard, sem conciliar tudo manualmente.',
    custodyTitle: 'Os fundos nunca param na Link2Pay',
    custodyDescription:
      'Quem paga assina do lado do cliente e os fundos vão direto para a conta recebedora, mantendo o modelo operacional não custodial.',
  },
};

export default function HomeProductTour() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10">
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        className="max-w-3xl"
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <article className="card border border-border p-8 lg:col-span-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
              <Router className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{copy.checkoutTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                {copy.checkoutDescription}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {copy.checkoutSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="font-mono text-2xs font-semibold text-muted-foreground">0{index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
              {copy.checkoutFootnote}
            </p>
            <a
              href="https://stellar.expert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent-ink"
            >
              {copy.checkoutLink}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </article>

        <article className="card border border-border p-8 lg:col-span-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
            <WalletCards className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.walletsTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.walletsDescription}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {copy.walletChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-2xs font-semibold uppercase tracking-[0.08em] text-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </article>

        <article className="card border border-border p-8 lg:col-span-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.invoicesTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.invoicesDescription}
          </p>
        </article>

        <article className="card border border-border p-8 lg:col-span-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.analyticsTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.analyticsDescription}
          </p>
        </article>

        <article className="card border border-success-border bg-success-subtle p-8 lg:col-span-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-success">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.custodyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.custodyDescription}
          </p>
        </article>
      </div>
    </section>
  );
}
