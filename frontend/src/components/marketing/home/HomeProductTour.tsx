import { BarChart3, FileText, ShieldCheck, WalletCards } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import { MARKETING_CONTAINER } from '../layout';
import SectionHeading from './SectionHeading';
import albedoLogo from '../../../assets/logos/wallets/albedo.png';
import freighterLogo from '../../../assets/logos/wallets/freighter.png';
import hanaLogo from '../../../assets/logos/wallets/hana.png';
import lobstrLogo from '../../../assets/logos/wallets/lobstr.png';
import rabetLogo from '../../../assets/logos/wallets/rabet.png';
import xbullLogo from '../../../assets/logos/wallets/xbull.png';

// Supported Stellar wallets — brand names are language-agnostic. Icons are the
// official kit logos (from @creit.tech/stellar-wallets-kit), vendored locally.
const WALLETS = [
  { name: 'Freighter', src: freighterLogo },
  { name: 'xBull', src: xbullLogo },
  { name: 'Albedo', src: albedoLogo },
  { name: 'Rabet', src: rabetLogo },
  { name: 'Lobstr', src: lobstrLogo },
  { name: 'Hana', src: hanaLogo },
] as const;

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  walletsTitle: string;
  walletsDescription: string;
  walletsNote: string;
  invoicesTitle: string;
  invoicesDescription: string;
  invoicesTags: string[];
  analyticsTitle: string;
  analyticsDescription: string;
  analyticsTags: string[];
  custodyTitle: string;
  custodyDescription: string;
  custodyTags: string[];
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Product tour',
    title: 'This is not a mockup. The product already works.',
    description:
      'The landing only sells what the product already does today: public checkout, on-chain confirmation, multi-wallet support, invoices, analytics, and non-custodial settlement.',
    walletsTitle: 'Wallets already supported',
    walletsDescription:
      'Your customer pays with the wallet they already use — no new account, no onboarding.',
    walletsNote: 'Plus: social login with an embedded wallet and SEP-7 deep links on mobile.',
    invoicesTitle: 'Invoices with PDF and QR',
    invoicesDescription: 'Every invoice type and a ready-to-share payment link from the same flow.',
    invoicesTags: ['PDF', 'QR', 'Fixed amount', 'Open amount', 'Commercial', 'Service'],
    analyticsTitle: 'Contacts and payment analytics',
    analyticsDescription: 'See how your payments perform from the dashboard, no manual reconciling.',
    analyticsTags: ['Conversion', 'Average ticket', 'Settlement speed', 'Activity'],
    custodyTitle: 'Funds never stop in Link2Pay',
    custodyDescription: 'The payer signs client-side and the funds move straight to the receiver.',
    custodyTags: ['Client-side signing', 'Direct to receiver'],
  },
  es: {
    eyebrow: 'Producto real',
    title: 'Todo lo que ves acá ya está funcionando.',
    description:
      'Nada de esto es una demo ni una promesa a futuro: checkout público, confirmación on-chain, soporte multi-wallet, facturas, analítica y liquidación no custodial ya están disponibles y en uso hoy.',
    walletsTitle: 'Wallets ya soportadas',
    walletsDescription:
      'Tu cliente paga con la wallet que ya usa — sin crear cuenta ni onboarding.',
    walletsNote: 'Además: login social con wallet embebida y deep links SEP-7 en móvil.',
    invoicesTitle: 'Facturas con PDF y QR',
    invoicesDescription: 'Todos los tipos de factura y un link listo para compartir desde el mismo flujo.',
    invoicesTags: ['PDF', 'QR', 'Monto fijo', 'Monto abierto', 'Comercial', 'Servicios'],
    analyticsTitle: 'Contactos y analítica de cobros',
    analyticsDescription: 'Ves cómo rinden tus cobros desde el dashboard, sin conciliar a mano.',
    analyticsTags: ['Conversión', 'Ticket medio', 'Velocidad', 'Actividad'],
    custodyTitle: 'Los fondos nunca paran en Link2Pay',
    custodyDescription: 'El pagador firma del lado del cliente y los fondos viajan directo a la cuenta receptora.',
    custodyTags: ['Firma del lado del cliente', 'Directo al receptor'],
  },
  pt: {
    eyebrow: 'Produto real',
    title: 'Não é um mockup. O produto já funciona.',
    description:
      'A landing vende apenas o que o produto já entrega hoje: checkout público, confirmação on-chain, suporte multiwallet, faturas, analítica e liquidação não custodial.',
    walletsTitle: 'Wallets já suportadas',
    walletsDescription:
      'Seu cliente paga com a wallet que já usa — sem criar conta nem onboarding.',
    walletsNote: 'Além disso: login social com wallet embutida e deep links SEP-7 no mobile.',
    invoicesTitle: 'Faturas com PDF e QR',
    invoicesDescription: 'Todos os tipos de fatura e um link pronto para compartilhar no mesmo fluxo.',
    invoicesTags: ['PDF', 'QR', 'Valor fixo', 'Valor aberto', 'Comercial', 'Serviço'],
    analyticsTitle: 'Contatos e analítica de cobranças',
    analyticsDescription: 'Veja como suas cobranças rendem no dashboard, sem conciliar manualmente.',
    analyticsTags: ['Conversão', 'Ticket médio', 'Velocidade', 'Atividade'],
    custodyTitle: 'Os fundos nunca param na Link2Pay',
    custodyDescription: 'Quem paga assina do lado do cliente e os fundos vão direto para a conta recebedora.',
    custodyTags: ['Assinatura no cliente', 'Direto ao recebedor'],
  },
};

export default function HomeProductTour() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="border-b border-border">
      <div className={`${MARKETING_CONTAINER} py-20`}>
        <SectionHeading
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          align="center"
          className="max-w-3xl"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {/* Wallets — full-width supported-wallet showcase */}
          <article className="card border border-border p-8 sm:col-span-2 lg:col-span-12">
            <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
              <div className="lg:max-w-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
                  <WalletCards className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.walletsTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                  {copy.walletsDescription}
                </p>
              </div>

              <div className="mt-6 lg:mt-0 lg:flex-1">
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {WALLETS.map((wallet) => (
                    <li
                      key={wallet.name}
                      className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 p-4 transition-colors hover:border-foreground/20"
                    >
                      <img
                        src={wallet.src}
                        alt={wallet.name}
                        width={32}
                        height={32}
                        loading="lazy"
                        className="h-8 w-8 object-contain grayscale transition duration-200 group-hover:grayscale-0"
                      />
                      <span className="text-2xs font-medium text-muted-foreground">{wallet.name}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-2xs leading-5 text-muted-foreground [text-wrap:pretty]">
                  {copy.walletsNote}
                </p>
              </div>
            </div>
          </article>

          {/* Invoices */}
          <article className="card flex flex-col border border-border p-8 transition-colors hover:border-foreground/20 lg:col-span-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.invoicesTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
              {copy.invoicesDescription}
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {copy.invoicesTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-2xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>

          {/* Analytics */}
          <article className="card flex flex-col border border-border p-8 transition-colors hover:border-foreground/20 lg:col-span-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.analyticsTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
              {copy.analyticsDescription}
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {copy.analyticsTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-2xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>

          {/* Custody — non-custodial highlight */}
          <article className="card flex flex-col border border-success-border bg-success-subtle p-8 sm:col-span-2 lg:col-span-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-success">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.custodyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
              {copy.custodyDescription}
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {copy.custodyTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-success-border bg-card px-2.5 py-1 text-2xs font-medium text-success"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
