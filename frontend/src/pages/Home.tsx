import { Link } from 'react-router-dom';
import {
  ArrowRight,
  DollarSign,
  FileText,
  Globe2,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const flowSteps = [
  {
    step: '01',
    icon: Wallet,
    title: 'Connect your wallet',
    description:
      'Link your Stellar wallet in one click. Your keys stay with you — always.',
  },
  {
    step: '02',
    icon: FileText,
    title: 'Create a beautiful invoice',
    description:
      'Add your line items, set the amount, and choose your currency. Done in under a minute.',
  },
  {
    step: '03',
    icon: Send,
    title: 'Share a payment link',
    description:
      'Send a simple link to your client. They click, pay, and you get notified instantly.',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Paid in 5 seconds',
    description: 'Stellar settles payments in seconds, not days. No more chasing wire transfers.',
  },
  {
    icon: DollarSign,
    title: 'Fees under $0.01',
    description: 'Whether you send $50 or $50,000 — the network fee is practically zero.',
  },
  {
    icon: Globe2,
    title: 'Works worldwide',
    description: 'Accept payments from clients in any country. No bank restrictions, no borders.',
  },
  {
    icon: ShieldCheck,
    title: 'You own your money',
    description: 'Funds go directly to your wallet. We never hold or touch your money.',
  },
];

const audienceCards = [
  {
    icon: Users,
    title: 'Freelancers & Creators',
    description:
      'Stop waiting weeks for international payments. Invoice your clients and get paid the same day — no matter where they are.',
  },
  {
    icon: TrendingUp,
    title: 'Small Businesses & Agencies',
    description:
      'Manage client invoices, track payment status, and keep your cash flow moving with a clean, simple dashboard.',
  },
  {
    icon: Globe2,
    title: 'Remote Teams in LATAM & Beyond',
    description:
      'Avoid high fees and slow bank transfers. Collect global payments in stablecoins like USDC with near-zero cost.',
  },
];

const stats = [
  { value: '5s', label: 'Average payment time' },
  { value: '<$0.01', label: 'Transaction fee' },
  { value: '3', label: 'Supported currencies' },
  { value: '150+', label: 'Countries supported' },
];

const testimonials = [
  {
    quote: "I used to wait 5-7 days for wire transfers. Now my clients pay me in seconds. It's a game changer.",
    name: 'Maria G.',
    role: 'UX Designer, Colombia',
  },
  {
    quote: "The payment links are so simple — I just paste them in my email and my clients know exactly what to do.",
    name: 'James K.',
    role: 'Web Developer, Nigeria',
  },
  {
    quote: "Finally, an invoicing tool built for people who work globally. The fees are almost nothing.",
    name: 'Sofia R.',
    role: 'Marketing Consultant, Argentina',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.12),transparent_68%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom,_hsl(175_75%_45%_/_0.06),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              Get paid globally with near-zero fees
            </span>
            <h1
              className="mt-8 text-4xl font-semibold tracking-tight text-foreground md:text-6xl animate-slide-up"
              style={{ animationDelay: '0.08s' }}
            >
              The simplest way to{' '}
              <span className="text-gradient">invoice & get paid</span>{' '}
              anywhere in the world
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg animate-slide-up"
              style={{ animationDelay: '0.16s' }}
            >
              Create professional invoices, share a payment link, and receive money in seconds —
              not days. Built for freelancers, creators, and remote teams who work across borders.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up"
              style={{ animationDelay: '0.24s' }}
            >
              <Link to="/get-started" className="btn-primary px-6 py-3.5 text-sm">
                Start Invoicing — It's Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="btn-secondary px-6 py-3.5 text-sm">
                See How It Works
              </Link>
            </div>
            <p
              className="mt-4 text-xs text-muted-foreground animate-slide-up"
              style={{ animationDelay: '0.32s' }}
            >
              No credit card required. Start on testnet for free.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${0.1 + index * 0.08}s` }}
              >
                <div className="text-2xl font-semibold text-primary md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">Get paid in 3 simple steps</h2>
          <p className="mt-3 text-base text-muted-foreground">
            No complicated setup. No bank paperwork. Just create, share, and get paid.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {flowSteps.map((step, index) => (
            <div
              key={step.title}
              className="card hover-glow relative p-8 animate-fade-in"
              style={{ animationDelay: `${0.05 + index * 0.1}s` }}
            >
              <span className="absolute right-6 top-6 text-4xl font-bold text-primary/10">
                {step.step}
              </span>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">
              Why freelancers love Link2Pay
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              We handle the complexity so you can focus on what you do best — your work.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <article
                key={benefit.title}
                className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${0.04 + index * 0.08}s` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">Built for people who work globally</h2>
          <p className="mt-3 text-base text-muted-foreground">
            Whether you're a solo freelancer or a growing team, Link2Pay fits your workflow.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {audienceCards.map((card, index) => (
            <article
              key={card.title}
              className="card hover-glow p-8 animate-fade-in"
              style={{ animationDelay: `${0.04 + index * 0.09}s` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">
              Trusted by freelancers worldwide
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Hear from people who are already getting paid faster.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, index) => (
              <article
                key={t.name}
                className="rounded-xl border border-border bg-background p-8 animate-fade-in"
                style={{ animationDelay: `${0.04 + index * 0.09}s` }}
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  "{t.quote}"
                </p>
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How Payment Works - Simplified */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">
            Your money, your way
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Choose how you want to get paid. Link2Pay supports multiple currencies on the Stellar network.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              code: 'XLM',
              name: 'Stellar Lumens',
              desc: 'The native currency of the Stellar network. Ultra-fast and ultra-cheap.',
            },
            {
              code: 'USDC',
              name: 'USD Coin',
              desc: 'A dollar-pegged stablecoin. Great for clients who prefer to pay in USD.',
            },
            {
              code: 'EURC',
              name: 'Euro Coin',
              desc: 'A euro-pegged stablecoin. Perfect for European clients and contracts.',
            },
          ].map((currency, index) => (
            <div
              key={currency.code}
              className="card p-6 text-center animate-fade-in"
              style={{ animationDelay: `${0.05 + index * 0.08}s` }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {currency.code}
              </div>
              <h3 className="text-base font-semibold text-foreground">{currency.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{currency.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-3xl font-semibold text-primary-foreground">
                Ready to get paid without the wait?
              </h3>
              <p className="mt-4 text-base text-primary-foreground/80">
                Join thousands of freelancers who are already using Link2Pay to send invoices
                and receive payments in seconds. Start free today.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/get-started"
                  className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3"
                >
                  Create Your First Invoice
                  <Rocket className="h-4 w-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="btn border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 px-6 py-3"
                >
                  See Pricing Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
