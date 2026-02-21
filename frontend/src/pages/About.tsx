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
    heroTitleStart: 'The payment infrastructure primitive for',
    heroTitleHighlight: 'the Stellar ecosystem',
    heroDescription:
      'Link2Pay is a non-custodial payment links API purpose-built for the Stellar network. One integration, complete payment lifecycle management, production-grade reliability.',
    storyTitle: 'Why Link2Pay Exists',
    storySubtitle: 'We identified a critical gap in the Stellar payment stack and built the definitive solution.',
    valuesTitle: 'Core Principles',
    valuesSubtitle: 'The engineering convictions behind every design decision we make.',
    journeyTitle: 'Product Timeline',
    journeySubtitle: 'Each phase sharpens our focus on developer experience, operational reliability, and ecosystem impact.',
    poweredTitle: 'Built on the Stellar Network',
    poweredDescription:
      'Stellar was purpose-built for payments. Sub-five-second finality, negligible transaction costs, and native multi-currency support make it the ideal settlement layer for Link2Pay.',
    finalTitle: 'Build payment flows with confidence',
    finalDescription: 'The payment links primitive your Stellar application deserves. Ship in minutes, scale without limits.',
    finalCta: 'Start Integrating',
  },
  es: {
    heroTitleStart: 'La infraestructura de pagos primitiva para',
    heroTitleHighlight: 'el ecosistema Stellar',
    heroDescription:
      'Link2Pay es una API de enlaces de pago no custodial disenada para la red Stellar. Una integracion, gestion completa del ciclo de vida de pagos, fiabilidad de nivel produccion.',
    storyTitle: 'Por que existe Link2Pay',
    storySubtitle: 'Identificamos una brecha critica en la infraestructura de pagos de Stellar y construimos la solucion definitiva.',
    valuesTitle: 'Principios fundamentales',
    valuesSubtitle: 'Las convicciones de ingenieria detras de cada decision de diseno.',
    journeyTitle: 'Linea de tiempo del producto',
    journeySubtitle: 'Cada fase refina nuestro enfoque en la experiencia developer, la fiabilidad operativa y el impacto en el ecosistema.',
    poweredTitle: 'Construido sobre la red Stellar',
    poweredDescription:
      'Stellar fue disenada para pagos. Finalidad en menos de cinco segundos, costos de transaccion insignificantes y soporte nativo multi-moneda la convierten en la capa de liquidacion ideal para Link2Pay.',
    finalTitle: 'Construye flujos de pago con confianza',
    finalDescription: 'El primitivo de enlaces de pago que tu aplicacion Stellar merece. Lanza en minutos, escala sin limites.',
    finalCta: 'Comenzar a integrar',
  },
  pt: {
    heroTitleStart: 'A infraestrutura de pagamentos primitiva para',
    heroTitleHighlight: 'o ecossistema Stellar',
    heroDescription:
      'Link2Pay e uma API de links de pagamento non-custodial projetada para a rede Stellar. Uma integracao, gestao completa do ciclo de vida de pagamentos, confiabilidade de nivel producao.',
    storyTitle: 'Por que Link2Pay existe',
    storySubtitle: 'Identificamos uma lacuna critica na infraestrutura de pagamentos Stellar e construimos a solucao definitiva.',
    valuesTitle: 'Principios fundamentais',
    valuesSubtitle: 'As conviccoes de engenharia por tras de cada decisao de design.',
    journeyTitle: 'Linha do tempo do produto',
    journeySubtitle: 'Cada fase refina nosso foco em experiencia developer, confiabilidade operacional e impacto no ecossistema.',
    poweredTitle: 'Construido sobre a rede Stellar',
    poweredDescription:
      'Stellar foi projetada para pagamentos. Finalidade em menos de cinco segundos, custos de transacao insignificantes e suporte nativo multi-moeda a tornam a camada de liquidacao ideal para Link2Pay.',
    finalTitle: 'Construa fluxos de pagamento com confianca',
    finalDescription: 'O primitivo de links de pagamento que sua aplicacao Stellar merece. Lance em minutos, escale sem limites.',
    finalCta: 'Comecar a integrar',
  },
};

