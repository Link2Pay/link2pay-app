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
import OrbitProgressHero from '../components/marketing/OrbitProgressHero';

const FLOW_STEP_ICONS = [Wallet, FileText, Send] as const;
const BENEFIT_ICONS = [Zap, DollarSign, Globe2, ShieldCheck] as const;
const AUDIENCE_ICONS = [Users, TrendingUp, Globe2] as const;

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
};

const COPY: Record<Language, HomeCopy> = {
  en: {
    badge: 'Next-gen payment infrastructure on Stellar',
    heroTitleStart: 'The developer API for',
    heroTitleHighlight: 'instant payment links',
    heroTitleEnd: 'on the Stellar network',
    heroDescription:
      'Ship hosted checkout, generate shareable payment links, and confirm on-chain settlements in seconds \u2014 without touching Stellar plumbing. One API call, zero custody risk.',
    heroPrimaryCta: 'Launch Your First Link',
    heroSecondaryCta: 'View Documentation',
    heroFootnote: 'Free tier available. No credit card required. Deploy to testnet instantly.',
    howTitle: 'From zero to checkout in 3 steps',
    howSubtitle: 'Connect, create, collect. The entire payment lifecycle handled for you.',
    benefitsTitle: 'Infrastructure-grade reliability',
    benefitsSubtitle: 'Enterprise-level payment orchestration without the enterprise complexity.',
    audienceTitle: 'Built for every scale',
    audienceSubtitle: 'Whether you\'re prototyping an MVP or processing thousands of transactions, Link2Pay adapts.',
    testimonialsTitle: 'Trusted by builders worldwide',
    testimonialsSubtitle: 'Teams across 30+ countries ship checkout faster with Link2Pay.',
    moneyTitle: 'Multi-asset settlement',
    moneySubtitle: 'Accept XLM, USDC, and EURC through one unified checkout. Instant finality, near-zero fees.',
    finalTitle: 'Start accepting payments in minutes',
    finalDescription:
      'Deploy hosted Stellar checkout with our free SDK. Scale seamlessly to production with webhooks, branding, and team controls.',
    finalPrimaryCta: 'Create Your First Link',
    finalSecondaryCta: 'Compare Plans',
  },
  es: {
    badge: 'Infraestructura de pagos de nueva generacion en Stellar',
    heroTitleStart: 'La API para',
    heroTitleHighlight: 'links de pago instantaneos',
    heroTitleEnd: 'en la red Stellar',
    heroDescription:
      'Lanza checkout hospedado, genera links de pago compartibles y confirma liquidaciones on-chain en segundos \u2014 sin tocar la infraestructura Stellar. Una llamada API, cero riesgo de custodia.',
    heroPrimaryCta: 'Lanza tu primer link',
    heroSecondaryCta: 'Ver documentacion',
    heroFootnote: 'Plan gratuito disponible. Sin tarjeta requerida. Despliega en testnet al instante.',
    howTitle: 'De cero a checkout en 3 pasos',
    howSubtitle: 'Conecta, crea, cobra. Todo el ciclo de vida del pago resuelto por ti.',
    benefitsTitle: 'Fiabilidad de nivel infraestructura',
    benefitsSubtitle: 'Orquestacion de pagos empresarial sin la complejidad empresarial.',
    audienceTitle: 'Construido para cualquier escala',
    audienceSubtitle: 'Ya sea un MVP o miles de transacciones, Link2Pay se adapta.',
    testimonialsTitle: 'Confiado por builders en todo el mundo',
    testimonialsSubtitle: 'Equipos en mas de 30 paises lanzan checkout mas rapido con Link2Pay.',
    moneyTitle: 'Liquidacion multi-activo',
    moneySubtitle: 'Acepta XLM, USDC y EURC en un checkout unificado. Finalidad instantanea, comisiones minimas.',
    finalTitle: 'Empieza a aceptar pagos en minutos',
    finalDescription:
      'Despliega checkout Stellar hospedado con nuestro SDK gratuito. Escala a produccion con webhooks, branding y controles de equipo.',
    finalPrimaryCta: 'Crea tu primer link',
    finalSecondaryCta: 'Comparar planes',
  },
  pt: {
    badge: 'Infraestrutura de pagamentos de nova geracao em Stellar',
    heroTitleStart: 'A API para',
    heroTitleHighlight: 'links de pagamento instantaneos',
    heroTitleEnd: 'na rede Stellar',
    heroDescription:
      'Lance checkout hospedado, gere links de pagamento compartilhaveis e confirme liquidacoes on-chain em segundos \u2014 sem tocar na infraestrutura Stellar. Uma chamada API, zero risco de custodia.',
    heroPrimaryCta: 'Lance seu primeiro link',
    heroSecondaryCta: 'Ver documentacao',
    heroFootnote: 'Plano gratuito disponivel. Sem cartao necessario. Deploy na testnet instantaneo.',
    howTitle: 'De zero a checkout em 3 passos',
    howSubtitle: 'Conecte, crie, receba. Todo o ciclo de vida do pagamento resolvido para voce.',
    benefitsTitle: 'Confiabilidade de nivel infraestrutura',
    benefitsSubtitle: 'Orquestracao de pagamentos empresarial sem a complexidade empresarial.',
    audienceTitle: 'Construido para qualquer escala',
    audienceSubtitle: 'Seja um MVP ou milhares de transacoes, Link2Pay se adapta.',
    testimonialsTitle: 'Confiado por builders no mundo todo',
    testimonialsSubtitle: 'Times em mais de 30 paises lancam checkout mais rapido com Link2Pay.',
    moneyTitle: 'Liquidacao multi-ativo',
    moneySubtitle: 'Aceite XLM, USDC e EURC em um checkout unificado. Finalidade instantanea, taxas minimas.',
    finalTitle: 'Comece a aceitar pagamentos em minutos',
    finalDescription:
      'Implante checkout Stellar hospedado com nosso SDK gratuito. Escale para producao com webhooks, branding e controles de time.',
    finalPrimaryCta: 'Crie seu primeiro link',
    finalSecondaryCta: 'Comparar planos',
  },
};

