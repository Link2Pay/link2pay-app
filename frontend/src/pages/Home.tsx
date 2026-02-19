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
    badge: 'Get paid globally with near-zero fees',
    heroTitleStart: 'The simplest way to',
    heroTitleHighlight: 'invoice and get paid',
    heroTitleEnd: 'anywhere in the world',
    heroDescription:
      'Create professional invoices, share a payment link, and receive money in seconds, not days. Built for freelancers, creators, and remote teams who work across borders.',
    heroPrimaryCta: "Start Invoicing - It's Free",
    heroSecondaryCta: 'See How It Works',
    heroFootnote: 'No credit card required. Start on testnet for free.',
    howTitle: 'Get paid in 3 simple steps',
    howSubtitle: 'No complicated setup. No bank paperwork. Just create, share, and get paid.',
    benefitsTitle: 'Why freelancers love Link2Pay',
    benefitsSubtitle: 'We handle the complexity so you can focus on what you do best: your work.',
    audienceTitle: 'Built for people who work globally',
    audienceSubtitle: "Whether you're a solo freelancer or a growing team, Link2Pay fits your workflow.",
    testimonialsTitle: 'Trusted by freelancers worldwide',
    testimonialsSubtitle: 'Hear from people who are already getting paid faster.',
    moneyTitle: 'Your money, your way',
    moneySubtitle: 'Choose how you want to get paid. Link2Pay supports multiple currencies on the Stellar network.',
    finalTitle: 'Ready to get paid without the wait?',
    finalDescription:
      'Join freelancers who already use Link2Pay to send invoices and receive payments in seconds. Start free today.',
    finalPrimaryCta: 'Create Your First Invoice',
    finalSecondaryCta: 'See Pricing Plans',
  },
  es: {
    badge: 'Recibe pagos globales con comisiones casi cero',
    heroTitleStart: 'La forma mas simple de',
    heroTitleHighlight: 'facturar y cobrar',
    heroTitleEnd: 'en cualquier parte del mundo',
    heroDescription:
      'Crea facturas profesionales, comparte un link de pago y recibe dinero en segundos, no dias. Hecho para freelancers, creadores y equipos remotos.',
    heroPrimaryCta: 'Empieza a facturar gratis',
    heroSecondaryCta: 'Ver como funciona',
    heroFootnote: 'Sin tarjeta de credito. Empieza gratis en testnet.',
    howTitle: 'Cobra en 3 pasos simples',
    howSubtitle: 'Sin configuraciones complejas. Sin papeleo bancario. Solo crea, comparte y cobra.',
    benefitsTitle: 'Por que freelancers aman Link2Pay',
    benefitsSubtitle: 'Nosotros manejamos la complejidad para que tu te enfoques en tu trabajo.',
    audienceTitle: 'Creado para quienes trabajan globalmente',
    audienceSubtitle: 'Si eres freelancer o equipo en crecimiento, Link2Pay se adapta a tu flujo.',
    testimonialsTitle: 'Confiado por freelancers del mundo',
    testimonialsSubtitle: 'Escucha a personas que ya cobran mas rapido.',
    moneyTitle: 'Tu dinero, a tu manera',
    moneySubtitle: 'Elige como quieres cobrar. Link2Pay soporta multiples monedas en Stellar.',
    finalTitle: 'Listo para cobrar sin esperar?',
    finalDescription:
      'Unete a freelancers que ya usan Link2Pay para enviar facturas y cobrar en segundos. Empieza gratis hoy.',
    finalPrimaryCta: 'Crea tu primera factura',
    finalSecondaryCta: 'Ver planes',
  },
  pt: {
    badge: 'Receba pagamentos globais com taxas quase zero',
    heroTitleStart: 'A forma mais simples de',
    heroTitleHighlight: 'faturar e receber',
    heroTitleEnd: 'em qualquer lugar do mundo',
    heroDescription:
      'Crie faturas profissionais, compartilhe um link de pagamento e receba em segundos, nao dias. Feito para freelancers, criadores e equipes remotas.',
    heroPrimaryCta: 'Comece a faturar gratis',
    heroSecondaryCta: 'Ver como funciona',
    heroFootnote: 'Sem cartao de credito. Comece gratis na testnet.',
    howTitle: 'Receba em 3 passos simples',
    howSubtitle: 'Sem configuracao complicada. Sem papelada bancaria. Apenas crie, compartilhe e receba.',
    benefitsTitle: 'Por que freelancers amam o Link2Pay',
    benefitsSubtitle: 'Nos cuidamos da complexidade para voce focar no seu trabalho.',
    audienceTitle: 'Feito para quem trabalha globalmente',
    audienceSubtitle: 'Seja freelancer solo ou equipe em crescimento, Link2Pay se adapta ao seu fluxo.',
    testimonialsTitle: 'Confiado por freelancers no mundo todo',
    testimonialsSubtitle: 'Veja pessoas que ja recebem pagamentos mais rapido.',
    moneyTitle: 'Seu dinheiro, do seu jeito',
    moneySubtitle: 'Escolha como quer receber. Link2Pay suporta varias moedas na rede Stellar.',
    finalTitle: 'Pronto para receber sem esperar?',
    finalDescription:
      'Junte-se a freelancers que ja usam Link2Pay para enviar faturas e receber em segundos. Comece gratis hoje.',
    finalPrimaryCta: 'Crie sua primeira fatura',
    finalSecondaryCta: 'Ver planos',
  },
};

