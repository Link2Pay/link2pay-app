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
    heroTitleStart: 'The payment-link primitive built for',
    heroTitleHighlight: 'the programmable economy',
    heroDescription:
      'Link2Pay is a RESTful API on the Stellar network that lets you generate payment links, render hosted checkout, and track settlement in under 5 seconds -- no payment infrastructure to build or maintain.',
    coreTitle: 'Platform Primitives',
    coreSubtitle: 'A composable API surface for payment-link creation, on-chain settlement, and deterministic state management.',
    managementTitle: 'Production-Grade Infrastructure',
    managementSubtitle: 'Enterprise-ready capabilities for webhook delivery, entitlement enforcement, and full auditability at scale.',
    comparisonTitle: 'Link2Pay vs Legacy Payment Rails',
    comparisonSubtitle: 'Compare a single-endpoint API with 5-second finality against months of custom gateway integration.',
    colFeature: 'Capability',
    colTraditional: 'Legacy Rails',
    comingSoon: 'On the Roadmap',
    comingTitle: 'The platform is evolving',
    comingSubtitle: 'Upcoming primitives to deepen protocol-level integration and unlock new developer workflows.',
    finalTitle: 'Start building in minutes',
    finalDescription: 'Generate your API key, create your first payment link with a single POST request, and confirm settlement on-chain -- all in under 2 minutes.',
    finalCta: 'Get Your API Key',
  },
  es: {
    heroTitleStart: 'El primitive de payment links construido para',
    heroTitleHighlight: 'la economia programable',
    heroDescription:
      'Link2Pay es una API RESTful sobre la red Stellar que permite generar payment links, renderizar checkout hospedado y confirmar liquidacion en menos de 5 segundos -- sin infraestructura de pagos que construir ni mantener.',
    coreTitle: 'Primitives de Plataforma',
    coreSubtitle: 'Una superficie de API composable para creacion de payment links, liquidacion on-chain y gestion de estado determinista.',
    managementTitle: 'Infraestructura Production-Grade',
    managementSubtitle: 'Capacidades enterprise-ready para entrega de webhooks, enforcement de entitlements y auditabilidad completa a escala.',
    comparisonTitle: 'Link2Pay vs Rails de Pago Legacy',
    comparisonSubtitle: 'Compara una API de un solo endpoint con finalidad en 5 segundos contra meses de integracion de gateway personalizado.',
    colFeature: 'Capacidad',
    colTraditional: 'Rails Legacy',
    comingSoon: 'En el Roadmap',
    comingTitle: 'La plataforma esta evolucionando',
    comingSubtitle: 'Nuevos primitives para profundizar integracion a nivel de protocolo y desbloquear nuevos workflows de desarrollo.',
    finalTitle: 'Empieza a construir en minutos',
    finalDescription: 'Genera tu API key, crea tu primer payment link con un solo POST request y confirma liquidacion on-chain -- todo en menos de 2 minutos.',
    finalCta: 'Obtener API Key',
  },
  pt: {
    heroTitleStart: 'O primitive de payment links construido para',
    heroTitleHighlight: 'a economia programavel',
    heroDescription:
      'Link2Pay e uma API RESTful na rede Stellar que permite gerar payment links, renderizar checkout hospedado e confirmar liquidacao em menos de 5 segundos -- sem infraestrutura de pagamentos para construir ou manter.',
    coreTitle: 'Primitives da Plataforma',
    coreSubtitle: 'Uma superficie de API composavel para criacao de payment links, liquidacao on-chain e gestao de estado deterministica.',
    managementTitle: 'Infraestrutura Production-Grade',
    managementSubtitle: 'Capacidades enterprise-ready para entrega de webhooks, enforcement de entitlements e auditabilidade completa em escala.',
    comparisonTitle: 'Link2Pay vs Rails de Pagamento Legacy',
    comparisonSubtitle: 'Compare uma API de endpoint unico com finalidade em 5 segundos contra meses de integracao de gateway customizado.',
    colFeature: 'Capacidade',
    colTraditional: 'Rails Legacy',
    comingSoon: 'No Roadmap',
    comingTitle: 'A plataforma esta evoluindo',
    comingSubtitle: 'Novos primitives para aprofundar integracao a nivel de protocolo e desbloquear novos workflows de desenvolvimento.',
    finalTitle: 'Comece a construir em minutos',
    finalDescription: 'Gere sua API key, crie seu primeiro payment link com um unico POST request e confirme liquidacao on-chain -- tudo em menos de 2 minutos.',
    finalCta: 'Obter API Key',
  },
};

