import { Link } from 'react-router-dom';
import {
  ArrowRight,
  DollarSign,
  FileText,
  Globe2,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import HeroQuickLink from '../components/marketing/HeroQuickLink';

const FLOW_STEP_ICONS = [Wallet, FileText, Send] as const;
const BENEFIT_ICONS = [Zap, DollarSign, Globe2, ShieldCheck] as const;
const AUDIENCE_ICONS = [Users, TrendingUp, Globe2] as const;
const STATS_ICONS = [Rocket, TrendingUp, Wallet, Globe2] as const;

type Item = { title: string; description: string };
type StatItem = { value: string; label: string };
type Testimonial = { quote: string; name: string; role: string };
type CurrencyCard = { code: string; name: string; desc: string };

type HomeCopy = {
  badge: string;
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroTitleEnd: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroSecondaryNote: string;
  heroSecondaryBadge: string;
  heroFootnote: string;
  howTitle: string;
  howSubtitle: string;
  benefitsTitle: string;
  benefitsSubtitle: string;
  audienceTitle: string;
  audienceSubtitle: string;
  testimonialsTitle: string;
  testimonialsSubtitle: string;
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
    heroTitleStart: 'Turn every payment intent into',
    heroTitleHighlight: 'an instant checkout link',
    heroTitleEnd: 'and get paid in seconds',
    heroDescription:
      'Link2Pay helps freelancers, agencies, and product teams collect payments without banking delays. Create a link, share it, and settle on-chain in about 5 seconds.',
    heroPrimaryCta: 'Create Your First Link',
    heroSecondaryCta: 'SDK + Docs',
    heroSecondaryNote: 'Integration guides and API reference coming soon',
    heroSecondaryBadge: 'Soon',
    heroFootnote: 'Start free on Testnet and switch to Mainnet when you are ready.',
    howTitle: 'How teams launch in one afternoon',
    howSubtitle: 'Connect wallet, generate a link, and confirm payment with real-time status.',
    benefitsTitle: 'Why teams switch to Link2Pay',
    benefitsSubtitle: 'Faster cash flow, lower friction, and a checkout your clients trust.',
    audienceTitle: 'Made for modern payment teams',
    audienceSubtitle: 'From solo operators to scaling platforms, Link2Pay keeps operations simple.',
    testimonialsTitle: 'Stories from teams shipping faster',
    testimonialsSubtitle: 'Used by teams in 30+ countries to launch checkout with less engineering effort.',
    moneyTitle: 'Accept the assets your clients already use',
    moneySubtitle: 'Collect XLM, USDC, and EURC in one checkout flow with fast finality.',
    finalTitle: 'Launch your next payment flow today',
    finalDescription:
      'Create a payment link in minutes, share it anywhere, and track every status update from CREATED to CONFIRMED. Upgrade when you need webhooks, branding, and team controls.',
    finalPrimaryCta: 'Create Your First Link',
    finalSecondaryCta: 'Compare Plans',
    heroTag1: '150+ Countries',
    heroTag2: '5s Settlement',
    heroTag3: 'API + Webhooks',
  },
  es: {
    badge: 'Pagos globales impulsados por Stellar',
    heroTitleStart: 'Convierte cada intencion de pago en',
    heroTitleHighlight: 'un link de checkout instantáneo',
    heroTitleEnd: 'y cobra en segundos',
    heroDescription:
      'Link2Pay ayuda a freelancers, agencias y equipos de producto a cobrar sin demoras bancarias. Crea un link, compártelo y liquida on-chain en unos 5 segundos.',
    heroPrimaryCta: 'Crear mi primer link',
    heroSecondaryCta: 'SDK + Docs',
    heroSecondaryNote: 'Guías de integración y referencia API muy pronto',
    heroSecondaryBadge: 'Pronto',
    heroFootnote: 'Empieza gratis en Testnet y pasa a Mainnet cuando estés listo.',
    howTitle: 'Cómo lanzar en una tarde',
    howSubtitle: 'Conecta wallet, genera el link y confirma el pago con estado en tiempo real.',
    benefitsTitle: 'Por qué los equipos eligen Link2Pay',
    benefitsSubtitle: 'Mejor flujo de caja, menos fricción y checkout confiable para tus clientes.',
    audienceTitle: 'Hecho para equipos de pagos modernos',
    audienceSubtitle: 'Desde operadores independientes hasta plataformas en crecimiento.',
    testimonialsTitle: 'Historias de equipos que lanzan más rápido',
    testimonialsSubtitle: 'Equipos en 30+ países lanzan checkout con menos esfuerzo de ingeniería.',
    moneyTitle: 'Acepta los activos que tus clientes ya usan',
    moneySubtitle: 'Cobra XLM, USDC y EURC en un solo flujo con finalidad rápida.',
    finalTitle: 'Lanza tu siguiente flujo de pago hoy',
    finalDescription:
      'Crea un link de pago en minutos, compártelo en cualquier canal y sigue cada estado desde CREATED hasta CONFIRMED. Escala con webhooks, branding y control de equipo.',
    finalPrimaryCta: 'Crear mi primer link',
    finalSecondaryCta: 'Comparar planes',
    heroTag1: '150+ Países',
    heroTag2: 'Liquidación en 5s',
    heroTag3: 'API + Webhooks',
  },
  pt: {
    badge: 'Pagamentos globais com Stellar',
    heroTitleStart: 'Transforme cada intencao de pagamento em',
    heroTitleHighlight: 'um link de checkout instantâneo',
    heroTitleEnd: 'e receba em segundos',
    heroDescription:
      'Link2Pay ajuda freelancers, agências e times de produto a receber sem atrasos bancários. Crie um link, compartilhe e liquide on-chain em cerca de 5 segundos.',
    heroPrimaryCta: 'Criar meu primeiro link',
    heroSecondaryCta: 'SDK + Docs',
    heroSecondaryNote: 'Guias de integração e referência de API em breve',
    heroSecondaryBadge: 'Em breve',
    heroFootnote: 'Comece grátis na Testnet e mude para Mainnet quando estiver pronto.',
    howTitle: 'Como lançar em uma tarde',
    howSubtitle: 'Conecte a wallet, gere o link e confirme o pagamento em tempo real.',
    benefitsTitle: 'Por que os times escolhem Link2Pay',
    benefitsSubtitle: 'Mais velocidade de caixa, menos fricção e checkout confiável.',
    audienceTitle: 'Feito para times de pagamentos modernos',
    audienceSubtitle: 'De operadores independentes a plataformas em crescimento.',
    testimonialsTitle: 'Histórias de times que lançam mais rápido',
    testimonialsSubtitle: 'Times em 30+ países lançam checkout com menos esforço de engenharia.',
    moneyTitle: 'Aceite os ativos que seus clientes já usam',
    moneySubtitle: 'Receba XLM, USDC e EURC em um único fluxo com finalidade rápida.',
    finalTitle: 'Lance seu próximo fluxo de pagamento hoje',
    finalDescription:
      'Crie um link de pagamento em minutos, compartilhe em qualquer canal e acompanhe cada status de CREATED a CONFIRMED. Escale com webhooks, branding e controles de equipe.',
    finalPrimaryCta: 'Criar meu primeiro link',
    finalSecondaryCta: 'Comparar planos',
    heroTag1: '150+ Países',
    heroTag2: 'Liquidação em 5s',
    heroTag3: 'API + Webhooks',
  },
};

