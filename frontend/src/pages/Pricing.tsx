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
    heroTitle: 'Simple, transparent pricing',
    heroSubtitle: 'No hidden fees. Pick a plan that fits your workload and start getting paid faster.',
    plansNoteLine1: 'All plans include access to the Stellar Testnet for free testing.',
    plansNoteLine2: 'Network transaction fees (under $0.01) are separate from plan pricing.',
    faqTitle: 'Frequently asked questions',
    faqSubtitle: 'Everything you need to know about Link2Pay pricing.',
  },
  es: {
    heroTitle: 'Precios simples y transparentes',
    heroSubtitle: 'Sin costos ocultos. Elige un plan segun tu carga de trabajo y cobra mas rapido.',
    plansNoteLine1: 'Todos los planes incluyen acceso a Stellar Testnet para pruebas gratis.',
    plansNoteLine2: 'Las comisiones de red (menos de $0.01) son aparte del precio del plan.',
    faqTitle: 'Preguntas frecuentes',
    faqSubtitle: 'Todo lo que necesitas saber sobre los precios de Link2Pay.',
  },
  pt: {
    heroTitle: 'Precos simples e transparentes',
    heroSubtitle: 'Sem taxas escondidas. Escolha um plano para sua demanda e receba mais rapido.',
    plansNoteLine1: 'Todos os planos incluem acesso ao Stellar Testnet para testes gratuitos.',
    plansNoteLine2: 'Taxas de rede (abaixo de $0.01) sao separadas do valor do plano.',
    faqTitle: 'Perguntas frequentes',
    faqSubtitle: 'Tudo o que voce precisa saber sobre os precos do Link2Pay.',
  },
};

const PLANS: Record<Language, Plan[]> = {
  en: [
    {
      name: 'Starter',
      price: '$3',
      period: '/month',
      tagline: 'For solo freelancers getting started',
      features: ['10 invoices per month', 'Shareable payment links', 'XLM, USDC and EURC support', 'Basic dashboard', 'Email support'],
      cta: 'Start with Starter',
      to: '/get-started',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Most Popular',
      price: '$5',
      period: '/month',
      tagline: 'For growing freelancers and small teams',
      features: ['50 invoices per month', 'Everything in Starter', 'Client management and favorites', 'Full invoice history', 'Priority support'],
      cta: 'Start with Pro',
      to: '/get-started',
      featured: true,
    },
    {
      name: 'Business',
      price: '$7',
      period: '/month',
      tagline: 'For agencies and high-volume businesses',
      features: ['Unlimited invoices', 'Everything in Pro', 'Advanced analytics and reports', 'Custom branding on invoices', 'API access for integrations'],
      cta: 'Start with Business',
      to: '/get-started',
      featured: false,
    },
  ],
  es: [
    {
      name: 'Starter',
      price: '$3',
      period: '/mes',
      tagline: 'Para freelancers que estan empezando',
      features: ['10 facturas por mes', 'Links de pago compartibles', 'Soporte XLM, USDC y EURC', 'Panel basico', 'Soporte por email'],
      cta: 'Empezar con Starter',
      to: '/get-started',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Mas popular',
      price: '$5',
      period: '/mes',
      tagline: 'Para freelancers en crecimiento y equipos pequenos',
      features: ['50 facturas por mes', 'Todo en Starter', 'Gestion de clientes y favoritos', 'Historial completo de facturas', 'Soporte prioritario'],
      cta: 'Empezar con Pro',
      to: '/get-started',
      featured: true,
    },
    {
      name: 'Business',
      price: '$7',
      period: '/mes',
      tagline: 'Para agencias y negocios de alto volumen',
      features: ['Facturas ilimitadas', 'Todo en Pro', 'Analitica y reportes avanzados', 'Branding personalizado en facturas', 'Acceso API para integraciones'],
      cta: 'Empezar con Business',
      to: '/get-started',
      featured: false,
    },
  ],
  pt: [
    {
      name: 'Starter',
      price: '$3',
      period: '/mes',
      tagline: 'Para freelancers iniciando',
      features: ['10 faturas por mes', 'Links de pagamento compartilhaveis', 'Suporte a XLM, USDC e EURC', 'Painel basico', 'Suporte por email'],
      cta: 'Comecar com Starter',
      to: '/get-started',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'Mais popular',
      price: '$5',
      period: '/mes',
      tagline: 'Para freelancers em crescimento e equipes pequenas',
      features: ['50 faturas por mes', 'Tudo no Starter', 'Gestao de clientes e favoritos', 'Historico completo de faturas', 'Suporte prioritario'],
      cta: 'Comecar com Pro',
      to: '/get-started',
      featured: true,
    },
    {
      name: 'Business',
      price: '$7',
      period: '/mes',
      tagline: 'Para agencias e operacoes de alto volume',
      features: ['Faturas ilimitadas', 'Tudo no Pro', 'Analitica e relatorios avancados', 'Marca personalizada nas faturas', 'Acesso API para integracoes'],
      cta: 'Comecar com Business',
      to: '/get-started',
      featured: false,
    },
  ],
};

