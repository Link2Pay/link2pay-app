import { Link } from "react-router-dom";
import { FileText, ArrowRight, Shield, Zap } from "lucide-react";

const Onboarding = () => {
  const steps = [
    {
      icon: <FileText className="h-7 w-7 text-primary" />,
      title: "Create professional invoices",
      description:
        "Build clean, detailed invoices in seconds. Add your client, describe the work, set the amount — done.",
    },
    {
      icon: <Zap className="h-7 w-7 text-primary" />,
      title: "Get paid instantly via a link",
      description:
        "Share a payment link with your client. They pay directly — no account needed, no delays.",
    },
    {
      icon: <Shield className="h-7 w-7 text-primary" />,
      title: "Invoice becomes an NFT after payment",
      description:
        "Once paid, your invoice is minted as an NFT on the Stellar blockchain — permanent, verifiable proof of payment.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Link2Pay</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Shield className="h-3 w-3" />
              Built on Stellar Blockchain
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Invoices that become
            <br />
            <span className="text-primary">verifiable proof</span>
          </h1>

          <p className="mt-4 text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Create invoices, get paid via a link, and mint every payment as an NFT.
            <br className="hidden sm:block" />
            Permanent records. No disputes. No chargebacks.
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-border bg-card p-6 text-center transition-shadow hover:shadow-md"
            >
              <div className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </div>
              <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                {step.icon}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            Connect Wallet
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            No gas fees · Powered by Stellar
          </p>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
