import { useAppState } from "@/context/AppContext";
import { Zap, ArrowRight, Shield, Link, FileText, Check, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$3",
    period: "/month",
    transfers: "10 transfers",
    description: "Perfect for getting started with decentralized invoicing.",
    features: ["10 invoices/month", "Payment link generation", "Basic dashboard"],
  },
  {
    name: "Pro",
    price: "$5",
    period: "/month",
    transfers: "50 transfers",
    description: "For growing freelancers and small teams.",
    features: ["50 invoices/month", "Client management", "Invoice history", "Priority support"],
    popular: true,
  },
  {
    name: "Business",
    price: "$7",
    period: "/month",
    transfers: "Unlimited",
    description: "Unlimited invoicing for established businesses.",
    features: ["Unlimited invoices", "Advanced analytics", "Custom branding", "API access"],
  },
];

export default function LandingPage() {
  const { isConnected, connectWallet, selectPlan } = useAppState();
  const navigate = useNavigate();

  const handleSelectPlan = (planName: string) => {
    selectPlan(planName);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background gradient-bg">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Link2Pay
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-1 rounded-full border border-primary/30 text-primary bg-primary/5">
            TESTNET
          </span>
          {!isConnected && (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              Conectar Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-8 animate-fade-in">
          <Shield className="h-3.5 w-3.5" />
          Built on Stellar Network — Non-custodial
        </div>
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Facturación{" "}
          <span className="text-gradient">descentralizada</span>
          <br />en Stellar
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Crea facturas. Comparte un link. Cobra al instante.
          <br />
          Sin intermediarios, sin custodia, sin complicaciones.
        </p>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Facturas digitales
          </div>
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-primary" />
            Links de pago únicos
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Firma desde tu wallet
          </div>
        </div>
      </section>

      {/* How it works - shown before connecting */}
      {!isConnected && (
        <section className="max-w-4xl mx-auto px-6 pb-16 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <h2 className="font-display text-3xl font-bold text-center text-foreground mb-3">
            ¿Cómo funciona?
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Tres pasos simples para cobrar con cripto
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Wallet, title: "Conecta tu wallet", desc: "Vincula tu wallet Stellar (ej. Freighter) para identificarte de forma segura. Sin claves privadas." },
              { icon: FileText, title: "Crea una factura", desc: "Agrega los datos de tu cliente, ítems y montos. Se genera un link de pago único automáticamente." },
              { icon: Shield, title: "Cobra al instante", desc: "Tu cliente abre el link, conecta su wallet y firma el pago. Todo on-chain, sin intermediarios." },
            ].map((step, i) => (
              <div key={step.title} className="rounded-xl bg-card neon-border p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={connectWallet}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Wallet className="h-5 w-5" />
              Conectar Wallet para comenzar
            </button>
          </div>
        </section>
      )}

      {/* Pricing - only shown after wallet connected */}
      {isConnected && (
        <section className="max-w-5xl mx-auto px-6 pb-24 animate-fade-in">
          <h2 className="font-display text-3xl font-bold text-center text-foreground mb-3">
            Elige tu plan
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Selecciona un plan para comenzar a facturar
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`relative rounded-xl p-6 transition-all duration-300 cursor-pointer group animate-fade-in ${
                  plan.popular
                    ? "neon-border-strong bg-card"
                    : "neon-border bg-card hover:neon-border-strong"
                }`}
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                onClick={() => handleSelectPlan(plan.name)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground">
                    Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <div className="text-sm font-medium text-primary mb-4">{plan.transfers}</div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground">
                  Comenzar
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-foreground">Link2Pay</span>
        </div>
        Facturación descentralizada en Stellar · TESTNET
      </footer>
    </div>
  );
}