const FLOW_STEPS: Record<Language, Array<Item & { step: string }>> = {
  en: [
    {
      step: '01',
      title: 'Connect your wallet',
      description: 'Link your Stellar wallet in one click. Your keys stay with you, always.',
    },
    {
      step: '02',
      title: 'Create a beautiful invoice',
      description: 'Add line items, set amounts, and choose currency. Done in under a minute.',
    },
    {
      step: '03',
      title: 'Share a payment link',
      description: 'Send a simple link to your client. They click, pay, and you get notified instantly.',
    },
  ],
  es: [
    {
      step: '01',
      title: 'Conecta tu wallet',
      description: 'Conecta tu wallet Stellar en un clic. Tus llaves siempre quedan contigo.',
    },
    {
      step: '02',
      title: 'Crea una factura profesional',
      description: 'Agrega lineas, define montos y elige moneda. Listo en menos de un minuto.',
    },
    {
      step: '03',
      title: 'Comparte un link de pago',
      description: 'Envia un link simple a tu cliente. Hace clic, paga y recibes confirmacion al instante.',
    },
  ],
  pt: [
    {
      step: '01',
      title: 'Conecte sua wallet',
      description: 'Conecte sua wallet Stellar com um clique. Suas chaves ficam sempre com voce.',
    },
    {
      step: '02',
      title: 'Crie uma fatura profissional',
      description: 'Adicione itens, defina valores e escolha moeda. Pronto em menos de um minuto.',
    },
    {
      step: '03',
      title: 'Compartilhe um link de pagamento',
      description: 'Envie um link simples ao cliente. Ele clica, paga e voce recebe confirmacao na hora.',
    },
  ],
};

const BENEFITS: Record<Language, Item[]> = {
  en: [
    {
      title: 'Paid in 5 seconds',
      description: 'Stellar settles payments in seconds, not days. No more chasing wire transfers.',
    },
    {
      title: 'Fees under $0.01',
      description: 'Whether you send $50 or $50,000, network fees are practically zero.',
    },
    {
      title: 'Works worldwide',
      description: 'Accept payments from clients in any country. No bank restrictions, no borders.',
    },
    {
      title: 'You own your money',
      description: 'Funds go directly to your wallet. We never hold or touch your money.',
    },
  ],
  es: [
    {
      title: 'Pago en 5 segundos',
      description: 'Stellar liquida pagos en segundos, no en dias. No mas esperas bancarias.',
    },
    {
      title: 'Comisiones menores a $0.01',
      description: 'Ya sea $50 o $50,000, la comision de red es casi cero.',
    },
    {
      title: 'Funciona en todo el mundo',
      description: 'Acepta pagos de clientes en cualquier pais. Sin fronteras ni restricciones bancarias.',
    },
    {
      title: 'Tu dinero es tuyo',
      description: 'Los fondos van directo a tu wallet. Nunca retenemos ni tocamos tu dinero.',
    },
  ],
  pt: [
    {
      title: 'Receba em 5 segundos',
      description: 'A Stellar liquida pagamentos em segundos, nao dias. Sem esperar transferencia.',
    },
    {
      title: 'Taxas abaixo de $0.01',
      description: 'Seja $50 ou $50.000, a taxa de rede e praticamente zero.',
    },
    {
      title: 'Funciona no mundo todo',
      description: 'Receba pagamentos de clientes em qualquer pais. Sem fronteiras e sem restricoes bancarias.',
    },
    {
      title: 'Seu dinheiro e seu',
      description: 'Os fundos vao direto para sua wallet. Nunca seguramos nem tocamos seu dinheiro.',
    },
  ],
};

