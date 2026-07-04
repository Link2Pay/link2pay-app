import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  Globe2,
  Landmark,
  Layers,
  QrCode,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import HeroPaymentMockup from '../components/marketing/HeroPaymentMockup';
import usdcLogo from '../assets/logos/usdc.png';
import xlmLogo from '../assets/logos/xlm.png';
import eurcLogo from '../assets/logos/eurc.png';

const CURRENCY_LOGOS: Record<string, string> = {
  USDC: usdcLogo,
  XLM: xlmLogo,
  EURC: eurcLogo,
};

const FLOW_STEP_ICONS = [Wallet, QrCode, Landmark] as const;
const BENEFIT_ICONS = [Landmark, Zap, Coins, ShieldCheck] as const;
const AUDIENCE_ICONS = [Store, Globe2, Layers] as const;
const STATS_ICONS = [Zap, Coins, Layers, Globe2] as const;

type Item = { title: string; description: string };
type StatItem = { value: string; label: string };
type ImpactStat = { value: string; label: string; source: string };
type CurrencyCard = { code: string; name: string; desc: string; featured?: boolean };

type HomeCopy = {
  badge: string;
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroTitleEnd: string;
  heroDescription: string;
  heroDescStart: string;
  heroDescHighlight: string;
  heroDescEnd: string;
  heroPrimaryCta: string;
  heroFootnote: string;
  howTitle: string;
  howSubtitle: string;
  benefitsTitle: string;
  benefitsSubtitle: string;
  audienceTitle: string;
  audienceSubtitle: string;
  impactTitle: string;
  impactSubtitle: string;
  moneyTitle: string;
  moneySubtitle: string;
  finalTitle: string;
  finalDescription: string;
  finalPrimaryCta: string;
  finalSecondaryCta: string;
  heroTag1: string;
  heroTag2: string;
  heroTag3: string;
};