const FAQS: Record<Language, FaqItem[]> = {
  en: [
    {
      q: 'Can I try Link2Pay for free?',
      a: 'Yes. You can start on Stellar Testnet for free to explore features before choosing a paid plan.',
    },
    {
      q: 'What currencies can clients pay in?',
      a: 'Clients can pay in XLM, USDC, or EURC. All are available on every plan.',
    },
    {
      q: 'Do I need crypto knowledge?',
      a: 'Not much. You only need a Stellar wallet like Freighter. We handle the complex flow for you.',
    },
    {
      q: 'Are there hidden transaction fees?',
      a: 'No extra Link2Pay transaction fee. You only pay the Stellar network fee, usually under $0.01.',
    },
    {
      q: 'Can I change my plan later?',
      a: 'Yes. You can upgrade or downgrade anytime.',
    },
    {
      q: 'Is my money safe?',
      a: 'Link2Pay is non-custodial. Funds go directly from your client wallet to your wallet.',
    },
  ],
  es: [
    {
      q: 'Puedo probar Link2Pay gratis?',
      a: 'Si. Puedes empezar en Stellar Testnet gratis para explorar funciones antes de elegir plan pago.',
    },
    {
      q: 'En que monedas pueden pagar mis clientes?',
      a: 'Tus clientes pueden pagar en XLM, USDC o EURC. Todas estan disponibles en cada plan.',
    },
    {
      q: 'Necesito saber de crypto?',
      a: 'No mucho. Solo necesitas una wallet Stellar como Freighter. Nosotros manejamos lo complejo.',
    },
    {
      q: 'Hay comisiones ocultas?',
      a: 'No hay comision extra de Link2Pay. Solo la comision de red Stellar, generalmente menor a $0.01.',
    },
    {
      q: 'Puedo cambiar de plan despues?',
      a: 'Si. Puedes subir o bajar de plan cuando quieras.',
    },
    {
      q: 'Mi dinero esta seguro?',
      a: 'Link2Pay es no custodial. Los fondos van directo de la wallet del cliente a la tuya.',
    },
  ],
  pt: [
    {
      q: 'Posso testar Link2Pay gratis?',
      a: 'Sim. Voce pode comecar no Stellar Testnet gratuitamente antes de escolher plano pago.',
    },
    {
      q: 'Em quais moedas meus clientes podem pagar?',
      a: 'Clientes podem pagar em XLM, USDC ou EURC. Todas disponiveis em qualquer plano.',
    },
    {
      q: 'Preciso entender de crypto?',
      a: 'Nao muito. Voce precisa apenas de uma wallet Stellar como Freighter. Cuidamos da parte complexa.',
    },
    {
      q: 'Existem taxas escondidas?',
      a: 'Nao ha taxa extra da Link2Pay. Apenas a taxa da rede Stellar, normalmente abaixo de $0.01.',
    },
    {
      q: 'Posso trocar de plano depois?',
      a: 'Sim. Voce pode fazer upgrade ou downgrade quando quiser.',
    },
    {
      q: 'Meu dinheiro esta seguro?',
      a: 'Link2Pay e non-custodial. Os fundos vao direto da wallet do cliente para a sua.',
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
