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

const values = [
  {
    icon: Shield,
    title: 'Your money stays yours',
    description:
      "We built Link2Pay to be non-custodial from day one. We never hold, manage, or have access to your funds. Every payment goes directly to your wallet.",
  },
  {
    icon: Lightbulb,
    title: 'Simple by design',
    description:
      "You shouldn't need a technical background to send an invoice and get paid. We've stripped away the complexity so anyone can use it.",
  },
  {
    icon: Globe2,
    title: 'Built for a global workforce',
    description:
      "Freelancers don't have borders. We built Link2Pay on the Stellar network so you can accept payments from anywhere, in seconds, with fees under $0.01.",
  },
  {
    icon: Lock,
    title: 'Transparent & trustworthy',
    description:
      "Every payment is verified on the blockchain. You and your clients can see the proof. No black boxes, no guesswork.",
  },
];

const teamMembers = [
  {
    name: 'The Problem We Saw',
    description:
      'Freelancers in LATAM and around the world wait days — sometimes weeks — for international payments. Bank wires are expensive. PayPal takes a cut. And everyone in between slows things down.',
  },
  {
    name: 'The Solution We Built',
    description:
      'Link2Pay cuts out the middlemen. You create an invoice, share a link, and your client pays you directly through the Stellar network. It settles in 5 seconds and costs almost nothing.',
  },
  {
    name: 'Our Vision',
    description:
      "We believe getting paid for your work should be as easy as sending a text message. That's the future we're building — one invoice at a time.",
  },
];

const milestones = [
  {
    icon: Lightbulb,
    label: 'Idea born',
    detail: 'Identified the pain point for LATAM freelancers',
  },
  {
    icon: Rocket,
    label: 'MVP launched',
    detail: 'First working prototype on Stellar Testnet',
  },
  {
    icon: Users,
    label: 'Early users',
    detail: 'Freelancers & agencies testing the platform',
  },
  {
    icon: Target,
    label: "What's next",
    detail: 'Mobile app, recurring invoices & more currencies',
  },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              We're making it easier for{' '}
              <span className="text-gradient">freelancers to get paid</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Link2Pay was born from a simple frustration: why does it take so long
              and cost so much to receive payment for work you've already done?
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">Our Story</h2>
          <p className="mt-3 text-base text-muted-foreground">
            From frustration to solution — here's why we built Link2Pay.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {teamMembers.map((item, index) => (
            <article
              key={item.name}
              className="card hover-glow p-8 animate-fade-in"
              style={{ animationDelay: `${0.05 + index * 0.1}s` }}
            >
              <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">What we believe in</h2>
            <p className="mt-3 text-base text-muted-foreground">
              The principles that guide everything we build.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {values.map((value, index) => (
              <article
                key={value.title}
                className="group rounded-xl border border-border bg-background p-8 transition-all hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${0.05 + index * 0.08}s` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Journey / Milestones */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">Our journey</h2>
          <p className="mt-3 text-base text-muted-foreground">
            We're just getting started, and every step gets us closer to our mission.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {milestones.map((m, index) => (
            <div
              key={m.label}
              className="card p-6 text-center animate-fade-in"
              style={{ animationDelay: `${0.05 + index * 0.08}s` }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{m.label}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{m.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Powered By */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-foreground">Powered by the Stellar Network</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We chose Stellar because it was built for payments. Transactions settle in 5 seconds,
              cost fractions of a penny, and work across borders without any bank involvement.
              It's the perfect foundation for a global invoicing platform.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {[
                '5-second settlement',
                'Fees under $0.01',
                '150+ countries',
                'Multi-currency native',
                'Energy efficient',
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary"
                >
                  <Zap className="h-3 w-3" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <Heart className="mx-auto mb-4 h-8 w-8 text-primary-foreground/80" />
              <h3 className="text-3xl font-semibold text-primary-foreground">
                Join us on this journey
              </h3>
              <p className="mt-4 text-base text-primary-foreground/80">
                We're building the future of freelance payments. Try Link2Pay today
                and see how easy getting paid can be.
              </p>
              <div className="mt-8">
                <Link
                  to="/get-started"
                  className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3"
                >
                  Get Started Free
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