const STORY_BLOCKS: Record<Language, Item[]> = {
  en: [
    {
      title: 'The Problem',
      description:
        'Every Stellar application rebuilds the same payment infrastructure from scratch: intent creation, expiration handling, status synchronization, transaction monitoring, retry logic, and audit trails. This fragmented approach wastes engineering cycles and introduces inconsistent payment experiences across the ecosystem.',
    },
    {
      title: 'The Solution',
      description:
        'Link2Pay abstracts the entire payment lifecycle into a single API call. Create a payment link, direct payers to a hosted checkout, and track settlement status programmatically. No wallet custody, no blockchain plumbing, no operational overhead.',
    },
    {
      title: 'The Vision',
      description:
        'We are building the canonical payment links layer for Stellar. The same way Stripe defined card payment DX, Link2Pay will define how Stellar-native payments are created, managed, and settled at scale.',
    },
  ],
  es: [
    {
      title: 'El Problema',
      description:
        'Cada aplicacion Stellar reconstruye la misma infraestructura de pagos desde cero: creacion de intents, manejo de expiracion, sincronizacion de estados, monitoreo de transacciones, logica de reintentos y registros de auditoria. Este enfoque fragmentado desperdicia ciclos de ingenieria e introduce experiencias de pago inconsistentes en todo el ecosistema.',
    },
    {
      title: 'La Solucion',
      description:
        'Link2Pay abstrae todo el ciclo de vida de pagos en una sola llamada API. Crea un enlace de pago, redirige a los pagadores a un checkout hospedado y rastrea el estado de liquidacion programaticamente. Sin custodia de wallets, sin plomeria blockchain, sin overhead operativo.',
    },
    {
      title: 'La Vision',
      description:
        'Estamos construyendo la capa canonica de enlaces de pago para Stellar. De la misma forma que Stripe definio la DX de pagos con tarjeta, Link2Pay definira como se crean, gestionan y liquidan pagos nativos de Stellar a escala.',
    },
  ],
  pt: [
    {
      title: 'O Problema',
      description:
        'Cada aplicacao Stellar reconstroi a mesma infraestrutura de pagamentos do zero: criacao de intents, tratamento de expiracao, sincronizacao de status, monitoramento de transacoes, logica de retentativas e trilhas de auditoria. Essa abordagem fragmentada desperica ciclos de engenharia e gera experiencias de pagamento inconsistentes em todo o ecossistema.',
    },
    {
      title: 'A Solucao',
      description:
        'Link2Pay abstrai todo o ciclo de vida de pagamentos em uma unica chamada API. Crie um link de pagamento, direcione pagadores para um checkout hospedado e acompanhe o status de liquidacao programaticamente. Sem custodia de wallets, sem infraestrutura blockchain, sem overhead operacional.',
    },
    {
      title: 'A Visao',
      description:
        'Estamos construindo a camada canonica de links de pagamento para Stellar. Da mesma forma que Stripe definiu a DX de pagamentos com cartao, Link2Pay definira como pagamentos nativos Stellar sao criados, gerenciados e liquidados em escala.',
    },
  ],
};