const COPY: Record<Language, HomeCopy> = {
  en: {
    badge: 'Global payments powered by Stellar',
    heroTitleStart: 'Your customer pays in crypto.',
    heroTitleHighlight: 'You get paid',
    heroTitleEnd: 'in your local currency',
    heroDescription:
      'Link2Pay turns a QR or a link into a bridge between crypto and your bank account. Your customer pays with digital dollars from anywhere in the world and you receive your local currency, straight into your usual account. No crypto knowledge required.',
    heroDescStart: 'Link2Pay turns a QR or a link into a bridge between crypto and your bank account. Your customer pays with digital dollars from anywhere in the world and you receive your ',
    heroDescHighlight: 'local currency',
    heroDescEnd: ', straight into your usual account. No crypto knowledge required.',
    heroPrimaryCta: 'Create Your First Link',
    heroFootnote: 'Start free and go live on Stellar whenever you are ready.',
    howTitle: 'Start getting paid in 3 steps',
    howSubtitle: 'Connect your account, generate a link or QR, and receive a confirmed payment in seconds.',
    benefitsTitle: 'Why choose Link2Pay',
    benefitsSubtitle: 'Get paid faster, pay lower fees, and receive in the currency you already use.',
    audienceTitle: 'Made for you',
    audienceSubtitle: 'From the shop on the corner to the freelancer getting paid from abroad.',
    impactTitle: 'The problem we solve',
    impactSubtitle:
      'Remittances are slow and expensive. Stablecoins are already how Latin America moves money. Link2Pay connects both ends.',
    moneyTitle: 'Accept the assets your clients already use',
    moneySubtitle: 'Charge in USDC, the digital dollar, and convert it to local currency instantly. You also accept XLM and EURC.',
    finalTitle: 'Connect your business to the world',
    finalDescription:
      'Create your first link or QR in minutes, share it anywhere, and receive in your local currency.',
    finalPrimaryCta: 'Create Your First Link',
    finalSecondaryCta: 'Compare Plans',
    heroTag1: 'Paid in your currency',
    heroTag2: '~5s settlement',
    heroTag3: 'No crypto know-how',
  },
  es: {
    badge: 'Pagos globales sobre Stellar',
    heroTitleStart: 'Tu cliente paga en crypto.',
    heroTitleHighlight: 'Vos recibís',
    heroTitleEnd: 'en tu moneda local',
    heroDescription:
      'Link2Pay convierte un QR o un link en un puente entre crypto y tu cuenta bancaria. Tu cliente paga con dólares digitales desde cualquier parte del mundo y vos recibís en pesos, directo en tu cuenta de siempre. Sin saber nada de crypto.',
    heroDescStart: 'Link2Pay convierte un QR o un link en un puente entre crypto y tu cuenta bancaria. Tu cliente paga con dólares digitales desde cualquier parte del mundo y vos recibís en ',
    heroDescHighlight: 'pesos',
    heroDescEnd: ', directo en tu cuenta de siempre. Sin saber nada de crypto.',
    heroPrimaryCta: 'Crear mi primer link',
    heroFootnote: 'Empezá gratis y lanzá en vivo en Stellar cuando estés listo.',
    howTitle: 'Empezá a cobrar en 3 pasos',
    howSubtitle: 'Conectá tu cuenta, generá un link o QR, y recibí el pago confirmado en segundos.',
    benefitsTitle: 'Por qué elegir Link2Pay',
    benefitsSubtitle: 'Cobrás más rápido, pagás menos comisión y recibís en tu moneda de siempre.',
    audienceTitle: 'Hecho para vos',
    audienceSubtitle: 'Desde el comercio de la esquina hasta el freelancer que cobra desde el exterior.',
    impactTitle: 'El problema que resolvemos',
    impactSubtitle:
      'Las remesas son caras y lentas. Las stablecoins ya son la forma en que Latinoamérica mueve su dinero. Link2Pay conecta las dos puntas.',
    moneyTitle: 'Aceptá los activos que tus clientes ya usan',
    moneySubtitle: 'Cobrá en USDC, el dólar digital, y convertilo a tu moneda al instante. También aceptás XLM y EURC.',
    finalTitle: 'Conectá tu negocio con el mundo',
    finalDescription:
      'Generá tu primer link o QR en minutos, compartilo donde quieras y recibí en tu moneda local.',
    finalPrimaryCta: 'Crear mi primer link',
    finalSecondaryCta: 'Comparar planes',
    heroTag1: 'Recibís en tu moneda',
    heroTag2: 'Liquidación en ~5s',
    heroTag3: 'Sin saber de crypto',
  },
  pt: {
    badge: 'Pagamentos globais sobre Stellar',
    heroTitleStart: 'Seu cliente paga em cripto.',
    heroTitleHighlight: 'Você recebe',
    heroTitleEnd: 'na sua moeda local',
    heroDescription:
      'A Link2Pay transforma um QR ou um link em uma ponte entre as cripto e a sua conta bancária. Seu cliente paga com dólares digitais de qualquer parte do mundo e você recebe na sua moeda, direto na conta de sempre. Sem saber nada de cripto.',
    heroDescStart: 'A Link2Pay transforma um QR ou um link em uma ponte entre as cripto e a sua conta bancária. Seu cliente paga com dólares digitais de qualquer parte do mundo e você recebe na sua ',
    heroDescHighlight: 'moeda local',
    heroDescEnd: ', direto na conta de sempre. Sem saber nada de cripto.',
    heroPrimaryCta: 'Criar meu primeiro link',
    heroFootnote: 'Comece grátis e entre no ar na Stellar quando estiver pronto.',
    howTitle: 'Comece a receber em 3 passos',
    howSubtitle: 'Conecte sua conta, gere um link ou QR, e receba o pagamento confirmado em segundos.',
    benefitsTitle: 'Por que escolher a Link2Pay',
    benefitsSubtitle: 'Receba mais rápido, pague menos taxa e receba na moeda que você já usa.',
    audienceTitle: 'Feito para você',
    audienceSubtitle: 'Do comércio da esquina ao freelancer que recebe do exterior.',
    impactTitle: 'O problema que resolvemos',
    impactSubtitle:
      'As remessas são caras e lentas. As stablecoins já são como a América Latina movimenta dinheiro. A Link2Pay conecta as duas pontas.',
    moneyTitle: 'Aceite os ativos que seus clientes já usam',
    moneySubtitle: 'Receba em USDC, o dólar digital, e converta para a sua moeda na hora. Você também aceita XLM e EURC.',
    finalTitle: 'Conecte seu negócio com o mundo',
    finalDescription:
      'Gere seu primeiro link ou QR em minutos, compartilhe onde quiser e receba na sua moeda local.',
    finalPrimaryCta: 'Criar meu primeiro link',
    finalSecondaryCta: 'Comparar planos',
    heroTag1: 'Recebe na sua moeda',
    heroTag2: 'Liquidação em ~5s',
    heroTag3: 'Sem saber de cripto',
  },
};

