import { Link } from "react-router-dom";
import { FileText, Shield, Lock, Ban } from "lucide-react";
import TrustBadge from "@/components/TrustBadge";

const PublicInvoice = () => {
  return (
    <div className="min-h-screen bg-muted/50">
      {/* Minimal header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <FileText className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Link2Pay</span>
          </div>
          <span className="text-xs text-muted-foreground">Invoice INV-005</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Trust badges */}
        <div className="flex flex-wrap gap-2">
          <TrustBadge variant="verified" />
          <TrustBadge variant="nft" />
        </div>

        {/* Invoice */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="mt-1 text-lg font-bold text-foreground">INV-005</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground">Feb 9, 2026</p>
            </div>
          </div>

          <div className="my-6 border-t border-border" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From</p>
              <p className="mt-1 text-sm font-medium text-foreground">Alex Rivera</p>
              <p className="text-sm text-muted-foreground">alex@freelancer.com</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">To</p>
              <p className="mt-1 text-sm font-medium text-foreground">Acme Corp</p>
              <p className="text-sm text-muted-foreground">billing@acmecorp.com</p>
            </div>
          </div>

          <div className="my-6 border-t border-border" />

          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Website redesign — Phase 2</p>
              <p className="text-xs text-muted-foreground">UI design and frontend development</p>
            </div>
            <p className="text-sm font-semibold text-foreground">3,200.00 USDC</p>
          </div>

          <div className="my-6 border-t border-border" />

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Due</p>
            <p className="text-2xl font-bold text-foreground">3,200.00 USDC</p>
          </div>
        </div>

        {/* Trust section */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: <Shield className="h-5 w-5 text-primary" />,
              title: "Payment mints an NFT",
              desc: "Your payment creates a unique, permanent record on the blockchain.",
            },
            {
              icon: <Lock className="h-5 w-5 text-primary" />,
              title: "Immutable receipt",
              desc: "Once confirmed, the receipt can never be altered or deleted.",
            },
            {
              icon: <Ban className="h-5 w-5 text-primary" />,
              title: "No chargebacks",
              desc: "Blockchain payments are final — protecting both parties.",
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              {item.icon}
              <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/payment-success"
          className="mt-6 block w-full rounded-xl bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          Pay Invoice — 3,200.00 USDC
        </Link>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          No account required · Powered by Stellar blockchain
        </p>
      </main>
    </div>
  );
};

export default PublicInvoice;
