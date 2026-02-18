import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  Link2,
  Receipt,
  RefreshCw,
  Shield,
  Smartphone,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const coreFeatures = [
  {
    icon: Link2,
    title: 'Shareable Payment Links',
    description:
      'Generate a unique link for every invoice. Share it via email, chat, or anywhere — your client clicks and pays. No app downloads needed.',
  },
  {
    icon: Wallet,
    title: 'Connect Any Stellar Wallet',
    description:
      'Works with Freighter and other Stellar wallets. Connect in seconds. Your private keys never leave your device.',
  },
  {
    icon: Zap,
    title: '5-Second Payments',
    description:
      'Payments confirm on the Stellar network in about 5 seconds. No more waiting days for bank transfers to clear.',
  },
  {
    icon: Globe2,
    title: 'Multi-Currency Support',
    description:
      'Accept payments in XLM, USDC, or EURC. Let your clients pay in the currency that works for them.',
  },
  {
    icon: Shield,
    title: 'Your Money, Your Control',
    description:
      'Link2Pay never holds your funds. Payments go directly from your client\'s wallet to yours. No middleman.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Status Tracking',
    description:
      'See exactly when your client views the invoice, starts paying, and when the payment confirms — all in real time.',
  },
];

const invoiceFeatures = [
  {
    icon: FileText,
    title: 'Professional Invoices',
    description: 'Create clean, professional invoices with custom line items, descriptions, tax rates, and due dates.',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Save your favorite clients for quick invoicing. No need to re-enter details every time.',
  },
  {
    icon: Receipt,
    title: 'Invoice History',
    description: 'Access your complete invoice history. Filter by status, client, or date to find anything instantly.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard & Analytics',
    description: 'See your total earnings, pending payments, and payment trends at a glance from your dashboard.',
  },
];

const comparisonData = [
  {
    feature: 'Payment speed',
    stellarPay: '~5 seconds',
    traditional: '3-7 business days',
  },
  {
    feature: 'Transaction fees',
    stellarPay: 'Under $0.01',
    traditional: '$15-50 per transfer',
  },
  {
    feature: 'International payments',
    stellarPay: 'No restrictions',
    traditional: 'Bank-dependent',
  },
  {
    feature: 'Setup time',
    stellarPay: 'Under 2 minutes',
    traditional: 'Days to weeks',
  },
  {
    feature: 'Payment tracking',
    stellarPay: 'Real-time on blockchain',
    traditional: 'Manual / delayed',
  },
  {
    feature: 'Intermediaries',
    stellarPay: 'None — direct to you',
    traditional: 'Banks, processors, etc.',
  },
];

const upcomingFeatures = [
  {
    icon: Bell,
    title: 'Email Notifications',
    description: 'Get notified when clients view or pay your invoices.',
  },
  {
    icon: CreditCard,
    title: 'Recurring Invoices',
    description: 'Set up automatic invoicing for retainer clients.',
  },
  {
    icon: Smartphone,
    title: 'Mobile App',
    description: 'Manage invoices and track payments on the go.',
  },
];

export default function Features() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Everything you need to{' '}
              <span className="text-gradient">get paid faster</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Link2Pay gives you simple, powerful tools to create invoices, share payment links,
              and receive money from anywhere in the world — in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">Core Features</h2>
          <p className="mt-3 text-base text-muted-foreground">
            The essentials you need to invoice clients and collect payments without friction.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className="card hover-glow p-8 animate-fade-in"
              style={{ animationDelay: `${0.05 + index * 0.07}s` }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Invoice Management */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">
              Manage your business with ease
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              More than just payments — Link2Pay helps you stay organized and professional.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {invoiceFeatures.map((feature, index) => (
              <article
                key={feature.title}
                className="group rounded-xl border border-border bg-background p-8 transition-all hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${0.05 + index * 0.08}s` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">
            Link2Pay vs. traditional payments
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            See why freelancers are switching to blockchain-powered invoicing.
          </p>
        </div>
        <div className="mt-14 overflow-hidden rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Feature</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-primary">Link2Pay</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Traditional</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr
                  key={row.feature}
                  className={`border-b border-border last:border-0 ${
                    index % 2 === 0 ? 'bg-card' : 'bg-background'
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{row.feature}</td>
                  <td className="px-6 py-4 text-sm text-primary font-medium">{row.stellarPay}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{row.traditional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Clock className="h-3.5 w-3.5" />
              Coming Soon
            </span>
            <h2 className="mt-6 text-3xl font-semibold text-foreground">
              We're just getting started
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              New features are on the way to make your invoicing experience even better.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {upcomingFeatures.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-xl border border-dashed border-border bg-background p-8 text-center animate-fade-in"
                style={{ animationDelay: `${0.05 + index * 0.08}s` }}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-3xl font-semibold text-primary-foreground">
                Ready to try it yourself?
              </h3>
              <p className="mt-4 text-base text-primary-foreground/80">
                Create your free account and send your first invoice in under 2 minutes.
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
