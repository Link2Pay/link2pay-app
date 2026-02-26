import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  Link2,
  Receipt,
  RefreshCw,
  Shield,
  Smartphone,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const CORE_FEATURE_ICONS = [Link2, Wallet, Zap, Globe2, Shield, RefreshCw] as const;
const INVOICE_FEATURE_ICONS = [FileText, Users, Receipt, BarChart3] as const;
const UPCOMING_FEATURE_ICONS = [Bell, CreditCard, Smartphone] as const;

type Item = { title: string; description: string };
type ComparisonRow = { feature: string; stellarPay: string; traditional: string };

type FeaturesCopy = {
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroDescription: string;
  sdkSectionTitle: string;
  sdkSectionSubtitle: string;
  sdkSectionPrimaryCta: string;
  sdkSectionSecondaryCta: string;
  coreTitle: string;
  coreSubtitle: string;
  managementTitle: string;
  managementSubtitle: string;
  comparisonTitle: string;
  comparisonSubtitle: string;
  colFeature: string;
  colTraditional: string;
  comingSoon: string;
  comingTitle: string;
  comingSubtitle: string;
  finalTitle: string;
  finalDescription: string;
  finalCta: string;
};

const COPY: Record<Language, FeaturesCopy> = {
  en: {
    heroTitleStart: 'Everything you need to',
    heroTitleHighlight: 'launch and scale payment links',
    heroDescription:
      'Link2Pay combines API + hosted checkout on Stellar so your team can move from idea to first payment in minutes.',
    sdkSectionTitle: 'Dedicated SDK section',
    sdkSectionSubtitle:
      'Explore implementation guidance, API patterns, and interactive payload previews in a dedicated SDK page.',
    sdkSectionPrimaryCta: 'Open SDK Section',
    sdkSectionSecondaryCta: 'Create Live Link',
    coreTitle: 'Core capabilities',
    coreSubtitle: 'The building blocks to create, share, and track every payment link.',
    managementTitle: 'Operations and reliability',
    managementSubtitle: 'Production tooling for webhooks, controls, branding, and auditability.',
    comparisonTitle: 'Why teams replace legacy rails',
    comparisonSubtitle: 'Lower setup time, faster settlement, and clearer payment states.',
    colFeature: 'What matters',
    colTraditional: 'Traditional setup',
    comingSoon: 'Coming soon',
    comingTitle: 'Next releases',
    comingSubtitle: 'Roadmap features focused on deeper automation and better visibility.',
    finalTitle: 'Ship your first integration today',
    finalDescription: 'Create an API key, send one POST request, and confirm settlement in seconds.',
    finalCta: 'Get API Key',
  },
  es: {
    heroTitleStart: 'Todo lo que necesitas para',
    heroTitleHighlight: 'lanzar y escalar links de pago',
    heroDescription:
      'Link2Pay combina API y checkout hospedado sobre Stellar para que tu equipo pase de idea a primer cobro en minutos.',
    sdkSectionTitle: 'Sección SDK dedicada',
    sdkSectionSubtitle:
      'Explora guía de implementación, patrones API y vistas interactivas de payload en una página SDK dedicada.',
    sdkSectionPrimaryCta: 'Abrir sección SDK',
    sdkSectionSecondaryCta: 'Crear link en vivo',
    coreTitle: 'Capacidades principales',
    coreSubtitle: 'Bloques para crear, compartir y monitorear cada link de pago.',
    managementTitle: 'Operación y fiabilidad',
    managementSubtitle: 'Herramientas productivas para webhooks, controles, branding y auditoría.',
    comparisonTitle: 'Por qué los equipos reemplazan rails legacy',
    comparisonSubtitle: 'Menor tiempo de implementación, liquidación más rápida y estados claros.',
    colFeature: 'Lo importante',
    colTraditional: 'Configuración tradicional',
    comingSoon: 'Próximamente',
    comingTitle: 'Siguientes lanzamientos',
    comingSubtitle: 'Roadmap enfocado en automatización y mejor visibilidad.',
    finalTitle: 'Lanza tu primera integración hoy',
    finalDescription: 'Crea una API key, envía un POST request y confirma la liquidación en segundos.',
    finalCta: 'Obtener API Key',
  },
  pt: {
    heroTitleStart: 'Tudo o que você precisa para',
    heroTitleHighlight: 'lançar e escalar links de pagamento',
    heroDescription:
      'Link2Pay combina API e checkout hospedado na Stellar para seu time ir da ideia ao primeiro recebimento em minutos.',
    sdkSectionTitle: 'Seção SDK dedicada',
    sdkSectionSubtitle:
      'Explore guia de implementação, padrões de API e prévias interativas de payload em uma página SDK dedicada.',
    sdkSectionPrimaryCta: 'Abrir seção SDK',
    sdkSectionSecondaryCta: 'Criar link ao vivo',
    coreTitle: 'Capacidades principais',
    coreSubtitle: 'Blocos para criar, compartilhar e acompanhar cada link de pagamento.',
    managementTitle: 'Operação e confiabilidade',
    managementSubtitle: 'Ferramentas de produção para webhooks, controles, branding e auditoria.',
    comparisonTitle: 'Por que os times trocam rails legacy',
    comparisonSubtitle: 'Menos tempo de implementação, liquidação mais rápida e estados claros.',
    colFeature: 'O que importa',
    colTraditional: 'Configuração tradicional',
    comingSoon: 'Em breve',
    comingTitle: 'Próximos lançamentos',
    comingSubtitle: 'Roadmap focado em mais automação e melhor visibilidade.',
    finalTitle: 'Lance sua primeira integração hoje',
    finalDescription: 'Crie uma API key, envie um POST request e confirme a liquidação em segundos.',
    finalCta: 'Obter API Key',
  },
};

