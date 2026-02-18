import { Link } from 'react-router-dom';
import { ArrowRight, Check, HelpCircle, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$3',
    period: '/month',
    tagline: 'For solo freelancers getting started',
    features: [
      '10 invoices per month',
      'Shareable payment links',
      'XLM, USDC & EURC support',
      'Basic dashboard',
      'Email support',
    ],
    cta: 'Start with Starter',
    to: '/get-started',
    featured: false,
  },
  {
    name: 'Pro',
    badge: 'Most Popular',
    price: '$5',
    period: '/month',
    tagline: 'For growing freelancers & small teams',
    features: [
      '50 invoices per month',
      'Everything in Starter',
      'Client management & favorites',
      'Full invoice history',
      'Priority support',
    ],
    cta: 'Start with Pro',
    to: '/get-started',
    featured: true,
  },
  {
    name: 'Business',
    price: '$7',
    period: '/month',
    tagline: 'For agencies & high-volume businesses',
    features: [
      'Unlimited invoices',
      'Everything in Pro',
      'Advanced analytics & reports',
      'Custom branding on invoices',
      'API access for integrations',
    ],
    cta: 'Start with Business',
    to: '/get-started',
    featured: false,
  },
];

const faqs = [
  {
    q: 'Can I try Link2Pay for free?',
    a: 'Yes! You can start on the Stellar Testnet completely free to explore all features before committing to a plan.',
  },
  {
    q: 'What currencies can my clients pay in?',
    a: 'Your clients can pay in XLM (Stellar Lumens), USDC (US Dollar stablecoin), or EURC (Euro stablecoin). All are available on every plan.',
  },
  {
    q: 'Do I need to know anything about crypto?',
    a: "Not really! You just need a Stellar wallet (like Freighter — it's a browser extension). We handle all the technical stuff behind the scenes.",
  },
  {
    q: 'Are there any hidden transaction fees?',
    a: 'Link2Pay charges no additional transaction fees. The only cost is the Stellar network fee, which is under $0.01 per transaction.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle.',
  },
  {
    q: 'Is my money safe?',
    a: "Link2Pay is non-custodial — we never hold your funds. Payments go directly from your client's wallet to yours. Your keys, your money.",
  },
];

export default function Pricing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              No hidden fees. No surprises. Pick a plan that fits your workload and start getting paid faster.
            </p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`card relative flex h-full flex-col p-8 animate-fade-in ${
                plan.featured ? 'neon-border-strong shadow-elevated' : ''
              }`}
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
          All plans include access to the Stellar Testnet for free testing.
          Network transaction fees (under $0.01) are separate from plan pricing.
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">Frequently asked questions</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Everything you need to know about Link2Pay pricing.
            </p>
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