const FLOW_STEPS: Record<Language, Array<Item & { step: string }>> = {
  en: [
    {
      step: '01',
      title: 'Connect your account securely',
      description: 'Your keys always stay on your device. You keep full control.',
    },
    {
      step: '02',
      title: 'Generate your link or QR in seconds',
      description: 'Pick the amount and share it. Ready to get paid.',
    },
    {
      step: '03',
      title: 'Receive in your local currency',
      description: 'Your customer pays, and you receive your local currency in your bank account. Track the status in real time.',
    },
  ],
  es: [
    {
      step: '01',
      title: 'Conectá tu cuenta de forma segura',
      description: 'Tus llaves quedan siempre en tu dispositivo. Vos tenés el control total.',
    },
    {
      step: '02',
      title: 'Generá tu link o QR en segundos',
      description: 'Elegí el monto y compartilo. Listo para cobrar.',
    },
    {
      step: '03',
      title: 'Recibí en tu moneda local',
      description: 'Tu cliente paga, y vos recibís pesos en tu cuenta bancaria. Seguí el estado en tiempo real.',
    },
  ],
  pt: [
    {
      step: '01',
      title: 'Conecte sua conta com segurança',
      description: 'Suas chaves ficam sempre no seu dispositivo. Você tem o controle total.',
    },
    {
      step: '02',
      title: 'Gere seu link ou QR em segundos',
      description: 'Escolha o valor e compartilhe. Pronto para receber.',
    },
    {
      step: '03',
      title: 'Receba na sua moeda local',
      description: 'Seu cliente paga, e você recebe na sua moeda direto na conta bancária. Acompanhe o status em tempo real.',
    },
  ],
};

const BENEFITS: Record<Language, Item[]> = {
  en: [
    {
      title: 'Receive in your local currency',
      description: 'Your customer pays in crypto from anywhere and you receive your local currency straight into your bank account. No exchanges, no detours.',
    },
    {
      title: 'Get paid faster',
      description: 'Most payments settle on Stellar in about 5 seconds.',
    },
    {
      title: 'Ultra-low fees',
      description: 'Network fees are near zero, from small amounts to large ones.',
    },
    {
      title: 'You stay in control',
      description: 'The money lands directly in your account. Link2Pay never holds your funds.',
    },
  ],
  es: [
    {
      title: 'Recibí en tu moneda local',
      description: 'Tu cliente paga en crypto desde cualquier parte del mundo y vos recibís pesos directo en tu cuenta bancaria. Sin exchanges, sin vueltas.',
    },
    {
      title: 'Cobrás más rápido',
      description: 'La mayoría de los pagos se liquidan en unos 5 segundos sobre Stellar.',
    },
    {
      title: 'Comisiones bajísimas',
      description: 'Las comisiones de red son casi cero, desde montos chicos hasta grandes.',
    },
    {
      title: 'Vos tenés el control',
      description: 'El dinero llega directo a tu cuenta. Link2Pay nunca retiene tu plata.',
    },
  ],
  pt: [
    {
      title: 'Receba na sua moeda local',
      description: 'Seu cliente paga em cripto de qualquer lugar e você recebe na sua moeda direto na conta bancária. Sem corretoras, sem voltas.',
    },
    {
      title: 'Receba mais rápido',
      description: 'A maioria dos pagamentos é liquidada em cerca de 5 segundos na Stellar.',
    },
    {
      title: 'Taxas baixíssimas',
      description: 'As taxas de rede são quase zero, de valores pequenos a grandes.',
    },
    {
      title: 'Você no controle',
      description: 'O dinheiro chega direto na sua conta. A Link2Pay nunca retém o seu dinheiro.',
    },
  ],
};