const CORE_FEATURES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Payment Link API',
      description: 'Create signed and expirable payment links with amount, asset, memo, and metadata in one request.',
    },
    {
      title: 'Hosted Checkout',
      description: 'Send payers to a ready-to-use checkout page that works on desktop and mobile.',
    },
    {
      title: 'Clear Payment States',
      description: 'Track each link through CREATED, PENDING, CONFIRMED, or EXPIRED with deterministic status transitions.',
    },
    {
      title: 'Fast Stellar Settlement',
      description: 'Accept XLM, USDC, and EURC with finality in about 5 seconds and near-zero network costs.',
    },
    {
      title: 'Non-custodial by default',
      description: 'Funds go directly to merchant wallets. Link2Pay does not custody user balances.',
    },
    {
      title: 'Wallet-based authentication',
      description: 'Use Stellar wallet signatures for identity and access, without password-based auth flows.',
    },
  ],
  es: [
    {
      title: 'API de links de pago',
      description: 'Crea links firmados con monto, activo, memo y metadata en una sola llamada.',
    },
    {
      title: 'Checkout hospedado',
      description: 'Envía pagadores a una página de checkout lista para desktop y mobile.',
    },
    {
      title: 'Estados de pago claros',
      description: 'Sigue cada link por CREATED, PENDING, CONFIRMED o EXPIRED con transiciones deterministas.',
    },
    {
      title: 'Liquidación rápida en Stellar',
      description: 'Acepta XLM, USDC y EURC con finalidad en unos 5 segundos y costos de red mínimos.',
    },
    {
      title: 'Non-custodial por defecto',
      description: 'Los fondos van directo a la wallet del comercio. Link2Pay no custodia balances.',
    },
    {
      title: 'Autenticación con wallet',
      description: 'Usa firmas de wallet Stellar para identidad y acceso, sin flujos de password.',
    },
  ],
  pt: [
    {
      title: 'API de links de pagamento',
      description: 'Crie links assinados com valor, ativo, memo e metadata em uma única chamada.',
    },
    {
      title: 'Checkout hospedado',
      description: 'Envie pagadores para uma pagina de checkout pronta para desktop e mobile.',
    },
    {
      title: 'Estados de pagamento claros',
      description: 'Acompanhe cada link em CREATED, PENDING, CONFIRMED ou EXPIRED com transicoes deterministicas.',
    },
    {
      title: 'Liquidação rápida na Stellar',
      description: 'Aceite XLM, USDC e EURC com finalidade em cerca de 5 segundos e custo de rede mínimo.',
    },
    {
      title: 'Non-custodial por padrão',
      description: 'Os fundos vão direto para a wallet do comércio. Link2Pay não faz custódia.',
    },
    {
      title: 'Autenticação com wallet',
      description: 'Use assinaturas da wallet Stellar para identidade e acesso, sem fluxo de senha.',
    },
  ],
};