const FLOW_STEPS: Record<Language, Array<Item & { step: string }>> = {
  en: [
    {
      step: '01',
      title: 'Connect your wallet securely',
      description: 'Sign in with Freighter. Your private keys stay on your device.',
    },
    {
      step: '02',
      title: 'Create a payment link in seconds',
      description: 'Set amount, choose asset, define expiration, and add metadata when needed.',
    },
    {
      step: '03',
      title: 'Share the link and confirm settlement',
      description: 'Send the checkout URL and track status in real time until CONFIRMED.',
    },
  ],
  es: [
    {
      step: '01',
      title: 'Conecta tu wallet de forma segura',
      description: 'Inicia sesión con Freighter. Tus llaves privadas se quedan en tu dispositivo.',
    },
    {
      step: '02',
      title: 'Crea un link de pago en segundos',
      description: 'Define monto, activo, expiración y metadata cuando la necesites.',
    },
    {
      step: '03',
      title: 'Comparte el link y confirma la liquidación',
      description: 'Envía la URL de checkout y sigue el estado en tiempo real hasta CONFIRMED.',
    },
  ],
  pt: [
    {
      step: '01',
      title: 'Conecte sua wallet com seguranca',
      description: 'Entre com Freighter. Suas chaves privadas ficam no seu dispositivo.',
    },
    {
      step: '02',
      title: 'Crie um link de pagamento em segundos',
      description: 'Defina valor, ativo, expiração e metadata quando precisar.',
    },
    {
      step: '03',
      title: 'Compartilhe o link e confirme a liquidação',
      description: 'Envie a URL de checkout e acompanhe o status em tempo real até CONFIRMED.',
    },
  ],
};