const AUDIENCES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Businesses and shops',
      description: 'Accept crypto payments without knowing anything about crypto. Your customer scans a QR and you receive your local currency.',
    },
    {
      title: 'Freelancers and individuals',
      description: 'Get paid from abroad without losing money on fees or waiting days. Send a link and receive in your currency.',
    },
    {
      title: 'Digital businesses and platforms',
      description: 'Integrate payments into your app or platform and track every transaction end to end.',
    },
  ],
  es: [
    {
      title: 'Negocios y comercios',
      description: 'Aceptá pagos en crypto sin saber nada de crypto. Tu cliente escanea un QR y vos recibís en pesos.',
    },
    {
      title: 'Freelancers y personas',
      description: 'Cobrá del exterior sin perder en comisiones ni esperar días. Mandás un link y recibís en tu moneda.',
    },
    {
      title: 'Negocios digitales y plataformas',
      description: 'Integrá pagos a tu app o plataforma y seguí cada transacción de principio a fin.',
    },
  ],
  pt: [
    {
      title: 'Negócios e comércios',
      description: 'Aceite pagamentos em cripto sem saber nada de cripto. Seu cliente escaneia um QR e você recebe na sua moeda.',
    },
    {
      title: 'Freelancers e pessoas',
      description: 'Receba do exterior sem perder em taxas nem esperar dias. Envia um link e recebe na sua moeda.',
    },
    {
      title: 'Negócios digitais e plataformas',
      description: 'Integre pagamentos ao seu app ou plataforma e acompanhe cada transação de ponta a ponta.',
    },
  ],
};

const AUDIENCE_FITS: Record<Language, string[]> = {
  en: ['Ideal for local sales', 'Ideal for international payments', 'Ideal for high volume'],
  es: ['Ideal para venta local', 'Ideal para pagos internacionales', 'Ideal para alto volumen'],
  pt: ['Ideal para venda local', 'Ideal para pagamentos internacionais', 'Ideal para alto volume'],
};

const STATS: Record<Language, StatItem[]> = {
  en: [
    { value: '~5s', label: 'Median settlement time' },
    { value: '<$0.01', label: 'Typical network fee' },
    { value: '3', label: 'Supported Stellar assets' },
    { value: '150+', label: 'Countries with access' },
  ],
  es: [
    { value: '~5s', label: 'Tiempo medio de liquidación' },
    { value: '<$0.01', label: 'Costo de red por transacción' },
    { value: '3', label: 'Activos Stellar soportados' },
    { value: '150+', label: 'Países con acceso' },
  ],
  pt: [
    { value: '~5s', label: 'Tempo médio de liquidação' },
    { value: '<$0.01', label: 'Custo de rede por transação' },
    { value: '3', label: 'Ativos Stellar suportados' },
    { value: '150+', label: 'Países com acesso' },
  ],
};