const VALUES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Non-Custodial Architecture',
      description: 'Link2Pay never touches your funds. Every payment settles directly to the merchant wallet. Zero counterparty risk, full regulatory clarity, complete sovereign control over assets.',
    },
    {
      title: 'Developer-First Design',
      description: 'A single API call creates a payment link. Hosted checkout, status polling, and settlement confirmation are handled out of the box. Integration measured in minutes, not sprints.',
    },
    {
      title: 'Operational Reliability',
      description: 'Payment lifecycle management, automatic expiration, structured logging, and webhook delivery are first-class concerns engineered into the core, not bolted on as afterthoughts.',
    },
    {
      title: 'On-Chain Transparency',
      description: 'Every transaction is independently verifiable on the Stellar ledger. Full auditability, deterministic settlement, and cryptographic proof of payment at every step.',
    },
  ],
  es: [
    {
      title: 'Arquitectura No Custodial',
      description: 'Link2Pay nunca toca tus fondos. Cada pago se liquida directamente en la wallet del comerciante. Cero riesgo de contraparte, claridad regulatoria total, control soberano completo sobre los activos.',
    },
    {
      title: 'Diseno Developer-First',
      description: 'Una sola llamada API crea un enlace de pago. Checkout hospedado, consulta de estado y confirmacion de liquidacion se manejan de forma nativa. Integracion medida en minutos, no en sprints.',
    },
    {
      title: 'Fiabilidad Operativa',
      description: 'Gestion del ciclo de vida de pagos, expiracion automatica, logging estructurado y entrega de webhooks son preocupaciones de primera clase disenadas en el nucleo, no anadidas como parches.',
    },
    {
      title: 'Transparencia On-Chain',
      description: 'Cada transaccion es verificable de forma independiente en el ledger de Stellar. Auditabilidad completa, liquidacion deterministica y prueba criptografica de pago en cada paso.',
    },
  ],
  pt: [
    {
      title: 'Arquitetura Non-Custodial',
      description: 'Link2Pay nunca toca seus fundos. Cada pagamento e liquidado diretamente na wallet do comerciante. Zero risco de contraparte, clareza regulatoria total, controle soberano completo sobre os ativos.',
    },
    {
      title: 'Design Developer-First',
      description: 'Uma unica chamada API cria um link de pagamento. Checkout hospedado, consulta de status e confirmacao de liquidacao sao tratados nativamente. Integracao medida em minutos, nao em sprints.',
    },
    {
      title: 'Confiabilidade Operacional',
      description: 'Gestao do ciclo de vida de pagamentos, expiracao automatica, logging estruturado e entrega de webhooks sao preocupacoes de primeira classe projetadas no nucleo, nao adicionadas como remendos.',
    },
    {
      title: 'Transparencia On-Chain',
      description: 'Cada transacao e verificavel de forma independente no ledger Stellar. Auditabilidade completa, liquidacao deterministica e prova criptografica de pagamento em cada etapa.',
    },
  ],
};

const MILESTONES: Record<Language, Milestone[]> = {
  en: [
    { label: 'Problem Identified', detail: 'Mapped the recurring infrastructure gap across Stellar payment integrations' },
    { label: 'Core API Shipped', detail: 'Delivered end-to-end payment link creation, hosted checkout, and settlement tracking' },
    { label: 'Infrastructure Focus', detail: 'Architected the product as a composable payment primitive with full API and SDK surface' },
    { label: 'Scaling Forward', detail: 'Webhook delivery, team management, multi-asset support, and ecosystem partnerships' },
  ],
  es: [
    { label: 'Problema Identificado', detail: 'Mapeamos la brecha recurrente de infraestructura en integraciones de pago Stellar' },
    { label: 'API Core Lanzada', detail: 'Entregamos creacion de enlaces de pago, checkout hospedado y rastreo de liquidacion de extremo a extremo' },
    { label: 'Enfoque en Infraestructura', detail: 'Producto arquitecturado como primitivo de pago componible con superficie completa de API y SDK' },
    { label: 'Escalando', detail: 'Entrega de webhooks, gestion de equipos, soporte multi-activo y alianzas en el ecosistema' },
  ],
  pt: [
    { label: 'Problema Identificado', detail: 'Mapeamos a lacuna recorrente de infraestrutura em integracoes de pagamento Stellar' },
    { label: 'API Core Lancada', detail: 'Entregamos criacao de links de pagamento, checkout hospedado e rastreamento de liquidacao de ponta a ponta' },
    { label: 'Foco em Infraestrutura', detail: 'Produto arquitetado como primitivo de pagamento componivel com superficie completa de API e SDK' },
    { label: 'Escalando', detail: 'Entrega de webhooks, gestao de equipes, suporte multi-ativo e parcerias no ecossistema' },
  ],
};

const POWERED_TAGS: Record<Language, string[]> = {
  en: ['Sub-5s finality', 'Fees < $0.01', 'Global reach, 150+ countries', 'Native multi-asset support', 'Carbon-neutral consensus'],
  es: ['Finalidad < 5s', 'Comisiones < $0.01', 'Alcance global, 150+ paises', 'Soporte nativo multi-activo', 'Consenso carbono-neutral'],
  pt: ['Finalidade < 5s', 'Taxas < $0.01', 'Alcance global, 150+ paises', 'Suporte nativo multi-ativo', 'Consenso carbono-neutro'],
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