const BENEFITS: Record<Language, Item[]> = {
  en: [
    {
      title: 'Faster cash flow',
      description: 'Most payments finalize on Stellar in about 5 seconds, so your team moves faster.',
    },
    {
      title: 'Low transaction costs',
      description: 'Network fees stay near zero, from small intents to high-value transactions.',
    },
    {
      title: 'Global collection',
      description: 'Accept payments across borders with one checkout flow and no banking bottlenecks.',
    },
    {
      title: 'Non-custodial control',
      description: 'Funds settle directly to your wallet. Link2Pay does not hold customer balances.',
    },
  ],
  es: [
    {
      title: 'Flujo de caja más rápido',
      description: 'La mayoría de pagos en Stellar se confirma en unos 5 segundos.',
    },
    {
      title: 'Costos de transacción bajos',
      description: 'Las comisiones de red se mantienen casi en cero para montos chicos o grandes.',
    },
    {
      title: 'Cobro global',
      description: 'Acepta pagos transfronterizos con un solo flujo de checkout.',
    },
    {
      title: 'Control non-custodial',
      description: 'Los fondos llegan directo a tu wallet. Link2Pay no retiene balances.',
    },
  ],
  pt: [
    {
      title: 'Fluxo de caixa mais rápido',
      description: 'A maioria dos pagamentos na Stellar confirma em cerca de 5 segundos.',
    },
    {
      title: 'Custos de transação baixos',
      description: 'As taxas de rede ficam quase em zero para valores pequenos ou altos.',
    },
    {
      title: 'Recebimento global',
      description: 'Aceite pagamentos internacionais com um único fluxo de checkout.',
    },
    {
      title: 'Controle non-custodial',
      description: 'Os fundos chegam direto na sua wallet. Link2Pay não retém saldos.',
    },
  ],
};

const AUDIENCES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Freelancers and agencies',
      description: 'Send one payment link per project and reduce back-and-forth on collection.',
    },
    {
      title: 'SaaS and product teams',
      description: 'Add payment links to your app quickly without maintaining custom checkout logic.',
    },
    {
      title: 'Marketplaces and platforms',
      description: 'Create payment intents at scale and monitor each transaction lifecycle.',
    },
  ],
  es: [
    {
      title: 'Freelancers y agencias',
      description: 'Comparte un link por proyecto y reduce fricción al cobrar.',
    },
    {
      title: 'SaaS y equipos de producto',
      description: 'Agrega links de pago en tu app sin mantener logica de checkout personalizada.',
    },
    {
      title: 'Marketplaces y plataformas',
      description: 'Genera intents de pago a escala y monitorea cada ciclo de transacción.',
    },
  ],
  pt: [
    {
      title: 'Freelancers e agencias',
      description: 'Compartilhe um link por projeto e reduza atrito na cobrança.',
    },
    {
      title: 'SaaS e times de produto',
      description: 'Adicione links de pagamento no app sem manter checkout customizado.',
    },
    {
      title: 'Marketplaces e plataformas',
      description: 'Gere intents de pagamento em escala e acompanhe cada ciclo da transação.',
    },
  ],
};