const INVOICE_FEATURES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Signed Webhooks',
      description: 'Receive trusted callbacks for each status change with retry policies and delivery visibility.',
    },
    {
      title: 'Plan and quota controls',
      description: 'Manage active link limits, expiration windows, and retention by plan tier.',
    },
    {
      title: 'Branded checkout',
      description: 'Apply your logo and color palette to create a familiar payer experience.',
    },
    {
      title: 'Audit-ready records',
      description: 'Keep a full trail of API requests, status transitions, and settlement events.',
    },
  ],
  es: [
    {
      title: 'Webhooks firmados',
      description: 'Recibe callbacks confiables por cada cambio de estado con reintentos y visibilidad de entrega.',
    },
    {
      title: 'Controles de plan y cuota',
      description: 'Gestiona límites de links activos, ventanas de expiración y retención por tier.',
    },
    {
      title: 'Checkout con tu marca',
      description: 'Aplica tu logo y paleta de colores para una experiencia familiar al pagador.',
    },
    {
      title: 'Registros listos para auditoría',
      description: 'Mantiene trazabilidad completa de requests, transiciones de estado y eventos de liquidación.',
    },
  ],
  pt: [
    {
      title: 'Webhooks assinados',
      description: 'Receba callbacks confiáveis a cada mudança de status com retentativas e visibilidade de entrega.',
    },
    {
      title: 'Controles de plano e quota',
      description: 'Gerencie limites de links ativos, janelas de expiração e retenção por tier.',
    },
    {
      title: 'Checkout com sua marca',
      description: 'Aplique logo e paleta de cores para uma experiência familiar ao pagador.',
    },
    {
      title: 'Registros prontos para auditoria',
      description: 'Mantenha trilha completa de requests, transições de status e eventos de liquidação.',
    },
  ],
};

const COMPARISON: Record<Language, ComparisonRow[]> = {
  en: [
    { feature: 'Integration effort', stellarPay: 'Single API endpoint + hosted checkout', traditional: 'Custom gateway integration work' },
    { feature: 'Time to first payment', stellarPay: 'Minutes', traditional: 'Days or weeks' },
    { feature: 'Settlement speed', stellarPay: 'About 5 seconds', traditional: 'T+1 to T+3 banking days' },
    { feature: 'Transaction cost', stellarPay: 'Near-zero network fee', traditional: 'Percentage fee + fixed fee' },
    { feature: 'Payment visibility', stellarPay: 'Deterministic states + webhooks', traditional: 'Polling and manual reconciliation' },
    { feature: 'Custody model', stellarPay: 'Non-custodial wallet-to-wallet', traditional: 'Custodial flows and hold periods' },
  ],
  es: [
    { feature: 'Esfuerzo de integración', stellarPay: 'Un endpoint API + checkout hospedado', traditional: 'Integración personalizada con gateway' },
    { feature: 'Tiempo al primer pago', stellarPay: 'Minutos', traditional: 'Días o semanas' },
    { feature: 'Velocidad de liquidación', stellarPay: 'Alrededor de 5 segundos', traditional: 'T+1 a T+3 días bancarios' },
    { feature: 'Costo por transacción', stellarPay: 'Comisión de red casi cero', traditional: 'Porcentaje + cargo fijo' },
    { feature: 'Visibilidad del pago', stellarPay: 'Estados deterministas + webhooks', traditional: 'Polling y conciliación manual' },
    { feature: 'Modelo de custodia', stellarPay: 'Non-custodial wallet-to-wallet', traditional: 'Flujos custodiales con períodos de espera' },
  ],
  pt: [
    { feature: 'Esforço de integração', stellarPay: 'Um endpoint API + checkout hospedado', traditional: 'Integração customizada com gateway' },
    { feature: 'Tempo para primeiro pagamento', stellarPay: 'Minutos', traditional: 'Dias ou semanas' },
    { feature: 'Velocidade de liquidação', stellarPay: 'Cerca de 5 segundos', traditional: 'T+1 a T+3 dias bancários' },
    { feature: 'Custo por transação', stellarPay: 'Taxa de rede quase zero', traditional: 'Percentual + taxa fixa' },
    { feature: 'Visibilidade do pagamento', stellarPay: 'Estados deterministas + webhooks', traditional: 'Polling e conciliação manual' },
    { feature: 'Modelo de custódia', stellarPay: 'Non-custodial wallet-to-wallet', traditional: 'Fluxos custodiais com períodos de espera' },
  ],
};

const UPCOMING: Record<Language, Item[]> = {
  en: [
    { title: 'Real-time event streams', description: 'Subscribe to live payment events without polling.' },
    { title: 'Smart settlement extensions', description: 'Route payment intents with more configurable execution logic.' },
    { title: 'Conversion analytics', description: 'Track link conversion, confirmation time, and expiration patterns in one dashboard.' },
  ],
  es: [
    { title: 'Eventos en tiempo real', description: 'Suscríbete a eventos de pago en vivo sin polling.' },
    { title: 'Extensiones de liquidación inteligente', description: 'Enruta intents de pago con lógica de ejecución más configurable.' },
    { title: 'Analítica de conversión', description: 'Mide conversión de links, tiempo de confirmación y expiraciones en un solo dashboard.' },
  ],
  pt: [
    { title: 'Eventos em tempo real', description: 'Assine eventos de pagamento ao vivo sem polling.' },
    { title: 'Extensões de liquidação inteligente', description: 'Roteie intents de pagamento com lógica de execução mais configurável.' },
    { title: 'Analítica de conversão', description: 'Acompanhe conversão de links, tempo de confirmação e expirações em um dashboard único.' },
  ],
};