const FLOW_STEPS: Record<Language, Array<Item & { step: string }>> = {
  en: [
    {
      step: '01',
      title: 'Authenticate with your wallet',
      description: 'Sign in with Freighter. Non-custodial by design \u2014 your private keys never leave your device.',
    },
    {
      step: '02',
      title: 'Generate a payment link',
      description: 'Define the amount, choose the asset (XLM, USDC, EURC), set expiration, and attach metadata via API.',
    },
    {
      step: '03',
      title: 'Share and get paid',
      description: 'Send the checkout URL to your payer. Funds settle on-chain in ~5 seconds with real-time status updates.',
    },
  ],
  es: [
    {
      step: '01',
      title: 'Autentica con tu wallet',
      description: 'Inicia sesion con Freighter. No custodial por diseno \u2014 tus claves privadas nunca salen de tu dispositivo.',
    },
    {
      step: '02',
      title: 'Genera un link de pago',
      description: 'Define el monto, elige el activo (XLM, USDC, EURC), configura expiracion y adjunta metadata via API.',
    },
    {
      step: '03',
      title: 'Comparte y cobra',
      description: 'Envia la URL de checkout a tu pagador. Los fondos se liquidan on-chain en ~5 segundos con actualizaciones en tiempo real.',
    },
  ],
  pt: [
    {
      step: '01',
      title: 'Autentique com sua wallet',
      description: 'Entre com Freighter. Non-custodial por design \u2014 suas chaves privadas nunca saem do seu dispositivo.',
    },
    {
      step: '02',
      title: 'Gere um link de pagamento',
      description: 'Defina o valor, escolha o ativo (XLM, USDC, EURC), configure expiracao e anexe metadata via API.',
    },
    {
      step: '03',
      title: 'Compartilhe e receba',
      description: 'Envie a URL de checkout ao pagador. Fundos liquidam on-chain em ~5 segundos com atualizacoes em tempo real.',
    },
  ],
};