const CORE_FEATURES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Payment Link API',
      description: 'One POST request creates a signed, expirable payment link with amount, asset code, memo, and custom metadata. Returns a unique URL ready for distribution.',
    },
    {
      title: 'Hosted Checkout',
      description: 'Drop users into a pre-built, mobile-responsive Stellar checkout. No frontend to build, no wallet adapter to maintain -- just redirect and collect.',
    },
    {
      title: 'Deterministic State Machine',
      description: 'Every link follows a strict CREATED > PENDING > CONFIRMED | EXPIRED lifecycle. Query state via API or receive transitions through webhooks.',
    },
    {
      title: 'Stellar-Native Settlement',
      description: 'Accept XLM, USDC, and EURC with ~5-second finality and near-zero network fees (< $0.01 per transaction on Stellar mainnet).',
    },
    {
      title: 'Non-Custodial Architecture',
      description: 'Funds settle directly between wallets on the Stellar ledger. Link2Pay never holds, routes, or touches user balances at any point.',
    },
    {
      title: 'Wallet-Native Authentication',
      description: 'Ed25519 keypair signing and Stellar wallet-based auth. No passwords, no OAuth tokens -- cryptographic identity from the protocol layer up.',
    },
  ],
  es: [
    {
      title: 'API de Payment Links',
      description: 'Un solo POST request crea un payment link firmado y expirable con monto, asset code, memo y metadata personalizada. Retorna una URL unica lista para distribuir.',
    },
    {
      title: 'Checkout Hospedado',
      description: 'Envia usuarios a un checkout Stellar pre-construido y responsive. Sin frontend que construir, sin wallet adapter que mantener -- solo redirige y cobra.',
    },
    {
      title: 'Maquina de Estado Determinista',
      description: 'Cada link sigue un lifecycle estricto CREATED > PENDING > CONFIRMED | EXPIRED. Consulta estado via API o recibe transiciones por webhooks.',
    },
    {
      title: 'Liquidacion Nativa en Stellar',
      description: 'Acepta XLM, USDC y EURC con finalidad en ~5 segundos y fees de red casi nulos (< $0.01 por transaccion en Stellar mainnet).',
    },
    {
      title: 'Arquitectura Non-Custodial',
      description: 'Los fondos se liquidan directamente entre wallets en el ledger Stellar. Link2Pay nunca retiene, enruta ni toca balances de usuarios.',
    },
    {
      title: 'Autenticacion Wallet-Native',
      description: 'Firma con keypairs Ed25519 y auth basada en wallet Stellar. Sin passwords, sin tokens OAuth -- identidad criptografica desde la capa de protocolo.',
    },
  ],
  pt: [
    {
      title: 'API de Payment Links',
      description: 'Um unico POST request cria um payment link assinado e expiravel com valor, asset code, memo e metadata customizada. Retorna uma URL unica pronta para distribuicao.',
    },
    {
      title: 'Checkout Hospedado',
      description: 'Envie usuarios para um checkout Stellar pre-construido e responsivo. Sem frontend para construir, sem wallet adapter para manter -- apenas redirecione e receba.',
    },
    {
      title: 'Maquina de Estado Deterministica',
      description: 'Cada link segue um lifecycle estrito CREATED > PENDING > CONFIRMED | EXPIRED. Consulte estado via API ou receba transicoes por webhooks.',
    },
    {
      title: 'Liquidacao Nativa na Stellar',
      description: 'Aceite XLM, USDC e EURC com finalidade em ~5 segundos e fees de rede quase nulas (< $0.01 por transacao na Stellar mainnet).',
    },
    {
      title: 'Arquitetura Non-Custodial',
      description: 'Os fundos liquidam diretamente entre wallets no ledger Stellar. Link2Pay nunca retém, roteia ou toca saldos de usuarios em nenhum momento.',
    },
    {
      title: 'Autenticacao Wallet-Native',
      description: 'Assinatura com keypairs Ed25519 e auth baseada em wallet Stellar. Sem passwords, sem tokens OAuth -- identidade criptografica desde a camada de protocolo.',
    },
  ],
};