const AUDIENCE_FITS: Record<Language, string[]> = {
  en: ['Best for project-based billing', 'Best for embedded checkout flows', 'Best for high-volume payment operations'],
  es: ['Ideal para facturacion por proyecto', 'Ideal para checkout embebido en producto', 'Ideal para operaciones de cobro en alto volumen'],
  pt: ['Ideal para faturamento por projeto', 'Ideal para checkout embutido no produto', 'Ideal para operacoes de pagamento em alto volume'],
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

const TESTIMONIALS: Record<Language, Testimonial[]> = {
  en: [
    {
      quote: 'We replaced manual bank follow-ups with one checkout link. Time to get paid dropped from days to minutes.',
      name: 'Maria G.',
      role: 'COO, Digital Studio - Colombia',
    },
    {
      quote: 'Integration was simple: create link, listen to webhook, update order status. We shipped in one sprint.',
      name: 'James K.',
      role: 'Lead Engineer - Nigeria',
    },
    {
      quote: 'Cross-border billing became easier with USDC and EURC. Clients pay faster and support tickets dropped.',
      name: 'Sofia R.',
      role: 'Founder, Agency - Argentina',
    },
  ],
  es: [
    {
      quote: 'Reemplazamos seguimiento manual bancario por un solo link de checkout. Pasamos de días a minutos para cobrar.',
      name: 'Maria G.',
      role: 'COO, Estudio Digital - Colombia',
    },
    {
      quote: 'La integración fue simple: crear link, escuchar webhook y actualizar estado de orden. Lo lanzamos en un sprint.',
      name: 'James K.',
      role: 'Lead Engineer - Nigeria',
    },
    {
      quote: 'La facturación internacional fue más fácil con USDC y EURC. Los clientes pagan más rápido y bajaron los tickets.',
      name: 'Sofia R.',
      role: 'Fundadora, Agencia - Argentina',
    },
  ],
  pt: [
    {
      quote: 'Trocamos acompanhamento manual bancário por um único link de checkout. O tempo para receber caiu de dias para minutos.',
      name: 'Maria G.',
      role: 'COO, Estudio Digital - Colombia',
    },
    {
      quote: 'A integração foi simples: criar link, receber webhook e atualizar status do pedido. Lançamos em um sprint.',
      name: 'James K.',
      role: 'Lead Engineer - Nigeria',
    },
    {
      quote: 'A cobrança internacional ficou mais fácil com USDC e EURC. Clientes pagam mais rápido e os tickets caíram.',
      name: 'Sofia R.',
      role: 'Fundadora, Agencia - Argentina',
    },
  ],
};

const CURRENCIES: Record<Language, CurrencyCard[]> = {
  en: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Native Stellar asset for fast settlement and very low network fees.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Dollar-pegged stablecoin by Circle for USD pricing and settlement.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Euro-pegged stablecoin by Circle for cross-border EUR collections.',
    },
  ],
  es: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Activo nativo de Stellar para liquidación rápida y comisiones muy bajas.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Stablecoin vinculada al dólar por Circle para cobros y liquidación en USD.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin vinculada al euro por Circle para cobros internacionales en EUR.',
    },
  ],
  pt: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Ativo nativo da Stellar para liquidação rápida e taxas muito baixas.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Stablecoin pareada ao dólar pela Circle para cobrança e liquidação em USD.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin pareada ao euro pela Circle para cobrancas internacionais em EUR.',
    },
  ],
};

const HOME_EXTRAS: Record<
  Language,
  {
    snapshotTitle: string;
    snapshotSubtitle: string;
    benefitsCta: string;
    ratingNote: string;
    assetsNote: string;
    sdkCta: string;
    sdkHint: string;
    lifecycleCreated: string;
    lifecyclePending: string;
    lifecycleConfirmed: string;
  }
