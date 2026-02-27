import { Link } from 'react-router-dom';
import { ArrowRight, Check, HelpCircle, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

type Plan = {
  name: string;
  badge?: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  to: string;
  featured: boolean;
};

type FaqItem = { q: string; a: string };

type PricingCopy = {
  heroTitle: string;
  heroSubtitle: string;
  sdkFreeLine: string;
  plansNoteLine1: string;
  plansNoteLine2: string;
  faqTitle: string;
  faqSubtitle: string;
};

const COPY: Record<Language, PricingCopy> = {
  en: {
    heroTitle: 'Simple pricing that grows with you',
    heroSubtitle: 'Start free in Sandbox. Upgrade only when you need live webhooks, longer retention, branding, and team controls.',
    sdkFreeLine: 'SDK and client libraries are free for everyone. Plans unlock production operations.',
    plansNoteLine1: 'Sandbox is free forever for prototyping and integration testing. Pro and Business are designed for live payment operations.',
    plansNoteLine2: 'A per-transaction fee applies to checkout settlement. Higher tiers reduce rates and unlock volume discounts.',
    faqTitle: 'Frequently asked questions',
    faqSubtitle: 'Clear answers about plans, fees, and when to upgrade.',
  },
  es: {
    heroTitle: 'Precios simples que crecen contigo',
    heroSubtitle: 'Empieza gratis en Sandbox. Actualiza solo cuando necesites webhooks en vivo, mayor retención, branding y control de equipo.',
    sdkFreeLine: 'SDK y librerias cliente son gratis para todos. Los planes desbloquean operacion en produccion.',
    plansNoteLine1: 'Sandbox es gratis para siempre para prototipos y pruebas de integración. Pro y Business están pensados para operación real.',
    plansNoteLine2: 'Se aplica una tarifa por transacción a la liquidación del checkout. Los tiers superiores reducen tarifas y habilitan descuentos por volumen.',
    faqTitle: 'Preguntas frecuentes',
    faqSubtitle: 'Respuestas claras sobre planes, tarifas y cuándo conviene escalar.',
  },
  pt: {
    heroTitle: 'Preços simples que crescem com você',
    heroSubtitle: 'Comece grátis no Sandbox. Faça upgrade apenas quando precisar de webhooks em produção, maior retenção, branding e controle de equipe.',
    sdkFreeLine: 'SDK e client libraries sao gratis para todos. Planos desbloqueiam operacao em producao.',
    plansNoteLine1: 'Sandbox é grátis para sempre para prototipação e testes de integração. Pro e Business são para operação real.',
    plansNoteLine2: 'Uma taxa por transação é aplicada na liquidação do checkout. Tiers superiores reduzem taxas e liberam descontos por volume.',
    faqTitle: 'Perguntas frequentes',
    faqSubtitle: 'Respostas claras sobre planos, taxas e quando escalar.',
  },
};

const PLANS: Record<Language, Plan[]> = {
  en: [
    {
      name: 'Sandbox',
      price: '$0',
      period: '/month',
      tagline: 'Validate your flow before going live',
      features: [
        'Single-use fixed-amount payment links',
        '15-minute link expiration window',
        '3-hour transaction history retention',
        'Up to 3 concurrent active links',
        'REST polling for payment confirmation',
        'Testnet only (Sandbox environment)',
        'Transaction fee: 1.20%',
      ],
      cta: 'Start Free',
      to: '/app',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Recommended',
      price: '$5',
      period: '/month',
      tagline: 'For live payments and daily operations',
      features: [
        'Everything in Sandbox',
        '24-hour link expiration window',
        '30-day transaction history retention',
        'Higher concurrent link limits',
        'Real-time webhooks with automatic retries and HMAC signature checks',
        'Branded checkout with your logo and colors',
        'Mainnet + Testnet access',
        'Transaction fee: 0.80%',
        'Priority technical support (24-hour SLA)',
      ],
      cta: 'Upgrade to Pro',
      to: '/app',
      featured: true,
    },
    {
      name: 'Business',
      price: 'Custom',
      period: '',
      tagline: 'Custom plan for teams scaling payment volume',
      features: [
        'Everything in Pro',
        'Team management with role-based access control',
        'Multiple projects with isolated API keys',
        'Audit logs with CSV and JSON export',
        'Webhook delivery logs with event replay',
        'White-label checkout with custom domain',
        'Mainnet + Testnet + advanced operations',
        'Transaction fee: 0.50% (volume-based)',
      ],
      cta: 'Contact Sales',
      to: '/app',
      featured: false,
    },
  ],
  es: [
    {
      name: 'Sandbox',
      price: '$0',
      period: '/mes',
      tagline: 'Valida tu flujo antes de salir a producción',
      features: [
        'Links de pago de uso único con monto fijo',
        'Ventana de expiración de 15 minutos',
        'Retención de historial por 3 horas',
        'Hasta 3 links activos simultáneos',
        'Polling REST para confirmar pagos',
        'Solo Testnet (entorno Sandbox)',
        'Tarifa por transaccion: 1.20%',
      ],
      cta: 'Empezar gratis',
      to: '/app',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Recomendado',
      price: '$5',
      period: '/mes',
      tagline: 'Para cobros en vivo y operación diaria',
      features: [
        'Todo lo de Sandbox',
        'Ventana de expiración de 24 horas',
        'Retención de historial por 30 días',
        'Mayor límite de links simultáneos',
        'Webhooks en tiempo real con reintentos y verificación HMAC',
        'Checkout personalizado con logo y colores',
        'Acceso Mainnet + Testnet',
        'Tarifa por transaccion: 0.80%',
        'Soporte técnico prioritario (SLA 24 horas)',
      ],
      cta: 'Actualizar a Pro',
      to: '/app',
      featured: true,
    },
    {
      name: 'Business',
      price: 'Personalizado',
      period: '',
      tagline: 'Plan personalizado para equipos con volumen en crecimiento',
      features: [
        'Todo lo de Pro',
        'Gestión de equipo con roles y permisos',
        'Múltiples proyectos con API keys aisladas',
        'Logs de auditoría con exportación CSV y JSON',
        'Logs de webhooks con replay de eventos',
        'Checkout white-label con dominio propio',
        'Mainnet + Testnet + operacion avanzada',
        'Tarifa por transaccion: 0.50% (segun volumen)',
      ],
      cta: 'Hablar con ventas',
      to: '/app',
      featured: false,
    },
  ],
  pt: [
    {
      name: 'Sandbox',
      price: '$0',
      period: '/mes',
      tagline: 'Valide seu fluxo antes de ir para produção',
      features: [
        'Links de pagamento de uso único com valor fixo',
        'Janela de expiração de 15 minutos',
        'Retenção de histórico por 3 horas',
        'Até 3 links ativos ao mesmo tempo',
        'Polling REST para confirmar pagamentos',
        'Somente Testnet (ambiente Sandbox)',
        'Taxa por transacao: 1.20%',
      ],
      cta: 'Começar grátis',
      to: '/app',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Recomendado',
      price: '$5',
      period: '/mes',
      tagline: 'Para cobrança em produção no dia a dia',
      features: [
        'Tudo do Sandbox',
        'Janela de expiração de 24 horas',
        'Retenção de histórico por 30 dias',
        'Limites maiores de links simultâneos',
        'Webhooks em tempo real com retentativas e verificação HMAC',
        'Checkout personalizado com logo e cores',
        'Acesso Mainnet + Testnet',
        'Taxa por transacao: 0.80%',
        'Suporte técnico prioritário (SLA de 24 horas)',
      ],
      cta: 'Atualizar para Pro',
      to: '/app',
      featured: true,
    },
    {
      name: 'Business',
      price: 'Personalizado',
      period: '',
      tagline: 'Plano personalizado para times com volume em crescimento',
      features: [
        'Tudo do Pro',
        'Gestão de equipe com papéis e permissões',
        'Múltiplos projetos com API keys isoladas',
        'Logs de auditoria com exportação CSV e JSON',
        'Logs de webhooks com replay de eventos',
        'Checkout white-label com domínio próprio',
        'Mainnet + Testnet + operacao avancada',
        'Taxa por transacao: 0.50% (por volume)',
      ],
      cta: 'Falar com vendas',
      to: '/app',
      featured: false,
    },
  ],
};

const FAQS: Record<Language, FaqItem[]> = {
  en: [
    {
      q: 'Is the SDK free to use?',
      a: 'Yes. The SDK and client libraries are free. Paid plans add production infrastructure, higher limits, and lower transaction fees.',
    },
    {
      q: 'What is Sandbox best for?',
      a: 'Sandbox is ideal for prototyping and integration testing before launch, including Stellar Testnet access.',
    },
    {
      q: 'When should I upgrade to Pro?',
      a: 'Upgrade when you need real-time webhooks, branded checkout, longer data retention, and higher throughput.',
    },
    {
      q: 'When does Business make sense?',
      a: 'Business is for teams managing higher payment volume, multiple projects, advanced audit logs, and white-label needs.',
    },
    {
      q: 'How do transaction fees work?',
      a: 'Every settled payment has a fee. Higher tiers reduce your fee rate and may include volume discounts.',
    },
    {
      q: 'Do payers need an account?',
      a: 'No. Anyone can pay from the payment link checkout flow.',
    },
    {
      q: 'Is Link2Pay custodial?',
      a: 'No. Funds move wallet-to-wallet and are not custody-held by Link2Pay.',
    },
    {
      q: 'Which assets are currently supported?',
      a: 'Link2Pay currently supports Stellar assets XLM, USDC, and EURC.',
    },
  ],
  es: [
    {
      q: '¿El SDK es gratuito?',
      a: 'Sí. El SDK y las librerías cliente son gratis. Los planes pagos agregan infraestructura de producción, mayores límites y menores tarifas.',
    },
    {
      q: '¿Para qué sirve mejor Sandbox?',
      a: 'Sandbox es ideal para prototipos y pruebas de integración antes del lanzamiento, con acceso a Stellar Testnet.',
    },
    {
      q: '¿Cuándo conviene actualizar a Pro?',
      a: 'Cuando necesites webhooks en tiempo real, checkout con marca, mayor retención y más capacidad operativa.',
    },
    {
      q: '¿Cuándo tiene sentido Business?',
      a: 'Business es para equipos con mayor volumen, múltiples proyectos, auditoría avanzada y necesidades white-label.',
    },
    {
      q: '¿Cómo funcionan las tarifas por transacción?',
      a: 'Cada pago liquidado tiene una tarifa. Los tiers superiores reducen esa tarifa y pueden incluir descuentos por volumen.',
    },
    {
      q: '¿Los pagadores necesitan una cuenta?',
      a: 'No. Cualquier persona puede pagar desde el checkout del link de pago.',
    },
    {
      q: '¿Link2Pay es custodial?',
      a: 'No. Los fondos van wallet-to-wallet y Link2Pay no custodia fondos.',
    },
    {
      q: '¿Qué activos están soportados hoy?',
      a: 'Actualmente Link2Pay soporta XLM, USDC y EURC en Stellar.',
    },
  ],
  pt: [
    {
      q: 'O SDK é gratuito?',
      a: 'Sim. O SDK e as bibliotecas cliente são grátis. Planos pagos adicionam infraestrutura de produção, limites maiores e menores tarifas.',
    },
    {
      q: 'Para que o Sandbox é melhor?',
      a: 'Sandbox é ideal para prototipação e testes de integração antes do lançamento, com acesso a Stellar Testnet.',
    },
    {
      q: 'Quando devo fazer upgrade para Pro?',
      a: 'Quando você precisar de webhooks em tempo real, checkout com marca, maior retenção e mais capacidade.',
    },
    {
      q: 'Quando o Business faz sentido?',
      a: 'Business é para times com maior volume, múltiplos projetos, auditoria avançada e necessidades white-label.',
    },
    {
      q: 'Como funcionam as taxas por transação?',
      a: 'Cada pagamento liquidado tem uma taxa. Tiers superiores reduzem a taxa e podem incluir descontos por volume.',
    },
    {
      q: 'Pagadores precisam de conta?',
      a: 'Nao. Qualquer pessoa pode pagar pelo checkout do link de pagamento.',
    },
    {
      q: 'A Link2Pay e custodial?',
      a: 'Nao. Os fundos vao wallet-to-wallet e a Link2Pay nao faz custodia.',
    },
    {
      q: 'Quais ativos são suportados hoje?',
      a: 'Atualmente o Link2Pay suporta XLM, USDC e EURC na Stellar.',
    },
  ],
};

export default function Pricing() {
  const { language } = useI18n();

  const copy = COPY[language];
  const plans = PLANS[language];
  const faqs = FAQS[language];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-16 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">{copy.heroTitle}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">{copy.heroSubtitle}</p>
            <p className="mx-auto mt-4 max-w-2xl rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              {copy.sdkFreeLine}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`card relative flex h-full flex-col p-6 animate-fade-in sm:p-8 ${plan.featured ? 'neon-border-strong shadow-elevated' : ''}`}
              style={{ animationDelay: `${0.06 + index * 0.1}s` }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                  {plan.badge}
                </span>
              )}

              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground sm:mb-6">{plan.tagline}</p>

              <div className="mb-6 sm:mb-8">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period ? <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span> : null}
              </div>

              <ul className="mb-8 flex-1 space-y-3 sm:mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.to}
                className={`mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors ${
                  plan.featured
                    ? 'bg-primary text-primary-foreground hover:brightness-110'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground sm:mt-8 sm:p-5">
          {copy.plansNoteLine1}
          <br />
          {copy.plansNoteLine2}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.faqTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.faqSubtitle}</p>
          </div>
          <div className="mt-8 grid gap-4 sm:mt-14 sm:grid-cols-2">
            {faqs.map((faq, index) => (
              <article
                key={faq.q}
                className="rounded-xl border border-border bg-background p-5 animate-fade-in sm:p-6"
                style={{ animationDelay: `${0.04 + index * 0.06}s` }}
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{faq.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

