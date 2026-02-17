import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import TrustBadge from "@/components/TrustBadge";

const InvoicePreview = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Invoice Preview</h1>
          <div className="flex gap-2">
            <TrustBadge variant="verified" />
            <TrustBadge variant="nft" />
          </div>
        </div>

        {/* Invoice card */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6 sm:p-8">
          {/* Header */}
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

          {/* From / To */}
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

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Website redesign — Phase 2</p>
                  <p className="text-xs text-muted-foreground">UI design and frontend development</p>
                </div>
                <p className="text-sm font-semibold text-foreground">3,200.00 USDC</p>
              </div>
            </div>
          </div>

          <div className="my-6 border-t border-border" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground">3,200.00 USDC</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/invoice/public"
            className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            View Public Link
          </Link>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Send className="h-4 w-4" />
            Send Invoice
          </button>
        </div>
      </main>
    </div>
  );
};

export default InvoicePreview;
