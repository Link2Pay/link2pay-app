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
  plansNoteLine1: string;
  plansNoteLine2: string;
  faqTitle: string;
  faqSubtitle: string;
};

const COPY: Record<Language, PricingCopy> = {
  en: {
    heroTitle: 'Predictable pricing, built for scale',
    heroSubtitle: 'Our SDK and client libraries are always free. Upgrade to unlock production-grade infrastructure, lower transaction fees, and enterprise capabilities as your payment volume grows.',
    plansNoteLine1: 'Sandbox is free forever for prototyping and integration testing. Pro and Business deliver the uptime, throughput, and compliance tooling required for production workloads.',
    plansNoteLine2: 'A per-transaction fee applies to all payments settled through Link2Pay checkout. Higher-tier plans unlock progressively lower rates and volume-based discounts.',
    faqTitle: 'Frequently asked questions',
    faqSubtitle: 'Detailed answers about plans, fees, and how Link2Pay scales with your business.',
  },
  es: {
    heroTitle: 'Precios predecibles, disenados para escalar',
    heroSubtitle: 'Nuestro SDK y librerias cliente son siempre gratuitos. Actualiza para acceder a infraestructura de produccion, tarifas de transaccion mas bajas y capacidades enterprise a medida que crece tu volumen de pagos.',
    plansNoteLine1: 'Sandbox es gratis para siempre, ideal para prototipos y pruebas de integracion. Pro y Business ofrecen la disponibilidad, rendimiento y herramientas de cumplimiento que exige un entorno de produccion.',
    plansNoteLine2: 'Se aplica una tarifa por transaccion a todos los pagos liquidados a traves del checkout de Link2Pay. Los planes superiores desbloquean tarifas progresivamente mas bajas y descuentos por volumen.',
    faqTitle: 'Preguntas frecuentes',
    faqSubtitle: 'Respuestas detalladas sobre planes, tarifas y como Link2Pay escala con tu negocio.',
  },
  pt: {
    heroTitle: 'Precos previsiveis, projetados para escalar',
    heroSubtitle: 'Nosso SDK e bibliotecas cliente sao sempre gratuitos. Faca upgrade para desbloquear infraestrutura de producao, taxas de transacao mais baixas e recursos enterprise conforme seu volume de pagamentos cresce.',
    plansNoteLine1: 'Sandbox e gratuito para sempre, ideal para prototipagem e testes de integracao. Pro e Business entregam a disponibilidade, throughput e ferramentas de conformidade exigidas por cargas de producao.',
    plansNoteLine2: 'Uma taxa por transacao se aplica a todos os pagamentos liquidados pelo checkout Link2Pay. Planos superiores desbloqueiam tarifas progressivamente menores e descontos baseados em volume.',
    faqTitle: 'Perguntas frequentes',
    faqSubtitle: 'Respostas detalhadas sobre planos, taxas e como o Link2Pay escala com o seu negocio.',
  },
};

