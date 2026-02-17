import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientEmail: "",
    description: "",
    amount: "",
    currency: "USDC",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/preview");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-foreground">Create Invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below to create a new invoice.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="clientEmail" className="block text-sm font-medium text-foreground">
              Client email
            </label>
            <input
              id="clientEmail"
              type="email"
              required
              placeholder="client@company.com"
              value={form.clientEmail}
              onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Service description
            </label>
            <textarea
              id="description"
              required
              rows={3}
              placeholder="Describe the work completed..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-foreground">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-foreground">
                Currency
              </label>
              <select
                id="currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
          </div>

          {/* Microcopy */}
          <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-accent/50 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
            <p className="text-xs leading-relaxed text-accent-foreground">
              Once paid, this invoice will be minted as an NFT and stored on the blockchain — permanent, verifiable proof of payment.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Preview Invoice
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateInvoice;