const BENEFITS: Record<Language, Item[]> = {
  en: [
    {
      title: 'Instant settlement',
      description: 'Stellar finalizes transactions in 3\u20135 seconds. No T+2, no clearing houses, no delays.',
    },
    {
      title: 'Near-zero network fees',
      description: 'Send $50 or $500,000 \u2014 Stellar network costs stay under a fraction of a cent per transaction.',
    },
    {
      title: 'Borderless by default',
      description: 'Accept payments from 150+ countries. No banking restrictions, no currency conversion friction.',
    },
    {
      title: 'Non-custodial architecture',
      description: 'Funds flow directly to your wallet on-chain. Link2Pay never holds, routes, or touches your capital.',
    },
  ],
  es: [
    {
      title: 'Liquidacion instantanea',
      description: 'Stellar finaliza transacciones en 3\u20135 segundos. Sin T+2, sin camaras de compensacion.',
    },
    {
      title: 'Comisiones de red casi nulas',
      description: 'Envia $50 o $500,000 \u2014 el costo de red Stellar se mantiene bajo fracciones de centavo.',
    },
    {
      title: 'Sin fronteras por defecto',
      description: 'Acepta pagos desde 150+ paises. Sin restricciones bancarias ni friccion cambiaria.',
    },
    {
      title: 'Arquitectura no custodial',
      description: 'Los fondos fluyen directo a tu wallet on-chain. Link2Pay nunca retiene ni toca tu capital.',
    },
  ],
  pt: [
    {
      title: 'Liquidacao instantanea',
      description: 'Stellar finaliza transacoes em 3\u20135 segundos. Sem T+2, sem camaras de compensacao.',
    },
    {
      title: 'Taxas de rede quase zero',
      description: 'Envie $50 ou $500.000 \u2014 o custo de rede Stellar fica abaixo de fracoes de centavo.',
    },
    {
      title: 'Sem fronteiras por padrao',
      description: 'Aceite pagamentos de 150+ paises. Sem restricoes bancarias nem fricao cambial.',
    },
    {
      title: 'Arquitetura non-custodial',
      description: 'Fundos fluem direto para sua wallet on-chain. Link2Pay nunca retém nem toca seu capital.',
    },
  ],
};

const AUDIENCES: Record<Language, Item[]> = {
  en: [
    {
      title: 'SaaS & Product Teams',
      description: 'Embed payment links into your product in minutes. No payment infrastructure to build or maintain.',
    },
    {
      title: 'Marketplaces & Platforms',
      description: 'Generate unique payment intents per transaction with full lifecycle tracking and webhook callbacks.',
    },
    {
      title: 'Global-first Startups',
      description: 'Accept instant cross-border payments in stablecoins and XLM. No banking rails, no delays, no limits.',
    },
  ],
  es: [
    {
      title: 'SaaS y equipos de producto',
      description: 'Integra links de pago en tu producto en minutos. Sin infraestructura de pagos que construir o mantener.',
    },
    {
      title: 'Marketplaces y plataformas',
      description: 'Genera intents de pago unicos por transaccion con tracking de ciclo de vida completo y callbacks por webhook.',
    },
    {
      title: 'Startups global-first',
      description: 'Acepta pagos transfronterizos instantaneos en stablecoins y XLM. Sin rails bancarios, sin demoras.',
    },
  ],
  pt: [
    {
      title: 'SaaS e times de produto',
      description: 'Integre links de pagamento no seu produto em minutos. Sem infraestrutura de pagamentos para construir.',
    },
    {
      title: 'Marketplaces e plataformas',
      description: 'Gere intents de pagamento unicos por transacao com tracking completo de ciclo de vida e callbacks webhook.',
    },
    {
      title: 'Startups global-first',
      description: 'Aceite pagamentos transfronteiricos instantaneos em stablecoins e XLM. Sem rails bancarios, sem demoras.',
    },
  ],
};