const IMPACT_STATS: Record<Language, ImpactStat[]> = {
  en: [
    {
      value: '6.36%',
      label: 'Average cost to send a remittance worldwide — over double the UN target.',
      source: 'https://remittanceprices.worldbank.org/',
    },
    {
      value: 'USD 11.85B',
      label: 'Remittances Colombia received in 2024: its second-largest source of foreign currency (2.3% of GDP).',
      source: 'https://www.bbvaresearch.com/en/publicaciones/colombia-remittances-matter-and-more-than-ever/',
    },
    {
      value: '48%',
      label: 'Of all crypto purchases in Colombia in 2024 were stablecoins.',
      source: 'https://dune.com/blog/latam-crypto-2025-report',
    },
    {
      value: '~5s · $0.00001',
      label: 'Stellar settles in seconds at a near-zero cost per transaction.',
      source: 'https://stellar.org/faq',
    },
    {
      value: 'PayPal & Visa',
      label: 'Already run stablecoin payments on the Stellar network.',
      source: 'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    },
  ],
  es: [
    {
      value: '6,36%',
      label: 'Costo promedio de enviar una remesa en el mundo — más del doble de la meta de la ONU.',
      source: 'https://remittanceprices.worldbank.org/',
    },
    {
      value: 'USD 11.848 M',
      label: 'Remesas que recibió Colombia en 2024: su segunda fuente de divisas (2,3% del PIB).',
      source: 'https://www.bbvaresearch.com/en/publicaciones/colombia-remittances-matter-and-more-than-ever/',
    },
    {
      value: '48%',
      label: 'De las compras de cripto en Colombia en 2024 fueron stablecoins.',
      source: 'https://dune.com/blog/latam-crypto-2025-report',
    },
    {
      value: '~5s · $0,00001',
      label: 'Stellar liquida en segundos y a un costo casi nulo por transacción.',
      source: 'https://stellar.org/faq',
    },
    {
      value: 'PayPal y Visa',
      label: 'Ya operan sus pagos con stablecoins sobre la red Stellar.',
      source: 'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    },
  ],
  pt: [
    {
      value: '6,36%',
      label: 'Custo médio para enviar uma remessa no mundo — mais que o dobro da meta da ONU.',
      source: 'https://remittanceprices.worldbank.org/',
    },
    {
      value: 'USD 11,85 bi',
      label: 'Remessas que a Colômbia recebeu em 2024: sua segunda fonte de divisas (2,3% do PIB).',
      source: 'https://www.bbvaresearch.com/en/publicaciones/colombia-remittances-matter-and-more-than-ever/',
    },
    {
      value: '48%',
      label: 'Das compras de cripto na Colômbia em 2024 foram stablecoins.',
      source: 'https://dune.com/blog/latam-crypto-2025-report',
    },
    {
      value: '~5s · $0,00001',
      label: 'A Stellar liquida em segundos e a um custo quase nulo por transação.',
      source: 'https://stellar.org/faq',
    },
    {
      value: 'PayPal e Visa',
      label: 'Já operam pagamentos com stablecoins na rede Stellar.',
      source: 'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    },
  ],
};

const CURRENCIES: Record<Language, CurrencyCard[]> = {
  en: [
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'The digital dollar by Circle. Charge in a stable value and convert it to your local currency instantly.',
      featured: true,
    },
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Native Stellar asset for fast settlement and very low network fees.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Euro-pegged stablecoin by Circle for cross-border EUR collections.',
    },
  ],
  es: [
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'El dólar digital de Circle. Cobra en un valor estable y conviértelo a tu moneda al instante.',
      featured: true,
    },
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Activo nativo de Stellar para liquidación rápida y comisiones muy bajas.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin vinculada al euro por Circle para cobros internacionales en EUR.',
    },
  ],
  pt: [
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'O dólar digital da Circle. Receba em um valor estável e converta para a sua moeda na hora.',
      featured: true,
    },
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Ativo nativo da Stellar para liquidação rápida e taxas muito baixas.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin pareada ao euro pela Circle para cobranças internacionais em EUR.',
    },
  ],
};

const HOME_EXTRAS: Record<
  Language,
  {
    snapshotTitle: string;
    snapshotSubtitle: string;
    benefitsCta: string;
    assetsNote: string;
    assetsEyebrow: string;
    sourceLabel: string;
    featuredLabel: string;
    lifecycleCreated: string;
    lifecyclePending: string;
    lifecycleConfirmed: string;
  }
> = {
  en: {
    snapshotTitle: 'Why Stellar makes the difference',
    snapshotSubtitle: 'Settlement in seconds, near-zero fees, and global reach. This is what makes the bridge possible.',
    benefitsCta: 'Explore capabilities',
    assetsNote: 'Use one integration pattern and choose the asset per payment request.',
    assetsEyebrow: 'One flow, multiple assets',
    sourceLabel: 'Source',
    featuredLabel: 'Most used',
    lifecycleCreated: 'CREATED - link generated',
    lifecyclePending: 'PENDING - waiting for payer confirmation',
    lifecycleConfirmed: 'CONFIRMED - settlement completed on-chain',
  },
  es: {
    snapshotTitle: 'Por qué Stellar hace la diferencia',
    snapshotSubtitle: 'Liquidación en segundos, comisiones casi en cero y alcance global. Esto es lo que hace posible el puente.',
    benefitsCta: 'Explorar capacidades',
    assetsNote: 'Usa un solo patrón de integración y elige el activo por solicitud de pago.',
    assetsEyebrow: 'Un flujo, varios activos',
    sourceLabel: 'Fuente',
    featuredLabel: 'El más usado',
    lifecycleCreated: 'CREATED - link generado',
    lifecyclePending: 'PENDING - esperando confirmación del pagador',
    lifecycleConfirmed: 'CONFIRMED - liquidación completada on-chain',
  },
  pt: {
    snapshotTitle: 'Por que a Stellar faz a diferença',
    snapshotSubtitle: 'Liquidação em segundos, taxas quase zero e alcance global. É isso que torna a ponte possível.',
    benefitsCta: 'Explorar capacidades',
    assetsNote: 'Use um único padrão de integração e escolha o ativo por solicitação de pagamento.',
    assetsEyebrow: 'Um fluxo, vários ativos',
    sourceLabel: 'Fonte',
    featuredLabel: 'O mais usado',
    lifecycleCreated: 'CREATED - link gerado',
    lifecyclePending: 'PENDING - aguardando confirmação do pagador',
    lifecycleConfirmed: 'CONFIRMED - liquidação concluída on-chain',
  },
};