const PLANS: Record<Language, Plan[]> = {
  en: [
    {
      name: 'Sandbox',
      price: '$0',
      period: '/month',
      tagline: 'Prototype and integrate risk-free',
      features: [
        'Single-use fixed-amount payment links',
        '15-minute link expiration window',
        '3-hour transaction data retention',
        'Up to 3 concurrent active links',
        'REST polling for payment confirmation',
        'Full Stellar Testnet access included',
        'Standard transaction fee tier',
      ],
      cta: 'Start Building',
      to: '/get-started',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Recommended',
      price: '$5',
      period: '/month',
      tagline: 'Production-grade reliability',
      features: [
        'All Sandbox capabilities included',
        '24-hour link expiration window',
        '30-day transaction data retention',
        'Increased concurrent link limits',
        'Real-time webhooks with automatic retries and HMAC signature verification',
        'Branded checkout page with your logo and colors',
        'Reduced per-transaction fee',
        'Priority technical support with 24-hour SLA',
      ],
      cta: 'Upgrade to Pro',
      to: '/get-started',
      featured: true,
    },
    {
      name: 'Business',
      price: '$7',
      period: '/month',
      tagline: 'Enterprise-ready for growing teams',
      features: [
        'All Pro capabilities included',
        'Team management with role-based access control',
        'Multiple projects with isolated API keys and automatic key rotation',
        'Compliance-ready audit logs with CSV and JSON export',
        'Webhook delivery logs with one-click event replay',
        'White-label checkout with custom domain and removal of Link2Pay branding',
        'Lowest per-transaction fee with volume-based discounts',
      ],
      cta: 'Go Business',
      to: '/get-started',
      featured: false,
    },
  ],
  es: [
    {
      name: 'Sandbox',
      price: '$0',
      period: '/mes',
      tagline: 'Prototipa e integra sin riesgos',
      features: [
        'Links de pago de uso unico con monto fijo',
        'Ventana de expiracion de 15 minutos',
        'Retencion de datos de transaccion por 3 horas',
        'Hasta 3 links activos simultaneos',
        'Polling REST para confirmacion de pagos',
        'Acceso completo a Stellar Testnet incluido',
        'Tarifa de transaccion estandar',
      ],
      cta: 'Empezar a construir',
      to: '/get-started',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Recomendado',
      price: '$5',
      period: '/mes',
      tagline: 'Fiabilidad de grado productivo',
      features: [
        'Todas las capacidades de Sandbox incluidas',
        'Ventana de expiracion de 24 horas',
        'Retencion de datos de transaccion por 30 dias',
        'Limites ampliados de links simultaneos',
        'Webhooks en tiempo real con reintentos automaticos y verificacion de firma HMAC',
        'Pagina de checkout personalizada con tu logo y colores',
        'Tarifa por transaccion reducida',
        'Soporte tecnico prioritario con SLA de 24 horas',
      ],
      cta: 'Actualizar a Pro',
      to: '/get-started',
      featured: true,
    },
    {
      name: 'Business',
      price: '$7',
      period: '/mes',
      tagline: 'Listo para equipos y empresas en crecimiento',
      features: [
        'Todas las capacidades de Pro incluidas',
        'Gestion de equipos con control de acceso basado en roles',
        'Multiples proyectos con API keys aisladas y rotacion automatica',
        'Logs de auditoria listos para compliance con exportacion CSV y JSON',
        'Logs de entrega de webhooks con replay de eventos en un clic',
        'Checkout white-label con dominio propio y sin marca Link2Pay',
        'Tarifa por transaccion mas baja con descuentos basados en volumen',
      ],
      cta: 'Ir a Business',
      to: '/get-started',
      featured: false,
    },
  ],
  pt: [
    {
      name: 'Sandbox',
      price: '$0',
      period: '/mes',
      tagline: 'Prototipe e integre sem riscos',
      features: [
        'Links de pagamento de uso unico com valor fixo',
        'Janela de expiracao de 15 minutos',
        'Retencao de dados de transacao por 3 horas',
        'Ate 3 links ativos simultaneamente',
        'Polling REST para confirmacao de pagamentos',
        'Acesso completo a Stellar Testnet incluido',
        'Faixa de taxa de transacao padrao',
      ],
      cta: 'Comecar a construir',
      to: '/get-started',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Recomendado',
      price: '$5',
      period: '/mes',
      tagline: 'Confiabilidade de nivel produtivo',
      features: [
        'Todos os recursos do Sandbox incluidos',
        'Janela de expiracao de 24 horas',
        'Retencao de dados de transacao por 30 dias',
        'Limites ampliados de links simultaneos',
        'Webhooks em tempo real com retentativas automaticas e verificacao de assinatura HMAC',
        'Pagina de checkout personalizada com seu logo e cores',
        'Taxa por transacao reduzida',
        'Suporte tecnico prioritario com SLA de 24 horas',
      ],
      cta: 'Atualizar para Pro',
      to: '/get-started',
      featured: true,
    },
    {
      name: 'Business',
      price: '$7',
      period: '/mes',
      tagline: 'Pronto para times e empresas em crescimento',
      features: [
        'Todos os recursos do Pro incluidos',
        'Gestao de times com controle de acesso baseado em papeis',
        'Multiplos projetos com API keys isoladas e rotacao automatica',
        'Logs de auditoria prontos para compliance com exportacao CSV e JSON',
        'Logs de entrega de webhooks com replay de eventos em um clique',
        'Checkout white-label com dominio proprio e remocao da marca Link2Pay',
        'Menor taxa por transacao com descontos baseados em volume',
      ],
      cta: 'Ir para Business',
      to: '/get-started',
      featured: false,
    },
  ],
};