const STATS: Record<Language, StatItem[]> = {
  en: [
    { value: '~5s', label: 'Average settlement time' },
    { value: '<$0.01', label: 'Per-transaction network cost' },
    { value: '3', label: 'Supported Stellar assets' },
    { value: '150+', label: 'Countries with access' },
  ],
  es: [
    { value: '~5s', label: 'Tiempo promedio de liquidacion' },
    { value: '<$0.01', label: 'Costo de red por transaccion' },
    { value: '3', label: 'Activos Stellar soportados' },
    { value: '150+', label: 'Paises con acceso' },
  ],
  pt: [
    { value: '~5s', label: 'Tempo medio de liquidacao' },
    { value: '<$0.01', label: 'Custo de rede por transacao' },
    { value: '3', label: 'Ativos Stellar suportados' },
    { value: '150+', label: 'Paises com acesso' },
  ],
};

const TESTIMONIALS: Record<Language, Testimonial[]> = {
  en: [
    {
      quote: 'We replaced our entire payment backend with Link2Pay in one afternoon. Settlement went from days to seconds.',
      name: 'Maria G.',
      role: 'CTO, Fintech Startup \u2014 Colombia',
    },
    {
      quote: 'The API is beautifully simple. One POST to create a link, one webhook to confirm. That\'s the whole integration.',
      name: 'James K.',
      role: 'Lead Engineer \u2014 Nigeria',
    },
    {
      quote: 'Our clients across Europe pay us in EURC now. No SWIFT fees, no 3-day waits, no chargebacks.',
      name: 'Sofia R.',
      role: 'Founder, Digital Agency \u2014 Argentina',
    },
  ],
  es: [
    {
      quote: 'Reemplazamos todo nuestro backend de pagos con Link2Pay en una tarde. La liquidacion paso de dias a segundos.',
      name: 'Maria G.',
      role: 'CTO, Startup Fintech \u2014 Colombia',
    },
    {
      quote: 'La API es elegantemente simple. Un POST para crear un link, un webhook para confirmar. Esa es toda la integracion.',
      name: 'James K.',
      role: 'Lead Engineer \u2014 Nigeria',
    },
    {
      quote: 'Nuestros clientes en Europa nos pagan en EURC. Sin comisiones SWIFT, sin 3 dias de espera, sin contracargos.',
      name: 'Sofia R.',
      role: 'Fundadora, Agencia Digital \u2014 Argentina',
    },
  ],
  pt: [
    {
      quote: 'Substituimos todo nosso backend de pagamentos pelo Link2Pay em uma tarde. Liquidacao passou de dias para segundos.',
      name: 'Maria G.',
      role: 'CTO, Startup Fintech \u2014 Colombia',
    },
    {
      quote: 'A API e elegantemente simples. Um POST para criar um link, um webhook para confirmar. Essa e toda a integracao.',
      name: 'James K.',
      role: 'Lead Engineer \u2014 Nigeria',
    },
    {
      quote: 'Nossos clientes na Europa nos pagam em EURC. Sem taxas SWIFT, sem 3 dias de espera, sem chargebacks.',
      name: 'Sofia R.',
      role: 'Fundadora, Agencia Digital \u2014 Argentina',
    },
  ],
};

