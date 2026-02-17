import { Link } from "react-router-dom";
import { CheckCircle2, FileText, ExternalLink, Mail } from "lucide-react";
import TrustBadge from "@/components/TrustBadge";

const PaymentSuccess = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-md text-center">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 animate-fade-in">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Payment Confirmed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.15s" }}>
          Invoice minted as NFT and stored on the Stellar blockchain.
        </p>

        {/* Badges */}
        <div className="mt-5 flex justify-center gap-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <TrustBadge variant="verified" />
          <TrustBadge variant="nft" />
        </div>

        {/* Details */}
        <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Invoice</span>
              <span className="text-sm font-medium text-foreground">INV-005</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Amount Paid</span>
              <span className="text-sm font-semibold text-foreground">3,200.00 USDC</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">NFT ID</span>
              <span className="font-mono text-xs text-foreground">NFT-0x7a3f...e91d</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transaction Hash</span>
              <a
                href="#"
                className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
              >
                0x8b2c...f4a1
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Email confirmation */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted p-3 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Mail className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            A receipt has been sent to <span className="font-medium text-foreground">billing@acmecorp.com</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <Link
            to="/dashboard"
            className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Dashboard
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Return Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>This is more than a payment — it's a verifiable invoice.</span>
      </div>
    </div>
  );
};

export default PaymentSuccess;
