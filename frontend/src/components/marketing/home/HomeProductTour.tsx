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
    eyebrow: 'Product',
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
    eyebrow: 'Producto',
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
    eyebrow: 'Produto',
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

        <div className="mt-12 space-y-4">
          {/* Wallets — full-width supported-wallet showcase */}
          <article className="card border border-border p-8">
            <div className="max-w-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
                <WalletCards className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.walletsTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                {copy.walletsDescription}
              </p>
            </div>

            {/* Infinite logo marquee — CSS-only, seamless, reduced-motion safe */}
            <div className="wallet-marquee mt-8 -mx-8 overflow-hidden">
              <ul className="wallet-marquee-track flex items-center">
                {[...WALLETS, ...WALLETS].map((wallet, index) => (
                  <li
                    key={index}
                    aria-hidden={index >= WALLETS.length}
                    className="group mr-3 flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-muted/40 px-5 py-3"
                  >
                    <img
                      src={wallet.src}
                      alt={index < WALLETS.length ? wallet.name : ''}
                      width={28}
                      height={28}
                      loading="lazy"
                      className="h-7 w-7 object-contain grayscale transition duration-200 group-hover:grayscale-0"
                    />
                    <span className="whitespace-nowrap text-sm font-medium text-foreground">
                      {wallet.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 text-2xs leading-5 text-muted-foreground [text-wrap:pretty]">
              {copy.walletsNote}
            </p>
          </article>

          {/* Bento — featured non-custodial tile + right rail of two capabilities */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Featured: non-custodial */}
            <article className="card relative flex flex-col overflow-hidden border border-success-border bg-success-subtle p-8 lg:col-span-7">
              <ShieldCheck
                className="pointer-events-none absolute -bottom-4 -right-4 h-40 w-40 text-success/10"
                aria-hidden="true"
              />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-success">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="relative mt-5 text-xl font-semibold text-foreground">{copy.custodyTitle}</h3>
              <p className="relative mt-2 max-w-md text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                {copy.custodyDescription}
              </p>
              <p className="relative mt-auto pt-6 text-2xs font-medium text-muted-foreground">
                {copy.custodyTags.join(' · ')}
              </p>
            </article>

            {/* Right rail */}
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              <article className="card flex flex-col border border-border p-6 transition-colors hover:border-foreground/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-accent-ink">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{copy.invoicesTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                  {copy.invoicesDescription}
                </p>
                <p className="mt-auto pt-4 text-2xs font-medium text-muted-foreground">
                  {copy.invoicesTags.join(' · ')}
                </p>
              </article>

              <article className="card flex flex-col border border-border p-6 transition-colors hover:border-foreground/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-accent-ink">
                  <BarChart3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{copy.analyticsTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                  {copy.analyticsDescription}
                </p>
                <p className="mt-auto pt-4 text-2xs font-medium text-muted-foreground">
                  {copy.analyticsTags.join(' · ')}
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