const CURRENCIES: Record<Language, CurrencyCard[]> = {
  en: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Native network asset with the fastest settlement and lowest fees on the Stellar network.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Dollar-pegged stablecoin issued by Circle. Ideal for USD-denominated invoicing and commerce.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Euro-pegged stablecoin by Circle. Optimized for European markets and cross-border EUR settlements.',
    },
  ],
  es: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Activo nativo de la red con la liquidacion mas rapida y las comisiones mas bajas en Stellar.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Stablecoin vinculada al dolar emitida por Circle. Ideal para facturacion y comercio en USD.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin vinculada al euro por Circle. Optimizada para mercados europeos y liquidaciones en EUR.',
    },
  ],
  pt: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Ativo nativo da rede com a liquidacao mais rapida e as menores taxas na Stellar.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Stablecoin pareada ao dolar emitida pela Circle. Ideal para faturamento e comercio em USD.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin pareada ao euro pela Circle. Otimizada para mercados europeus e liquidacoes em EUR.',
    },
  ],
};

export default function Home() {
  const { language } = useI18n();

  const copy = COPY[language];
  const flowSteps = FLOW_STEPS[language];
  const benefits = BENEFITS[language];
  const audiences = AUDIENCES[language];
  const stats = STATS[language];
  const testimonials = TESTIMONIALS[language];
  const currencies = CURRENCIES[language];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.12),transparent_68%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom,_hsl(175_75%_45%_/_0.06),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.badge}
            </span>
            <h1
              className="mt-8 text-4xl font-semibold tracking-tight text-foreground md:text-6xl animate-slide-up"
              style={{ animationDelay: '0.08s' }}
            >
              {copy.heroTitleStart}{' '}
              <span className="text-gradient">{copy.heroTitleHighlight}</span>{' '}
              {copy.heroTitleEnd}
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg animate-slide-up"
              style={{ animationDelay: '0.16s' }}
            >
              {copy.heroDescription}
            </p>
            <div
              className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up"
              style={{ animationDelay: '0.24s' }}
            >
              <Link to="/get-started" className="btn-primary px-6 py-3.5 text-sm">
                {copy.heroPrimaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="btn-secondary px-6 py-3.5 text-sm">
                {copy.heroSecondaryCta}
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '0.32s' }}>
              {copy.heroFootnote}
            </p>
          </div>

          <div className="mx-auto mt-16 w-full max-w-4xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <OrbitProgressHero />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
                <div className="text-2xl font-semibold text-primary md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.howTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.howSubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {flowSteps.map((step, index) => {
            const Icon = FLOW_STEP_ICONS[index];
            return (
              <div key={step.title} className="card hover-glow relative p-8 animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.1}s` }}>
                <span className="absolute right-6 top-6 text-4xl font-bold text-primary/10">{step.step}</span>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.benefitsTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.benefitsSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index];
              return (
                <article
                  key={benefit.title}
                  className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg animate-fade-in"
                  style={{ animationDelay: `${0.04 + index * 0.08}s` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.audienceTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.audienceSubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {audiences.map((audience, index) => {
            const Icon = AUDIENCE_ICONS[index];
            return (
              <article key={audience.title} className="card hover-glow p-8 animate-fade-in" style={{ animationDelay: `${0.04 + index * 0.09}s` }}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{audience.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{audience.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.testimonialsTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.testimonialsSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <article key={testimonial.name} className="rounded-xl border border-border bg-background p-8 animate-fade-in" style={{ animationDelay: `${0.04 + index * 0.09}s` }}>
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
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.moneyTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.moneySubtitle}</p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {currencies.map((currency, index) => (
            <div key={currency.code} className="card p-6 text-center animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.08}s` }}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {currency.code}
              </div>
              <h3 className="text-base font-semibold text-foreground">{currency.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{currency.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-3xl font-semibold text-primary-foreground">{copy.finalTitle}</h3>
              <p className="mt-4 text-base text-primary-foreground/80">{copy.finalDescription}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link to="/get-started" className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3">
                  {copy.finalPrimaryCta}
                  <Rocket className="h-4 w-4" />
                </Link>
                <Link to="/pricing" className="btn border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 px-6 py-3">
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
