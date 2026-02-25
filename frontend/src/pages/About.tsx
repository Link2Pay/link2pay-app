import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe2,
  Heart,
  Lightbulb,
  Lock,
  Rocket,
  Shield,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const VALUE_ICONS = [Shield, Lightbulb, Globe2, Lock] as const;
const MILESTONE_ICONS = [Lightbulb, Rocket, Users, Target] as const;

type Item = { title: string; description: string };
type Milestone = { label: string; detail: string };

type AboutCopy = {
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroDescription: string;
  storyTitle: string;
  storySubtitle: string;
  valuesTitle: string;
  valuesSubtitle: string;
  journeyTitle: string;
  journeySubtitle: string;
  poweredTitle: string;
  poweredDescription: string;
  finalTitle: string;
  finalDescription: string;
  finalCta: string;
};

const COPY: Record<Language, AboutCopy> = {
  en: {
    heroTitleStart: 'Built for teams that need',
    heroTitleHighlight: 'faster and safer payments',
    heroDescription:
      'Link2Pay is a non-custodial payment link platform on Stellar. One integration gives you link creation, checkout, and settlement tracking with production reliability.',
    storyTitle: 'Why we built Link2Pay',
    storySubtitle: 'Payment teams should focus on growth, not rebuilding the same infrastructure.',
    valuesTitle: 'What we believe',
    valuesSubtitle: 'Principles that guide our product and engineering decisions.',
    journeyTitle: 'How the product evolved',
    journeySubtitle: 'Each milestone improved developer speed, payer trust, and operational clarity.',
    poweredTitle: 'Powered by the Stellar network',
    poweredDescription:
      'Stellar makes global payments practical: fast finality, very low fees, and native support for multiple assets.',
    finalTitle: 'Build payment flows with confidence',
    finalDescription: 'Launch quickly, keep control of funds, and scale without adding payment complexity.',
    finalCta: 'Start Integrating',
  },
  es: {
    heroTitleStart: 'Creado para equipos que necesitan',
    heroTitleHighlight: 'pagos más rápidos y seguros',
    heroDescription:
      'Link2Pay es una plataforma non-custodial de links de pago sobre Stellar. Una sola integración te da creación de links, checkout y seguimiento de liquidación con fiabilidad de producción.',
    storyTitle: 'Por qué construimos Link2Pay',
    storySubtitle: 'Los equipos de pago deben enfocarse en crecer, no en rehacer infraestructura.',
    valuesTitle: 'En qué creemos',
    valuesSubtitle: 'Principios que guían nuestras decisiones de producto e ingeniería.',
    journeyTitle: 'Cómo evolucionó el producto',
    journeySubtitle: 'Cada hito mejoró velocidad para developers, confianza del pagador y claridad operativa.',
    poweredTitle: 'Impulsado por la red Stellar',
    poweredDescription:
      'Stellar hace viables los pagos globales: finalidad rápida, comisiones muy bajas y soporte nativo multi-activo.',
    finalTitle: 'Construye flujos de pago con confianza',
    finalDescription: 'Lanza rápido, mantén control de los fondos y escala sin sumar complejidad.',
    finalCta: 'Comenzar integración',
  },
  pt: {
    heroTitleStart: 'Feito para times que precisam de',
    heroTitleHighlight: 'pagamentos mais rápidos e seguros',
    heroDescription:
      'Link2Pay é uma plataforma non-custodial de links de pagamento na Stellar. Uma integração entrega criação de links, checkout e acompanhamento de liquidação com confiabilidade de produção.',
    storyTitle: 'Por que construímos a Link2Pay',
    storySubtitle: 'Times de pagamento devem focar em crescimento, não em reconstruir infraestrutura.',
    valuesTitle: 'No que acreditamos',
    valuesSubtitle: 'Princípios que orientam nossas decisões de produto e engenharia.',
    journeyTitle: 'Como o produto evoluiu',
    journeySubtitle: 'Cada marco melhorou velocidade para developers, confiança do pagador e clareza operacional.',
    poweredTitle: 'Impulsionado pela rede Stellar',
    poweredDescription:
      'Stellar torna pagamentos globais práticos: finalidade rápida, taxas muito baixas e suporte nativo multi-ativo.',
    finalTitle: 'Construa fluxos de pagamento com confiança',
    finalDescription: 'Lance rápido, mantenha controle dos fundos e escale sem adicionar complexidade.',
    finalCta: 'Começar integração',
  },
};

const STORY_BLOCKS: Record<Language, Item[]> = {
  en: [
    {
      title: 'The challenge',
      description:
        'Many teams on Stellar still build payment links, expiration rules, tracking, and reconciliation from scratch. That slows launches and increases risk.',
    },
    {
      title: 'What Link2Pay changes',
      description:
        'With one API flow, teams can create payment links, use hosted checkout, and monitor status from CREATED to CONFIRMED in real time.',
    },
    {
      title: 'The long-term vision',
      description:
        'We are building the trusted payment-link layer for Stellar so teams can ship global payment experiences faster and with less operational overhead.',
    },
  ],
  es: [
    {
      title: 'El desafío',
      description:
        'Muchos equipos en Stellar aún construyen links de pago, reglas de expiración, seguimiento y conciliación desde cero. Eso retrasa lanzamientos y eleva riesgo.',
    },
    {
      title: 'Lo que cambia Link2Pay',
      description:
        'Con un solo flujo API, los equipos crean links, usan checkout hospedado y monitorean estado de CREATED a CONFIRMED en tiempo real.',
    },
    {
      title: 'La visión a largo plazo',
      description:
        'Estamos construyendo la capa confiable de links de pago para Stellar para que los equipos lancen experiencias globales con menos carga operativa.',
    },
  ],
  pt: [
    {
      title: 'O desafio',
      description:
        'Muitos times na Stellar ainda constroem links de pagamento, regras de expiração, rastreamento e conciliação do zero. Isso atrasa lançamentos e aumenta risco.',
    },
    {
      title: 'O que a Link2Pay muda',
      description:
        'Com um único fluxo API, os times criam links, usam checkout hospedado e acompanham status de CREATED a CONFIRMED em tempo real.',
    },
    {
      title: 'A visão de longo prazo',
      description:
        'Estamos construindo a camada confiável de links de pagamento para Stellar para que times lancem experiências globais com menos carga operacional.',
    },
  ],
};