> = {
  en: {
    snapshotTitle: 'Payments overview at a glance',
    snapshotSubtitle: 'Monitor settlement speed, fees, and global reach before scaling your live checkout.',
    benefitsCta: 'Explore capabilities',
    ratingNote: 'Average partner rating after launching live payment links.',
    assetsNote: 'Use one integration pattern and choose the asset per payment request.',
    sdkCta: 'Open SDK Section',
    sdkHint: 'Need implementation details?',
    lifecycleCreated: 'CREATED - link generated',
    lifecyclePending: 'PENDING - waiting for payer confirmation',
    lifecycleConfirmed: 'CONFIRMED - settlement completed on-chain',
  },
  es: {
    snapshotTitle: 'Panorama de pagos en un vistazo',
    snapshotSubtitle: 'Visualiza velocidad de liquidacion, costos y alcance global antes de escalar checkout en vivo.',
    benefitsCta: 'Explorar capacidades',
    ratingNote: 'Calificacion promedio de partners despues de lanzar links de pago en vivo.',
    assetsNote: 'Usa un solo patron de integracion y elige el activo por solicitud de pago.',
    sdkCta: 'Abrir seccion SDK',
    sdkHint: 'Necesitas detalles de implementacion?',
    lifecycleCreated: 'CREATED - link generado',
    lifecyclePending: 'PENDING - esperando confirmacion del pagador',
    lifecycleConfirmed: 'CONFIRMED - liquidacion completada on-chain',
  },
  pt: {
    snapshotTitle: 'Panorama de pagamentos em um relance',
    snapshotSubtitle: 'Visualize velocidade de liquidacao, custos e alcance global antes de escalar checkout em producao.',
    benefitsCta: 'Explorar capacidades',
    ratingNote: 'Nota media de parceiros apos lancar links de pagamento ao vivo.',
    assetsNote: 'Use um unico padrao de integracao e escolha o ativo por solicitacao de pagamento.',
    sdkCta: 'Abrir secao SDK',
    sdkHint: 'Precisa de detalhes de implementacao?',
    lifecycleCreated: 'CREATED - link gerado',
    lifecyclePending: 'PENDING - aguardando confirmacao do pagador',
    lifecycleConfirmed: 'CONFIRMED - liquidacao concluida on-chain',
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
  const testimonials = TESTIMONIALS[language];
  const currencies = CURRENCIES[language];
  const extras = HOME_EXTRAS[language];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.12),transparent_68%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom,_hsl(175_75%_45%_/_0.06),transparent_68%)]" />
        <div className="relative mx-auto max-w-[1480px] px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary animate-fade-in">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.badge}
              </span>
              <h1
                className="mt-8 text-4xl font-semibold tracking-tight leading-[1.04] text-foreground md:text-6xl md:leading-[1.04] lg:text-7xl lg:leading-[1.02] animate-slide-up"
                style={{ animationDelay: '0.08s' }}
              >
                <span className="block">
                  {copy.heroTitleStart} <span className="text-gradient">{copy.heroTitleHighlight}</span>
                </span>
                <span className="block">{copy.heroTitleEnd}</span>
              </h1>
              <p
                className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg lg:mx-0 animate-slide-up"
                style={{ animationDelay: '0.16s' }}
              >
                {copy.heroDescription}
              </p>
              <div
                className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start animate-slide-up"
                style={{ animationDelay: '0.24s' }}
              >
                <Link to="/app" className="btn-primary px-6 py-3.5 text-sm">
                  {copy.heroPrimaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/35 bg-card/80 px-4 py-2.5 text-left shadow-[0_8px_32px_hsl(var(--primary)_/_0.1)]">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/35 bg-primary/15 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight text-foreground">{copy.heroSecondaryCta}</span>
                    <span className="text-[11px] leading-tight text-muted-foreground">{copy.heroSecondaryNote}</span>
                  </span>
                  <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {copy.heroSecondaryBadge}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '0.32s' }}>
                {copy.heroFootnote}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground lg:justify-start">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  {copy.heroTag1}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  {copy.heroTag2}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  {copy.heroTag3}
                </span>
              </div>
            </div>

            <div className="w-full animate-fade-in lg:mt-4" style={{ animationDelay: '0.2s' }}>
              <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/90 p-8 shadow-[0_40px_120px_hsl(var(--primary)_/_0.2)] backdrop-blur sm:p-10 lg:p-12">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,_hsl(var(--card)),_hsl(var(--background)))]" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)_/_0.2),transparent_60%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,_hsl(var(--primary)_/_0.07)_1px,transparent_1px),linear-gradient(180deg,_hsl(var(--primary)_/_0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
                <div className="relative">
                  <HeroQuickLink />
                </div>
              </div>
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
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
                  <Send className="h-3.5 w-3.5" />
                  {copy.badge}
                </span>
                <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">{extras.snapshotTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{extras.snapshotSubtitle}</p>

                <div className="mt-7 space-y-3">
                  {[copy.heroTag1, copy.heroTag2, copy.heroTag3].map((tag) => (
                    <div key={tag} className="flex items-center gap-3 rounded-xl border border-border bg-background/80 px-4 py-3">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <p className="text-xs font-medium text-muted-foreground">{tag}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/app" className="btn-primary px-5 py-2.5 text-sm">
                    {copy.heroPrimaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {extras.sdkHint}{' '}
                  <Link to="/sdk" className="font-medium text-primary hover:underline">
                    {extras.sdkCta}
                  </Link>
                </p>
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
                      <div className="mt-5 text-2xl font-semibold text-primary sm:text-3xl">{stat.value}</div>
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <h2 className="text-3xl font-semibold text-foreground">{copy.howTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.howSubtitle}</p>

            <div className="mt-8 rounded-2xl border border-border bg-card p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{copy.heroTag2}</p>
              <div className="mt-4 space-y-3">
                {flowSteps.map((step) => (
                  <div key={step.step} className="flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2.5">
                    <span className="text-sm font-semibold text-primary">{step.step}</span>
                    <p className="text-xs text-muted-foreground">{step.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ol className="relative space-y-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-5 left-6 top-5 hidden w-px bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0 md:block"
            />
            {flowSteps.map((step, index) => {
              const Icon = FLOW_STEP_ICONS[index];
              return (
                <li
                  key={step.title}
                  className={`relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-7 ${
                    index % 2 === 0 ? 'md:mr-10' : 'md:ml-10'
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,_hsl(var(--primary)_/_0.10),transparent)]" />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-[0.12em] text-primary">{step.step}</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
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
                return (
                  <article key={benefit.title} className="rounded-2xl border border-border bg-background p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
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

      <section id="stories" className="scroll-mt-40 border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
            <div>
              <h2 className="text-3xl font-semibold text-foreground">{copy.testimonialsTitle}</h2>
              <p className="mt-3 text-base text-muted-foreground">{copy.testimonialsSubtitle}</p>
              <div className="mt-8 rounded-2xl border border-border bg-background p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{copy.heroTag1}</p>
                <p className="mt-2 text-4xl font-semibold text-primary">4.9/5</p>
                <p className="mt-2 text-sm text-muted-foreground">{extras.ratingNote}</p>
              </div>
            </div>

            <div className="-mx-4 overflow-x-auto px-4">
              <div className="flex snap-x gap-5 pb-2">
                {testimonials.map((testimonial, index) => (
                  <article
                    key={testimonial.name}
                    className={`min-w-[280px] max-w-[320px] snap-start rounded-2xl border border-border bg-background p-7 ${
                      index === 1 ? 'sm:translate-y-3' : ''
                    }`}
                  >
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, starIndex) => (
                        <Star key={starIndex} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">"{testimonial.quote}"</p>
                    <div className="mt-6 border-t border-border pt-4">
                      <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="assets" className="scroll-mt-40 mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">{copy.moneyTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.moneySubtitle}</p>

            <div className="mt-7 rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{copy.heroTag3}</p>
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
              <Link to="/sdk" className="btn-secondary mt-5 px-4 py-2 text-sm">
                {extras.sdkCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {currencies.map((currency) => (
              <article key={currency.code} className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)_/_0.12),transparent_62%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-lg font-bold text-primary">
                      {currency.code}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">{currency.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{currency.desc}</p>
                    </div>
                  </div>
                  <span className="hidden shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-primary sm:inline-flex">
                    {copy.heroTag2}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="scroll-mt-40 mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
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