const FAQS: Record<Language, FaqItem[]> = {
  en: [
    {
      q: 'Is the SDK free to use?',
      a: 'Yes. The Link2Pay SDK and all client libraries are completely free and open source. You can integrate them into your application at no cost. Paid plans unlock production-grade infrastructure, higher throughput limits, and reduced per-transaction fees.',
    },
    {
      q: 'What can I do on the Sandbox plan?',
      a: 'Sandbox gives you everything you need to prototype and test your integration: single-use fixed-amount payment links, 15-minute expiration windows, 3-hour data retention, up to 3 concurrent active links, and REST polling for payment confirmation. It includes full Stellar Testnet access so you can validate your flow end-to-end before going live.',
    },
    {
      q: 'What does the Pro plan add?',
      a: 'Pro is designed for production workloads. It extends link expiration to 24 hours, retains transaction data for 30 days, increases concurrent link limits, and introduces real-time webhooks with automatic retries and HMAC signature verification. You also get branded checkout pages and priority technical support with a 24-hour response SLA.',
    },
    {
      q: 'What additional capabilities does Business include?',
      a: 'Business is built for teams and scale. It adds role-based access control, multiple projects with isolated API keys and automatic key rotation, compliance-ready audit logs with CSV/JSON export, webhook delivery logs with one-click event replay, and full white-label checkout with your own domain. You also receive the lowest per-transaction fees with volume-based discounts.',
    },
    {
      q: 'How are transaction fees structured?',
      a: 'A per-transaction fee is applied to every payment settled through the Link2Pay checkout flow. The fee rate decreases as you move to higher-tier plans: Sandbox uses the standard rate, Pro applies a reduced rate, and Business unlocks the lowest rate along with automatic volume-based discounts for high-throughput merchants.',
    },
    {
      q: 'Which blockchains does Link2Pay support?',
      a: 'Link2Pay is currently built on the Stellar network, supporting XLM, USDC, and EURC as settlement assets. Stellar was chosen for its sub-second finality, negligible network fees, and robust anchor ecosystem. Multi-chain support is on our product roadmap and will be announced through our developer channels.',
    },
  ],
  es: [
    {
      q: 'El SDK es gratuito?',
      a: 'Si. El SDK de Link2Pay y todas las bibliotecas cliente son completamente gratuitos y de codigo abierto. Puedes integrarlos en tu aplicacion sin costo. Los planes de pago desbloquean infraestructura de produccion, mayores limites de rendimiento y tarifas por transaccion reducidas.',
    },
    {
      q: 'Que puedo hacer con el plan Sandbox?',
      a: 'Sandbox te da todo lo necesario para prototipar y probar tu integracion: links de pago de uso unico con monto fijo, ventana de expiracion de 15 minutos, retencion de datos por 3 horas, hasta 3 links activos simultaneos y polling REST para confirmacion de pagos. Incluye acceso completo a Stellar Testnet para que valides tu flujo de extremo a extremo antes de salir a produccion.',
    },
    {
      q: 'Que agrega el plan Pro?',
      a: 'Pro esta disenado para cargas de trabajo en produccion. Extiende la expiracion de links a 24 horas, retiene datos de transaccion por 30 dias, aumenta los limites de links simultaneos e introduce webhooks en tiempo real con reintentos automaticos y verificacion de firma HMAC. Tambien obtienes paginas de checkout con tu marca y soporte tecnico prioritario con SLA de respuesta de 24 horas.',
    },
    {
      q: 'Que capacidades adicionales incluye Business?',
      a: 'Business esta construido para equipos y escala. Agrega control de acceso basado en roles, multiples proyectos con API keys aisladas y rotacion automatica, logs de auditoria listos para compliance con exportacion CSV/JSON, logs de entrega de webhooks con replay de eventos en un clic y checkout white-label completo con tu propio dominio. Tambien recibes las tarifas por transaccion mas bajas con descuentos basados en volumen.',
    },
    {
      q: 'Como se estructuran las tarifas por transaccion?',
      a: 'Se aplica una tarifa por transaccion a cada pago liquidado a traves del flujo de checkout de Link2Pay. La tasa disminuye conforme avanzas a planes superiores: Sandbox usa la tarifa estandar, Pro aplica una tarifa reducida y Business desbloquea la tarifa mas baja junto con descuentos automaticos por volumen para comercios de alto rendimiento.',
    },
    {
      q: 'Que blockchains soporta Link2Pay?',
      a: 'Link2Pay esta construido actualmente sobre la red Stellar, soportando XLM, USDC y EURC como activos de liquidacion. Stellar fue elegido por su finalidad en menos de un segundo, tarifas de red insignificantes y un ecosistema de anchors robusto. El soporte multi-chain esta en nuestro roadmap de producto y sera anunciado a traves de nuestros canales para desarrolladores.',
    },
  ],
  pt: [
    {
      q: 'O SDK e gratuito?',
      a: 'Sim. O SDK do Link2Pay e todas as bibliotecas cliente sao completamente gratuitos e de codigo aberto. Voce pode integra-los na sua aplicacao sem custo. Os planos pagos desbloqueiam infraestrutura de producao, maiores limites de throughput e taxas por transacao reduzidas.',
    },
    {
      q: 'O que posso fazer com o plano Sandbox?',
      a: 'Sandbox oferece tudo o que voce precisa para prototipar e testar sua integracao: links de pagamento de uso unico com valor fixo, janela de expiracao de 15 minutos, retencao de dados por 3 horas, ate 3 links ativos simultaneamente e polling REST para confirmacao de pagamentos. Inclui acesso completo a Stellar Testnet para que voce valide seu fluxo de ponta a ponta antes de entrar em producao.',
    },
    {
      q: 'O que o plano Pro adiciona?',
      a: 'Pro e projetado para cargas de trabalho em producao. Estende a expiracao de links para 24 horas, retém dados de transacao por 30 dias, aumenta os limites de links simultaneos e introduz webhooks em tempo real com retentativas automaticas e verificacao de assinatura HMAC. Voce tambem recebe paginas de checkout com sua marca e suporte tecnico prioritario com SLA de resposta de 24 horas.',
    },
    {
      q: 'Quais capacidades adicionais o Business inclui?',
      a: 'Business e construido para times e escala. Adiciona controle de acesso baseado em papeis, multiplos projetos com API keys isoladas e rotacao automatica, logs de auditoria prontos para compliance com exportacao CSV/JSON, logs de entrega de webhooks com replay de eventos em um clique e checkout white-label completo com seu proprio dominio. Voce tambem recebe as menores taxas por transacao com descontos baseados em volume.',
    },
    {
      q: 'Como as taxas por transacao sao estruturadas?',
      a: 'Uma taxa por transacao e aplicada a cada pagamento liquidado pelo fluxo de checkout do Link2Pay. A aliquota diminui conforme voce avanca para planos superiores: Sandbox usa a taxa padrao, Pro aplica uma taxa reduzida e Business desbloqueia a menor taxa junto com descontos automaticos por volume para comerciantes de alto throughput.',
    },
    {
      q: 'Quais blockchains o Link2Pay suporta?',
      a: 'O Link2Pay e construido atualmente sobre a rede Stellar, suportando XLM, USDC e EURC como ativos de liquidacao. Stellar foi escolhido por sua finalidade em menos de um segundo, taxas de rede insignificantes e um ecossistema de anchors robusto. Suporte multi-chain esta em nosso roadmap de produto e sera anunciado atraves de nossos canais para desenvolvedores.',
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
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{copy.heroTitle}</h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{copy.heroSubtitle}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`card relative flex h-full flex-col p-8 animate-fade-in ${plan.featured ? 'neon-border-strong shadow-elevated' : ''}`}
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
              <p className="mb-6 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mb-8">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mb-10 flex-1 space-y-3">
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

        <div className="mt-8 rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
          {copy.plansNoteLine1}
          <br />
          {copy.plansNoteLine2}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.faqTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.faqSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {faqs.map((faq, index) => (
              <article
                key={faq.q}
                className="rounded-xl border border-border bg-background p-6 animate-fade-in"
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