const VALUES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Non-custodial by design',
      description: 'Funds settle directly to merchant wallets. You keep control and reduce counterparty risk.',
    },
    {
      title: 'Developer speed matters',
      description: 'Integration should take minutes, not months. We optimize for clear APIs and fast time-to-value.',
    },
    {
      title: 'Operational trust',
      description: 'Reliable state transitions, webhook delivery, and audit trails are core product requirements.',
    },
    {
      title: 'On-chain transparency',
      description: 'Payments are verifiable on Stellar, giving teams and payers a shared source of truth.',
    },
  ],
  es: [
    {
      title: 'Non-custodial por diseño',
      description: 'Los fondos se liquidan directo a la wallet del comercio. Mantienes control y reduces riesgo.',
    },
    {
      title: 'Velocidad para developers',
      description: 'La integración debe tomar minutos, no meses. Priorizamos APIs claras y valor rápido.',
    },
    {
      title: 'Confianza operativa',
      description: 'Transiciones de estado confiables, entrega de webhooks y auditoría son requisitos base.',
    },
    {
      title: 'Transparencia on-chain',
      description: 'Los pagos son verificables en Stellar y todos comparten la misma fuente de verdad.',
    },
  ],
  pt: [
    {
      title: 'Non-custodial por design',
      description: 'Os fundos liquidam direto na wallet do comércio. Você mantém controle e reduz risco.',
    },
    {
      title: 'Velocidade para developers',
      description: 'A integração deve levar minutos, não meses. Priorizamos APIs claras e valor rápido.',
    },
    {
      title: 'Confiança operacional',
      description: 'Transições de status confiáveis, entrega de webhooks e auditoria são requisitos centrais.',
    },
    {
      title: 'Transparencia on-chain',
      description: 'Pagamentos são verificáveis na Stellar, com uma fonte de verdade compartilhada.',
    },
  ],
};

const MILESTONES: Record<Language, Milestone[]> = {
  en: [
    { label: 'Gap mapped', detail: 'We documented repeated payment-link pain points across Stellar teams.' },
    { label: 'Core launched', detail: 'Payment link creation, hosted checkout, and settlement tracking shipped end-to-end.' },
    { label: 'Production focus', detail: 'Webhooks, controls, and auditability were added for real operational use.' },
    { label: 'Scaling path', detail: 'We continue expanding features for teams with larger payment volume.' },
  ],
  es: [
    { label: 'Brecha identificada', detail: 'Mapeamos problemas repetidos de links de pago en equipos de Stellar.' },
    { label: 'Core lanzado', detail: 'Publicamos creación de links, checkout hospedado y seguimiento de liquidación.' },
    { label: 'Foco en producción', detail: 'Agregamos webhooks, controles y auditoría para operación real.' },
    { label: 'Camino de escala', detail: 'Seguimos ampliando capacidades para equipos con mayor volumen.' },
  ],
  pt: [
    { label: 'Lacuna mapeada', detail: 'Mapeamos problemas recorrentes de links de pagamento em times da Stellar.' },
    { label: 'Core lançado', detail: 'Lançamos criação de links, checkout hospedado e rastreamento de liquidação.' },
    { label: 'Foco em produção', detail: 'Adicionamos webhooks, controles e auditoria para uso operacional real.' },
    { label: 'Rota de escala', detail: 'Seguimos ampliando recursos para times com maior volume de pagamentos.' },
  ],
};

const POWERED_TAGS: Record<Language, string[]> = {
  en: ['Finality in ~5s', 'Fees near zero', 'Global reach 150+ countries', 'Native multi-asset support', 'Energy-efficient consensus'],
  es: ['Finalidad en ~5s', 'Comisiones casi cero', 'Alcance global 150+ países', 'Soporte nativo multi-activo', 'Consenso eficiente en energía'],
  pt: ['Finalidade em ~5s', 'Taxas quase zero', 'Alcance global 150+ países', 'Suporte nativo multi-ativo', 'Consenso eficiente em energia'],
};

export default function About() {
  const { language } = useI18n();

  const copy = COPY[language];
  const storyBlocks = STORY_BLOCKS[language];
  const values = VALUES[language];
  const milestones = MILESTONES[language];
  const poweredTags = POWERED_TAGS[language];

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
          <h2 className="text-3xl font-semibold text-foreground">{copy.storyTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.storySubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {storyBlocks.map((item, index) => (
            <article key={item.title} className="card hover-glow p-8 animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.1}s` }}>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.valuesTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.valuesSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {values.map((value, index) => {
              const Icon = VALUE_ICONS[index];
              return (
                <article
                  key={value.title}
                  className="group rounded-xl border border-border bg-background p-8 transition-all hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${0.05 + index * 0.08}s` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.journeyTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.journeySubtitle}</p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {milestones.map((milestone, index) => {
            const Icon = MILESTONE_ICONS[index];
            return (
              <div key={milestone.label} className="card p-6 text-center animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.08}s` }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{milestone.label}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{milestone.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-foreground">{copy.poweredTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.poweredDescription}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {poweredTags.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                  <Zap className="h-3 w-3" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <Heart className="mx-auto mb-4 h-8 w-8 text-primary-foreground/80" />
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