export default function Home() {
  const { language } = useI18n();

  const copy = COPY[language];
  const flowSteps = FLOW_STEPS[language];
  const benefits = BENEFITS[language];
  const audiences = AUDIENCES[language];
  const audienceFits = AUDIENCE_FITS[language];
  const stats = STATS[language];
  const impactStats = IMPACT_STATS[language];
  const currencies = CURRENCIES[language];
  const extras = HOME_EXTRAS[language];

  return (
    <div>
      {/* Hero: the thesis (left) + the product itself, live (right) */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--primary)_/_0.12),transparent_68%)]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--success)_/_0.07),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary animate-fade-in">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.badge}
              </span>
              <h1
                className="mt-6 text-4xl font-semibold tracking-tight leading-[1.08] text-foreground sm:text-[2.75rem] sm:leading-[1.07] lg:text-[3rem] lg:leading-[1.06] animate-slide-up"
                style={{ animationDelay: '0.08s' }}
              >
                <span className="block [text-wrap:balance]">{copy.heroTitleStart}</span>
                <span className="block [text-wrap:balance]">
                  <span className="text-gradient-flow">{copy.heroTitleHighlight}</span> {copy.heroTitleEnd}
                </span>
              </h1>
              <p
                className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 animate-slide-up"
                style={{ animationDelay: '0.14s' }}
              >
                {copy.heroDescStart}
                <span className="font-semibold text-success">{copy.heroDescHighlight}</span>
                {copy.heroDescEnd}
              </p>
              <div
                className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start animate-slide-up"
                style={{ animationDelay: '0.2s' }}
              >
                <Link to="/app" className="btn-primary px-6 py-3.5 text-sm">
                  {copy.heroPrimaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/plans" className="btn-secondary px-6 py-3.5 text-sm">
                  {copy.finalSecondaryCta}
                </Link>
              </div>
              <div
                className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-2xs font-medium uppercase tracking-[0.2em] text-muted-foreground lg:justify-start animate-fade-in"
                style={{ animationDelay: '0.28s' }}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {copy.heroTag1}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {copy.heroTag2}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {copy.heroTag3}
                </span>
              </div>
            </div>

            <div className="w-full animate-fade-in" style={{ animationDelay: '0.18s' }}>
              <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-5 shadow-[0_32px_90px_hsl(var(--primary)_/_0.16)] backdrop-blur sm:p-7">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,_hsl(var(--card)),_hsl(var(--background)))]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)_/_0.16),transparent_60%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,_hsl(var(--primary)_/_0.07)_1px,transparent_1px),linear-gradient(180deg,_hsl(var(--primary)_/_0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
                <div className="relative">
                  <HeroPaymentMockup />
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">{copy.heroFootnote}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="scroll-mt-40 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)_/_0.16),transparent_62%)]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-primary">
                  <Send className="h-3.5 w-3.5" />
                  {copy.badge}
                </span>
                <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">{extras.snapshotTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{extras.snapshotSubtitle}</p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/app" className="btn-primary px-5 py-2.5 text-sm">
                    {copy.heroPrimaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat, index) => {
                const Icon = STATS_ICONS[index];
                return (
                  <article
                    key={stat.label}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,_hsl(var(--primary)_/_0.10),transparent)]" />
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-5 font-mono text-2xl font-semibold tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-3xl">
                        {stat.value}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="flow" className="scroll-mt-40 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.howTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.howSubtitle}</p>
        </div>

        {/* One container, three stations: the money moves left to right and
            lands green — the same indigo→green story as the hero. */}
        <ol className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-3 md:divide-x md:divide-border">
          {flowSteps.map((step, index) => {
            const Icon = FLOW_STEP_ICONS[index];
            const terminal = index === flowSteps.length - 1;
            return (
              <li
                key={step.title}
                className={`relative p-7 sm:p-8 ${index > 0 ? 'border-t border-border md:border-t-0' : ''}`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-20 ${
                    terminal
                      ? 'bg-[linear-gradient(180deg,_hsl(var(--success)_/_0.10),transparent)]'
                      : 'bg-[linear-gradient(180deg,_hsl(var(--primary)_/_0.08),transparent)]'
                  }`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                        terminal
                          ? 'border-success-border bg-success-subtle text-success'
                          : 'border-primary/25 bg-primary/10 text-primary'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold ${terminal ? 'text-success' : 'text-primary'}`}
                    >
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="benefits" className="scroll-mt-40 border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <div>
              <h2 className="text-3xl font-semibold text-foreground">{copy.benefitsTitle}</h2>
              <p className="mt-3 text-base text-muted-foreground">{copy.benefitsSubtitle}</p>
              <Link to="/payment-links" className="btn-secondary mt-6 w-fit px-5 py-2.5 text-sm">
                {extras.benefitsCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => {
                const Icon = BENEFIT_ICONS[index];
                // The first benefit is the product's promise — money landing in
                // your account — so it wears the money green, not the crypto indigo.
                const featured = index === 0;
                return (
                  <article
                    key={benefit.title}
                    className={`rounded-2xl border p-6 ${
                      featured ? 'border-success-border bg-success-subtle/60 sm:col-span-2' : 'border-border bg-background'
                    }`}
                  >
                    <div
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg border ${
                        featured
                          ? 'border-success-border bg-success-subtle text-success'
                          : 'border-primary/25 bg-primary/10 text-primary'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="teams" className="scroll-mt-40 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.audienceTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.audienceSubtitle}</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {audiences.map((audience, index) => {
            const Icon = AUDIENCE_ICONS[index];
            return (
              <article key={audience.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{audience.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{audience.description}</p>
                <div className="mt-6 border-t border-border pt-4 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {audienceFits[index]}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="impact" className="scroll-mt-40 border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.impactTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.impactSubtitle}</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {impactStats.map((item) => (
              <article key={item.label} className="flex flex-col rounded-2xl border border-border bg-background p-6">
                <div className="font-mono text-3xl font-semibold tracking-tight text-primary [font-variant-numeric:tabular-nums]">
                  {item.value}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{item.label}</p>
                <a
                  href={item.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 border-t border-border pt-3 text-2xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
                >
                  {extras.sourceLabel}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="assets" className="scroll-mt-40 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">{copy.moneyTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.moneySubtitle}</p>

            <div className="mt-7 rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{extras.assetsEyebrow}</p>
              <p className="mt-3 text-sm text-muted-foreground">{extras.assetsNote}</p>
              <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{extras.lifecycleCreated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary/70" />
                  <span>{extras.lifecyclePending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span>{extras.lifecycleConfirmed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {currencies.map((currency) => (
              <article
                key={currency.code}
                className={`relative overflow-hidden rounded-2xl border bg-card p-6 ${
                  currency.featured ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)_/_0.12),transparent_62%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-primary/10 p-2">
                      <img
                        src={CURRENCY_LOGOS[currency.code]}
                        alt={currency.code}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">{currency.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{currency.desc}</p>
                    </div>
                  </div>
                  {currency.featured && (
                    <span className="hidden shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-primary sm:inline-flex">
                      {extras.featuredLabel}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="scroll-mt-40 mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(var(--primary)),_hsl(var(--accent)))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-3xl font-semibold text-primary-foreground">{copy.finalTitle}</h3>
              <p className="mt-4 text-base text-primary-foreground/80">{copy.finalDescription}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link to="/app" className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3">
                  {copy.finalPrimaryCta}
                  <Rocket className="h-4 w-4" />
                </Link>
                <Link to="/plans" className="btn border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 px-6 py-3">
                  {copy.finalSecondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
