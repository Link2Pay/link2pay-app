import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Code2, KeyRound, Layers } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import InteractiveLinkBuilder from '../components/marketing/InteractiveLinkBuilder';

type Item = { title: string; description: string };
type ResourceItem = Item & { cta: string; to: string };

type SdkCopy = {
  badge: string;
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroDescription: string;
  quickTitle: string;
  quickSubtitle: string;
  builderTitle: string;
  builderSubtitle: string;
  resourcesTitle: string;
  resourcesSubtitle: string;
  finalTitle: string;
  finalDescription: string;
  finalPrimaryCta: string;
  finalSecondaryCta: string;
};

const COPY: Record<Language, SdkCopy> = {
  en: {
    badge: 'SDK and API workflows',
    heroTitleStart: 'Build faster with the',
    heroTitleHighlight: 'Link2Pay SDK section',
    heroDescription:
      'Everything technical in one place: payload patterns, checkout preview, and implementation guidance for production teams.',
    quickTitle: 'Quick implementation path',
    quickSubtitle: 'Follow this sequence to go from first request to reliable production operations.',
    builderTitle: 'Interactive API preview',
    builderSubtitle: 'Adjust amount, asset, and expiration to inspect generated URL and request payload.',
    resourcesTitle: 'SDK resources',
    resourcesSubtitle: 'Use these resources to move from prototype to production with less risk.',
    finalTitle: 'Ready to ship your integration?',
    finalDescription: 'Generate credentials, validate your flow, and launch with deterministic payment states.',
    finalPrimaryCta: 'Start in Dashboard',
    finalSecondaryCta: 'Compare Plans',
  },
  es: {
    badge: 'Workflows de SDK y API',
    heroTitleStart: 'Construye más rápido con la',
    heroTitleHighlight: 'sección SDK de Link2Pay',
    heroDescription:
      'Todo lo técnico en un solo lugar: patrones de payload, vista de checkout y guía de implementación para producción.',
    quickTitle: 'Ruta rápida de implementación',
    quickSubtitle: 'Sigue esta secuencia para pasar del primer request a una operación confiable en producción.',
    builderTitle: 'Vista interactiva de API',
    builderSubtitle: 'Ajusta monto, activo y expiración para inspeccionar URL y payload generados.',
    resourcesTitle: 'Recursos SDK',
    resourcesSubtitle: 'Usa estos recursos para pasar de prototipo a producción con menos riesgo.',
    finalTitle: 'Listo para lanzar tu integración?',
    finalDescription: 'Genera credenciales, valida tu flujo y lanza con estados de pago deterministas.',
    finalPrimaryCta: 'Empezar en Dashboard',
    finalSecondaryCta: 'Comparar planes',
  },
  pt: {
    badge: 'Workflows de SDK e API',
    heroTitleStart: 'Construa mais rápido com a',
    heroTitleHighlight: 'seção SDK da Link2Pay',
    heroDescription:
      'Tudo técnico em um só lugar: padrões de payload, prévia de checkout e guia de implementação para produção.',
    quickTitle: 'Caminho rápido de implementação',
    quickSubtitle: 'Siga esta sequência para ir do primeiro request a uma operação confiável em produção.',
    builderTitle: 'Prévia interativa de API',
    builderSubtitle: 'Ajuste valor, ativo e expiração para inspecionar URL e payload gerados.',
    resourcesTitle: 'Recursos SDK',
    resourcesSubtitle: 'Use estes recursos para passar de protótipo a produção com menos risco.',
    finalTitle: 'Pronto para lançar sua integração?',
    finalDescription: 'Gere credenciais, valide seu fluxo e lance com estados de pagamento deterministas.',
    finalPrimaryCta: 'Começar no Dashboard',
    finalSecondaryCta: 'Comparar planos',
  },
};

const QUICK_STEPS: Record<Language, Item[]> = {
  en: [
    {
      title: '1. Start in Sandbox (Free)',
      description: 'Connect wallet and create links without API keys while you validate checkout flow.',
    },
    {
      title: '2. Upgrade for API keys (Pro)',
      description: 'Generate server API keys when you are ready for production backend calls and webhooks.',
    },
    {
      title: '3. Confirm and monitor',
      description: 'Use polling in Free or webhook events in Pro to track Created, Pending, Confirmed, and Expired.',
    },
  ],
  es: [
    {
      title: '1. Empieza en Sandbox (Free)',
      description: 'Conecta wallet y crea links sin API keys mientras validas el checkout.',
    },
    {
      title: '2. Mejora para API keys (Pro)',
      description: 'Genera llaves server cuando pases a llamadas backend y webhooks en produccion.',
    },
    {
      title: '3. Confirma y monitorea',
      description: 'Usa polling en Free o webhooks en Pro para Created, Pending, Confirmed y Expired.',
    },
  ],
  pt: [
    {
      title: '1. Comece no Sandbox (Free)',
      description: 'Conecte wallet e crie links sem API keys enquanto valida o checkout.',
    },
    {
      title: '2. Upgrade para API keys (Pro)',
      description: 'Gere chaves server quando estiver pronto para chamadas backend e webhooks.',
    },
    {
      title: '3. Confirme e monitore',
      description: 'Use polling no Free ou webhooks no Pro para Created, Pending, Confirmed e Expired.',
    },
  ],
};

