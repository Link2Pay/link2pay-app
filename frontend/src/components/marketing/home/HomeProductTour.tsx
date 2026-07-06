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
      'Your customer pays with the wallet they already use, without creating a new account anywhere. And if they don’t have one yet, they can sign in with a social login and use the embedded wallet.',
    invoicesTitle: 'Invoices with PDF and QR',
    invoicesDescription: 'Every invoice type and a ready-to-share payment link from the same flow.',
    invoicesTags: ['PDF', 'QR', 'Fixed amount', 'Open amount', 'Commercial', 'Service'],
    analyticsTitle: 'Payment analytics and payment links',
    analyticsDescription:
      'See how your payments perform from the dashboard, without doing the math by hand. Plus, generate QR codes whenever you need them.',
    analyticsTags: ['Conversion', 'Average ticket', 'Settlement speed', 'Activity'],
    custodyTitle: 'Your funds, always yours',
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
      'Tu cliente paga con su wallet que ya usa, sin crear una nueva cuenta en ningún sitio. Y si todavía no tiene una, puede entrar con un login social y usar la wallet embebida.',
    invoicesTitle: 'Facturas con PDF y QR',
    invoicesDescription: 'Todos los tipos de factura y un link listo para compartir desde el mismo flujo.',
    invoicesTags: ['PDF', 'QR', 'Monto fijo', 'Monto abierto', 'Comercial', 'Servicios'],
    analyticsTitle: 'Estadísticas de cobros y links de pago',
    analyticsDescription:
      'Visualiza el rendimiento de tus cobros desde el dashboard, sin realizar cálculos a mano. Además, contarás con la generación de códigos QR cada vez que los necesites.',
    analyticsTags: ['Conversión', 'Ticket medio', 'Velocidad', 'Actividad'],
    custodyTitle: 'Tus fondos, siempre tuyos',
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
      'Seu cliente paga com a wallet que já usa, sem criar uma nova conta em lugar nenhum. E se ainda não tiver uma, pode entrar com um login social e usar a wallet embutida.',
    invoicesTitle: 'Faturas com PDF e QR',
    invoicesDescription: 'Todos os tipos de fatura e um link pronto para compartilhar no mesmo fluxo.',
    invoicesTags: ['PDF', 'QR', 'Valor fixo', 'Valor aberto', 'Comercial', 'Serviço'],
    analyticsTitle: 'Estatísticas de cobranças e links de pagamento',
    analyticsDescription:
      'Acompanhe o desempenho das suas cobranças no dashboard, sem fazer cálculos à mão. Além disso, você gera códigos QR sempre que precisar.',
    analyticsTags: ['Conversão', 'Ticket médio', 'Velocidade', 'Atividade'],
    custodyTitle: 'Seus fundos, sempre seus',
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

        <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-start">
          {/* Left column — wider */}
          <div className="flex min-w-0 flex-col gap-4 md:basis-[60%]">
          {/* Featured: non-custodial */}
          <article className="card flex flex-col border border-border p-8 transition-colors hover:border-foreground/20">
            <div className="max-w-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-subtle text-success">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.custodyTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                {copy.custodyDescription}
              </p>
            </div>
            <p className="mt-auto pt-6 text-2xs font-medium text-muted-foreground">
              {copy.custodyTags.join(' · ')}
            </p>
          </article>

          {/* Wallets — supported-wallet marquee showcase */}
          <article className="card flex flex-col border border-border p-8 transition-colors hover:border-foreground/20">
            <div className="max-w-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-accent-ink">
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
                    className="mr-3 flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-muted/40 px-5 py-3"
                  >
                    <img
                      src={wallet.src}
                      alt={index < WALLETS.length ? wallet.name : ''}
                      width={28}
                      height={28}
                      loading="lazy"
                      className="h-7 w-7 object-contain"
                    />
                    <span className="whitespace-nowrap text-sm font-medium text-foreground">
                      {wallet.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
          </div>

          {/* Right column — narrower */}
          <div className="flex flex-col gap-4 md:basis-[40%]">
          {/* Invoices */}
          <article className="card flex flex-col border border-border p-8 transition-colors hover:border-foreground/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-accent-ink">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.invoicesTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
              {copy.invoicesDescription}
            </p>
            <p className="mt-auto pt-6 text-2xs font-medium text-muted-foreground">
              {copy.invoicesTags.join(' · ')}
            </p>
          </article>

          {/* Analytics */}
          <article className="card flex flex-col border border-border p-8 transition-colors hover:border-foreground/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-accent-ink">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.analyticsTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
              {copy.analyticsDescription}
            </p>
            <p className="mt-auto pt-6 text-2xs font-medium text-muted-foreground">
              {copy.analyticsTags.join(' · ')}
            </p>
          </article>
          </div>
        </div>
      </div>
    </section>
  );
}
