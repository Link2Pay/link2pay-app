import { Link } from 'react-router-dom';
import { ArrowRight, Check, HelpCircle, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import MarketingHero from '../components/marketing/MarketingHero';
import MarketingSection from '../components/marketing/MarketingSection';
import MarketingCard from '../components/marketing/MarketingCard';
import SectionHeading from '../components/marketing/home/SectionHeading';

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
    sdkFreeLine: 'SDK and client libraries stay free on every plan.',
    plansNoteLine1: 'Sandbox is free forever for prototyping and integration testing. Pro and Business are designed for live payment operations.',
    plansNoteLine2: 'A per-transaction fee applies to checkout settlement. Higher tiers reduce rates and unlock volume discounts.',
    faqTitle: 'Frequently asked questions',
    faqSubtitle: 'Clear answers about plans, fees, and when to upgrade.',
  },
  es: {
    heroTitle: 'Precios simples que crecen contigo',
    heroSubtitle: 'Empieza gratis en Sandbox. Actualiza solo cuando necesites webhooks en vivo, mayor retención, branding y control de equipo.',
    sdkFreeLine: 'El SDK y las librerías cliente siguen gratis en cualquier plan.',
    plansNoteLine1: 'Sandbox es gratis para siempre para prototipos y pruebas de integración. Pro y Business están pensados para operación real.',
    plansNoteLine2: 'Se aplica una tarifa por transacción a la liquidación del checkout. Los tiers superiores reducen tarifas y habilitan descuentos por volumen.',
    faqTitle: 'Preguntas frecuentes',
    faqSubtitle: 'Respuestas claras sobre planes, tarifas y cuándo conviene escalar.',
  },
  pt: {
    heroTitle: 'Preços simples que crescem com você',
    heroSubtitle: 'Comece grátis no Sandbox. Faça upgrade apenas quando precisar de webhooks em produção, maior retenção, branding e controle de equipe.',
    sdkFreeLine: 'SDK e bibliotecas cliente continuam grátis em qualquer plano.',
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
        'Full Stellar network access',
        'Standard transaction fee tier',
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
        'Reduced per-transaction fee',
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
        'Lowest fee tier with volume-based discounts',
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
        'Acceso completo a la red Stellar',
        'Tarifa estándar por transacción',
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
        'Tarifa reducida por transacción',
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
        'Tarifa más baja con descuentos por volumen',
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
        'Acesso completo à rede Stellar',
        'Tarifa padrão por transação',
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
        'Taxa reduzida por transação',
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
        'Menor taxa com descontos por volume',
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
      a: 'Sandbox is ideal for prototyping and integration testing before launch, including full Stellar network access.',
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
  ],
  es: [
    {
      q: '¿El SDK es gratuito?',
      a: 'Sí. El SDK y las librerías cliente son gratis. Los planes pagos agregan infraestructura de producción, mayores límites y menores tarifas.',
    },
    {
      q: '¿Para qué sirve mejor Sandbox?',
      a: 'Sandbox es ideal para prototipos y pruebas de integración antes del lanzamiento, con acceso completo a la red Stellar.',
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
  ],
  pt: [
    {
      q: 'O SDK é gratuito?',
      a: 'Sim. O SDK e as bibliotecas cliente são grátis. Planos pagos adicionam infraestrutura de produção, limites maiores e menores tarifas.',
    },
    {
      q: 'Para que o Sandbox é melhor?',
      a: 'Sandbox é ideal para prototipação e testes de integração antes do lançamento, com acesso completo à rede Stellar.',
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
  ],
};

export default function Pricing() {
  const { language } = useI18n();

  const copy = COPY[language];
  const plans = PLANS[language];
  const faqs = FAQS[language];

  return (
    <div>
      <MarketingHero
        title={copy.heroTitle}
        subtitle={copy.heroSubtitle}
        note={
          <p className="max-w-2xl rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-accent-ink">
            {copy.sdkFreeLine}
          </p>
        }
      />

      <MarketingSection>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <MarketingCard
              key={plan.name}
              featured={plan.featured}
              padding="roomy"
              className="animate-in"
              style={{ animationDelay: `${0.06 + index * 0.1}s` }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {plan.badge}
                </span>
              )}

              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground sm:mb-6">{plan.tagline}</p>

              <div className="mb-6 sm:mb-8">
                {/* Prices are numbers — set them in the same mono voice as every
                    other figure on the site. Non-numeric tiers keep the display face. */}
                <span
                  className={
                    plan.period
                      ? 'font-mono text-4xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums]'
                      : 'text-4xl font-bold text-foreground'
                  }
                >
                  {plan.price}
                </span>
                {plan.period ? <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span> : null}
              </div>

              <ul className="mb-8 flex-1 space-y-3 sm:mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.to}
                className={`mt-auto px-6 text-sm ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </MarketingCard>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground sm:mt-8 sm:p-5">
          {copy.plansNoteLine1}
          <br />
          {copy.plansNoteLine2}
        </div>
      </MarketingSection>

      <MarketingSection tone="inverse" band="infra-band">
        <SectionHeading
          title={copy.faqTitle}
          description={copy.faqSubtitle}
          align="center"
          tone="inverse"
          className="mx-auto max-w-2xl"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {faqs.map((faq, index) => (
            <article
              key={faq.q}
              className="animate-in rounded-2xl border border-card-invert-foreground/10 bg-card-invert-foreground/[0.04] p-6"
              style={{ animationDelay: `${0.04 + index * 0.06}s` }}
            >
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-card-invert-foreground/70" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-card-invert-foreground">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-card-invert-foreground/72">{faq.a}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>
    </div>
  );
}