const RESOURCE_ITEMS: Record<Language, ResourceItem[]> = {
  en: [
    {
      title: 'API keys and auth setup',
      description: 'Start with key management and environment setup for secure requests.',
      cta: 'Open Dashboard',
      to: '/app',
    },
    {
      title: 'Lifecycle and status model',
      description: 'Understand CREATED, PENDING, CONFIRMED, and EXPIRED payment states.',
      cta: 'View Features',
      to: '/payment-links',
    },
    {
      title: 'Production scaling options',
      description: 'Choose the plan that matches your retention, branding, and team controls.',
      cta: 'View Plans',
      to: '/plans',
    },
  ],
  es: [
    {
      title: 'API keys y configuración auth',
      description: 'Empieza con gestión de claves y entorno para requests seguros.',
      cta: 'Abrir Dashboard',
      to: '/app',
    },
    {
      title: 'Modelo de estado y ciclo',
      description: 'Entiende los estados CREATED, PENDING, CONFIRMED y EXPIRED.',
      cta: 'Ver Features',
      to: '/payment-links',
    },
    {
      title: 'Opciones de escala en producción',
      description: 'Elige el plan según retención, branding y control de equipo.',
      cta: 'Ver Planes',
      to: '/plans',
    },
  ],
  pt: [
    {
      title: 'API keys e configuração auth',
      description: 'Comece com gestão de chaves e ambiente para requests seguros.',
      cta: 'Abrir Dashboard',
      to: '/app',
    },
    {
      title: 'Modelo de status e ciclo',
      description: 'Entenda os estados CREATED, PENDING, CONFIRMED e EXPIRED.',
      cta: 'Ver Features',
      to: '/payment-links',
    },
    {
      title: 'Opções de escala em produção',
      description: 'Escolha o plano conforme retenção, branding e controle de equipe.',
      cta: 'Ver Planos',
      to: '/plans',
    },
  ],
};

const STEP_ICONS = [KeyRound, Code2, Layers] as const;
const RESOURCE_ICONS = [KeyRound, Code2, BookOpen] as const;

const FLOW_EXAMPLES = {
  sandbox: `// Sandbox (Free) - polling
const { checkoutUrl, id } = await createLink(payload);
window.location.href = checkoutUrl;
const status = await getLinkStatus(id);`,
  pro: `// Pro - webhook confirmation
const { checkoutUrl } = await createLink(payload);
// listen to webhook: payment.confirmed
verifyWebhookSignature(headers, body);`,
  verify: `const expected = hmacSHA256(secret, timestamp + '.' + rawBody);
if (signature !== expected) throw new Error('Invalid signature');`,
};

export default function SDK() {
  const { language } = useI18n();

  const copy = COPY[language];
  const steps = QUICK_STEPS[language];
  const resources = RESOURCE_ITEMS[language];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Code2 className="h-3.5 w-3.5" />
              {copy.badge}
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {copy.heroTitleStart}{' '}
              <span className="text-gradient">{copy.heroTitleHighlight}</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{copy.heroDescription}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="card p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Install</p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-surface-3 bg-surface-1 p-3 text-xs text-ink-1">
{`npm install @link2pay/sdk`}
            </pre>
          </article>
          <article className="card p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Minimal snippet</p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-surface-3 bg-surface-1 p-3 text-xs text-ink-1">
{`const { checkoutUrl, id } = await sdk.links.create(payload)
window.location.href = checkoutUrl
const status = await sdk.links.get(id)`}
            </pre>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.quickTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.quickSubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <article key={step.title} className="card hover-glow p-8">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.builderTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.builderSubtitle}</p>
            <p className="mt-2 text-xs text-primary">This creates a real Sandbox link you can open.</p>
          </div>
          <div className="mt-12">
            <InteractiveLinkBuilder />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-sm font-semibold text-foreground">Sandbox (Free)</h3>
              <p className="mt-2 text-xs text-muted-foreground">Polling flow for early testing.</p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-surface-3 bg-surface-1 p-3 text-xs text-ink-1">
                {FLOW_EXAMPLES.sandbox}
              </pre>
            </article>
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-sm font-semibold text-foreground">Pro</h3>
              <p className="mt-2 text-xs text-muted-foreground">Webhook flow with signature verification.</p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-surface-3 bg-surface-1 p-3 text-xs text-ink-1">
                {FLOW_EXAMPLES.pro}
              </pre>
            </article>
          </div>
          <article className="mt-4 rounded-xl border border-border bg-background p-5">
            <h3 className="text-sm font-semibold text-foreground">Webhook verification</h3>
            <p className="mt-2 text-xs text-muted-foreground">Use timestamp + signature headers to verify event authenticity.</p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-surface-3 bg-surface-1 p-3 text-xs text-ink-1">
{`headers:
x-link2pay-signature
x-link2pay-timestamp

${FLOW_EXAMPLES.verify}`}
            </pre>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.resourcesTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.resourcesSubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {resources.map((item, index) => {
            const Icon = RESOURCE_ICONS[index];
            return (
              <article key={item.title} className="card p-8">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <Link to={item.to} className="btn-secondary mt-5 px-4 py-2 text-sm">
                  {item.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-3xl font-semibold text-primary-foreground">{copy.finalTitle}</h3>
              <p className="mt-4 text-base text-primary-foreground/85">{copy.finalDescription}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link to="/app" className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3">
                  {copy.finalPrimaryCta}
                  <ArrowRight className="h-4 w-4" />
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