const INVOICE_FEATURES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Webhook Delivery Engine',
      description: 'Receive signed HTTP callbacks on every state transition with exponential-backoff retries, delivery receipts, and a full replay API for missed events.',
    },
    {
      title: 'Entitlement Enforcement',
      description: 'Enforce per-tier quotas on active links, TTL windows, and retention periods. Upgrade paths from Free to Business scale automatically with your volume.',
    },
    {
      title: 'White-Label Checkout',
      description: 'Inject your logo, color palette, and domain on the hosted checkout page. Pro and Business tiers support full brand customization for a seamless payer experience.',
    },
    {
      title: 'Immutable Audit Trail',
      description: 'Every API call, state transition, and settlement event is logged with timestamps and request IDs. Export-ready for SOC 2 workflows and regulatory review.',
    },
  ],
  es: [
    {
      title: 'Motor de Entrega de Webhooks',
      description: 'Recibe callbacks HTTP firmados en cada transicion de estado con retries exponential-backoff, recibos de entrega y API de replay completa para eventos perdidos.',
    },
    {
      title: 'Enforcement de Entitlements',
      description: 'Aplica quotas por tier en links activos, ventanas TTL y periodos de retencion. Upgrade paths de Free a Business escalan automaticamente con tu volumen.',
    },
    {
      title: 'Checkout White-Label',
      description: 'Inyecta tu logo, paleta de colores y dominio en la pagina de checkout hospedado. Tiers Pro y Business soportan personalizacion total de marca.',
    },
    {
      title: 'Audit Trail Inmutable',
      description: 'Cada API call, transicion de estado y evento de liquidacion queda registrado con timestamps y request IDs. Listo para exportar en workflows SOC 2 y revision regulatoria.',
    },
  ],
  pt: [
    {
      title: 'Motor de Entrega de Webhooks',
      description: 'Receba callbacks HTTP assinados em cada transicao de estado com retries exponential-backoff, recibos de entrega e API de replay completa para eventos perdidos.',
    },
    {
      title: 'Enforcement de Entitlements',
      description: 'Aplique quotas por tier em links ativos, janelas TTL e periodos de retencao. Upgrade paths de Free a Business escalam automaticamente com seu volume.',
    },
    {
      title: 'Checkout White-Label',
      description: 'Injete seu logo, paleta de cores e dominio na pagina de checkout hospedado. Tiers Pro e Business suportam personalizacao total de marca.',
    },
    {
      title: 'Audit Trail Imutavel',
      description: 'Cada API call, transicao de estado e evento de liquidacao e registrado com timestamps e request IDs. Pronto para exportar em workflows SOC 2 e revisao regulatoria.',
    },
  ],
};