const SDK_SECTION_ITEMS: Record<Language, Item[]> = {
  en: [
    {
      title: 'Guided implementation flow',
      description: 'Follow a clear setup path from API key generation to link settlement monitoring.',
    },
    {
      title: 'Interactive payload testing',
      description: 'Adjust amount, asset, and expiration to preview real request structure before deployment.',
    },
    {
      title: 'Production-readiness context',
      description: 'Connect SDK workflows to retention, webhooks, and team controls available by plan.',
    },
  ],
  es: [
    {
      title: 'Flujo guiado de implementación',
      description: 'Sigue un camino claro desde generación de API keys hasta monitoreo de liquidación.',
    },
    {
      title: 'Pruebas interactivas de payload',
      description: 'Ajusta monto, activo y expiración para validar estructura real de requests antes de desplegar.',
    },
    {
      title: 'Contexto de producción',
      description: 'Conecta el flujo SDK con retención, webhooks y control de equipo por plan.',
    },
  ],
  pt: [
    {
      title: 'Fluxo guiado de implementação',
      description: 'Siga um caminho claro da geração de API keys ao monitoramento de liquidação.',
    },
    {
      title: 'Testes interativos de payload',
      description: 'Ajuste valor, ativo e expiração para validar estrutura real de requests antes do deploy.',
    },
    {
      title: 'Contexto para produção',
      description: 'Conecte o fluxo SDK com retenção, webhooks e controle de equipe por plano.',
    },
  ],
};

export default function Features() {
  const { language } = useI18n();

  const copy = COPY[language];
  const coreFeatures = CORE_FEATURES[language];
  const invoiceFeatures = INVOICE_FEATURES[language];
  const comparisonRows = COMPARISON[language];
  const upcomingFeatures = UPCOMING[language];
  const sdkSectionItems = SDK_SECTION_ITEMS[language];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {copy.heroTitleStart}{' '}
              <span className="text-gradient">{copy.heroTitleHighlight}</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{copy.heroDescription}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="card p-8">
            <h2 className="text-3xl font-semibold text-foreground">{copy.sdkSectionTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.sdkSectionSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/sdk" className="btn-primary px-5 py-2.5 text-sm">
                {copy.sdkSectionPrimaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/app" className="btn-secondary px-5 py-2.5 text-sm">
                {copy.sdkSectionSecondaryCta}
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            {sdkSectionItems.map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.coreTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.coreSubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature, index) => {
            const Icon = CORE_FEATURE_ICONS[index];
            return (
              <article key={feature.title} className="card hover-glow p-8 animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.07}s` }}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.managementTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.managementSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {invoiceFeatures.map((feature, index) => {
              const Icon = INVOICE_FEATURE_ICONS[index];
              return (
                <article
                  key={feature.title}
                  className="group rounded-xl border border-border bg-background p-8 transition-all hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${0.05 + index * 0.08}s` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.comparisonTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.comparisonSubtitle}</p>
        </div>
        <div className="mt-8 space-y-3 md:hidden">
          {comparisonRows.map((row) => (
            <article key={row.feature} className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">{row.feature}</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Link2Pay</p>
                  <p className="font-medium text-primary">{row.stellarPay}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{copy.colTraditional}</p>
                  <p className="text-muted-foreground">{row.traditional}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-14 hidden overflow-hidden rounded-xl border border-border md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{copy.colFeature}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-primary">Link2Pay</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{copy.colTraditional}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr key={row.feature} className={`border-b border-border last:border-0 ${index % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="px-6 py-4 text-sm font-medium text-primary">{row.stellarPay}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{row.traditional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Clock className="h-3.5 w-3.5" />
              {copy.comingSoon}
            </span>
            <h2 className="mt-6 text-3xl font-semibold text-foreground">{copy.comingTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.comingSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {upcomingFeatures.map((feature, index) => {
              const Icon = UPCOMING_FEATURE_ICONS[index];
              return (
                <article
                  key={feature.title}
                  className="rounded-xl border border-dashed border-border bg-background p-8 text-center animate-fade-in"
                  style={{ animationDelay: `${0.05 + index * 0.08}s` }}
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-3xl font-semibold text-primary-foreground">{copy.finalTitle}</h3>
              <p className="mt-4 text-base text-primary-foreground/80">{copy.finalDescription}</p>
              <div className="mt-8">
                <Link to="/app" className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3">
                  {copy.finalCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