const AUDIENCES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Freelancers and Creators',
      description: 'Stop waiting weeks for international payments. Invoice clients and get paid the same day.',
    },
    {
      title: 'Small Businesses and Agencies',
      description: 'Track invoice status and keep your cash flow moving with a clean dashboard.',
    },
    {
      title: 'Remote Teams in LATAM and Beyond',
      description: 'Avoid high fees and slow transfers. Collect global payments with near-zero cost.',
    },
  ],
  es: [
    {
      title: 'Freelancers y creadores',
      description: 'Deja de esperar semanas por pagos internacionales. Factura y cobra el mismo dia.',
    },
    {
      title: 'Pymes y agencias',
      description: 'Sigue el estado de facturas y manten tu flujo de caja con un panel claro.',
    },
    {
      title: 'Equipos remotos en LATAM y mas',
      description: 'Evita comisiones altas y transferencias lentas. Cobra globalmente con costo minimo.',
    },
  ],
  pt: [
    {
      title: 'Freelancers e criadores',
      description: 'Pare de esperar semanas por pagamentos internacionais. Fature e receba no mesmo dia.',
    },
    {
      title: 'Pequenas empresas e agencias',
      description: 'Acompanhe status de faturas e mantenha o fluxo de caixa com um painel simples.',
    },
    {
      title: 'Times remotos na LATAM e alem',
      description: 'Evite taxas altas e transferencias lentas. Receba globalmente com custo minimo.',
    },
  ],
};

const STATS: Record<Language, StatItem[]> = {
  en: [
    { value: '5s', label: 'Average payment time' },
    { value: '<$0.01', label: 'Transaction fee' },
    { value: '3', label: 'Supported currencies' },
    { value: '150+', label: 'Countries supported' },
  ],
  es: [
    { value: '5s', label: 'Tiempo promedio de pago' },
    { value: '<$0.01', label: 'Comision por transaccion' },
    { value: '3', label: 'Monedas soportadas' },
    { value: '150+', label: 'Paises soportados' },
  ],
  pt: [
    { value: '5s', label: 'Tempo medio de pagamento' },
    { value: '<$0.01', label: 'Taxa por transacao' },
    { value: '3', label: 'Moedas suportadas' },
    { value: '150+', label: 'Paises suportados' },
  ],
};

const TESTIMONIALS: Record<Language, Testimonial[]> = {
  en: [
    {
      quote: 'I used to wait 5-7 days for wire transfers. Now clients pay me in seconds. Game changer.',
      name: 'Maria G.',
      role: 'UX Designer, Colombia',
    },
    {
      quote: 'Payment links are so simple. I paste them in email and clients know exactly what to do.',
      name: 'James K.',
      role: 'Web Developer, Nigeria',
    },
    {
      quote: 'Finally, an invoicing tool built for global work. Fees are almost nothing.',
      name: 'Sofia R.',
      role: 'Marketing Consultant, Argentina',
    },
  ],
  es: [
    {
      quote: 'Antes esperaba 5-7 dias por transferencias. Ahora mis clientes pagan en segundos.',
      name: 'Maria G.',
      role: 'Disenadora UX, Colombia',
    },
    {
      quote: 'Los links de pago son muy simples. Los pego en el email y el cliente entiende todo.',
      name: 'James K.',
      role: 'Desarrollador web, Nigeria',
    },
    {
      quote: 'Por fin una herramienta de facturacion para trabajo global. Las comisiones son minimas.',
      name: 'Sofia R.',
      role: 'Consultora de marketing, Argentina',
    },
  ],
  pt: [
    {
      quote: 'Eu esperava 5-7 dias por transferencias. Agora clientes pagam em segundos.',
      name: 'Maria G.',
      role: 'Designer UX, Colombia',
    },
    {
      quote: 'Os links de pagamento sao simples. Eu colo no email e o cliente entende na hora.',
      name: 'James K.',
      role: 'Desenvolvedor web, Nigeria',
    },
    {
      quote: 'Enfim uma ferramenta de faturamento para trabalho global. Taxas quase zero.',
      name: 'Sofia R.',
      role: 'Consultora de marketing, Argentina',
    },
  ],
};

const CURRENCIES: Record<Language, CurrencyCard[]> = {
  en: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'The native currency of Stellar. Ultra-fast and ultra-cheap.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Dollar-pegged stablecoin. Great for clients who prefer USD.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Euro-pegged stablecoin. Perfect for European clients and contracts.',
    },
  ],
  es: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Moneda nativa de Stellar. Ultra rapida y ultra economica.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Stablecoin atada al dolar. Ideal para clientes que prefieren USD.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin atada al euro. Ideal para clientes y contratos europeos.',
    },
  ],
  pt: [
    {
      code: 'XLM',
      name: 'Stellar Lumens',
      desc: 'Moeda nativa da Stellar. Ultra rapida e ultra barata.',
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      desc: 'Stablecoin pareada ao dolar. Otima para clientes que preferem USD.',
    },
    {
      code: 'EURC',
      name: 'Euro Coin',
      desc: 'Stablecoin pareada ao euro. Perfeita para clientes e contratos europeus.',
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
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6">
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