const COMPARISON: Record<Language, ComparisonRow[]> = {
  en: [
    { feature: 'Integration effort', stellarPay: 'Single REST endpoint + hosted UI', traditional: 'Months of gateway integration' },
    { feature: 'Time to first payment', stellarPay: '< 2 minutes (one POST request)', traditional: 'Days to weeks of dev cycles' },
    { feature: 'Settlement finality', stellarPay: '~5 seconds on Stellar ledger', traditional: 'T+1 to T+3 banking days' },
    { feature: 'Transaction cost', stellarPay: '< $0.01 per tx (network fee)', traditional: '2.9% + $0.30 per transaction' },
    { feature: 'State management', stellarPay: 'Deterministic lifecycle + webhooks', traditional: 'Custom polling and reconciliation' },
    { feature: 'Custody model', stellarPay: 'Non-custodial (wallet-to-wallet)', traditional: 'Custodial with hold periods' },
  ],
  es: [
    { feature: 'Esfuerzo de integracion', stellarPay: 'Un solo endpoint REST + UI hospedada', traditional: 'Meses de integracion de gateway' },
    { feature: 'Tiempo al primer pago', stellarPay: '< 2 minutos (un POST request)', traditional: 'Dias a semanas de ciclos de dev' },
    { feature: 'Finalidad de liquidacion', stellarPay: '~5 segundos en ledger Stellar', traditional: 'T+1 a T+3 dias bancarios' },
    { feature: 'Costo por transaccion', stellarPay: '< $0.01 por tx (fee de red)', traditional: '2.9% + $0.30 por transaccion' },
    { feature: 'Gestion de estado', stellarPay: 'Lifecycle determinista + webhooks', traditional: 'Polling y reconciliacion custom' },
    { feature: 'Modelo de custodia', stellarPay: 'Non-custodial (wallet-to-wallet)', traditional: 'Custodial con periodos de retencion' },
  ],
  pt: [
    { feature: 'Esforco de integracao', stellarPay: 'Um unico endpoint REST + UI hospedada', traditional: 'Meses de integracao de gateway' },
    { feature: 'Tempo para primeiro pagamento', stellarPay: '< 2 minutos (um POST request)', traditional: 'Dias a semanas de ciclos de dev' },
    { feature: 'Finalidade de liquidacao', stellarPay: '~5 segundos no ledger Stellar', traditional: 'T+1 a T+3 dias bancarios' },
    { feature: 'Custo por transacao', stellarPay: '< $0.01 por tx (fee de rede)', traditional: '2.9% + $0.30 por transacao' },
    { feature: 'Gestao de estado', stellarPay: 'Lifecycle determinisico + webhooks', traditional: 'Polling e reconciliacao custom' },
    { feature: 'Modelo de custodia', stellarPay: 'Non-custodial (wallet-to-wallet)', traditional: 'Custodial com periodos de retencao' },
  ],
};

const UPCOMING: Record<Language, Item[]> = {
  en: [
    { title: 'Server-Sent Event Streams', description: 'Subscribe to a persistent SSE channel for real-time payment lifecycle events. Eliminate polling entirely with sub-second push delivery.' },
    { title: 'Multi-Chain Settlement Adapters', description: 'Pluggable adapters for EVM chains and Soroban smart contracts. Same API surface, multiple settlement layers.' },
    { title: 'Developer Analytics Dashboard', description: 'Granular metrics on link conversion rates, median time-to-confirmation, expiration ratios, and settlement volume -- queryable via API.' },
  ],
  es: [
    { title: 'Streams de Eventos SSE', description: 'Suscribete a un canal SSE persistente para eventos de lifecycle de pagos en tiempo real. Elimina polling por completo con entrega push sub-segundo.' },
    { title: 'Adaptadores de Liquidacion Multi-Chain', description: 'Adaptadores pluggables para cadenas EVM y smart contracts Soroban. Misma superficie de API, multiples capas de liquidacion.' },
    { title: 'Dashboard de Analitica para Developers', description: 'Metricas granulares de tasas de conversion, tiempo medio de confirmacion, ratios de expiracion y volumen de liquidacion -- consultable via API.' },
  ],
  pt: [
    { title: 'Streams de Eventos SSE', description: 'Assine um canal SSE persistente para eventos de lifecycle de pagamentos em tempo real. Elimine polling por completo com entrega push sub-segundo.' },
    { title: 'Adaptadores de Liquidacao Multi-Chain', description: 'Adaptadores plugaveis para cadeias EVM e smart contracts Soroban. Mesma superficie de API, multiplas camadas de liquidacao.' },
    { title: 'Dashboard de Analitica para Developers', description: 'Metricas granulares de taxas de conversao, tempo medio de confirmacao, ratios de expiracao e volume de liquidacao -- consultavel via API.' },
  ],
};

export default function Features() {
  const { language } = useI18n();

  const copy = COPY[language];
  const coreFeatures = CORE_FEATURES[language];
  const invoiceFeatures = INVOICE_FEATURES[language];
  const comparisonRows = COMPARISON[language];
  const upcomingFeatures = UPCOMING[language];

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
        <div className="mt-14 overflow-hidden rounded-xl border border-border">
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
                    <td className="px-6 py-4 text-sm text-primary font-medium">{row.stellarPay}</td>
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
                <Link to="/get-started" className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3">
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
