import { Link } from "react-router-dom";
import { Plus, ArrowUpRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import StatusBadge, { type InvoiceStatus } from "@/components/StatusBadge";

interface Invoice {
  id: string;
  client: string;
  description: string;
  amount: string;
  currency: string;
  status: InvoiceStatus;
  date: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    client: "Acme Corp",
    description: "Website redesign — Phase 1",
    amount: "2,500.00",
    currency: "USDC",
    status: "paid",
    date: "Feb 5, 2026",
  },
  {
    id: "INV-002",
    client: "Globex Inc",
    description: "Brand identity consultation",
    amount: "800.00",
    currency: "USDC",
    status: "pending",
    date: "Feb 7, 2026",
  },
  {
    id: "INV-003",
    client: "Jane Smith",
    description: "Mobile app UI audit",
    amount: "1,200.00",
    currency: "XLM",
    status: "pending",
    date: "Feb 8, 2026",
  },
  {
    id: "INV-004",
    client: "StartupXYZ",
    description: "API integration support",
    amount: "450.00",
    currency: "USDC",
    status: "draft",
    date: "Feb 9, 2026",
  },
];

const Dashboard = () => {
  const stats = {
    total: mockInvoices.length,
    paid: mockInvoices.filter((i) => i.status === "paid").length,
    pending: mockInvoices.filter((i) => i.status === "pending").length,
    draft: mockInvoices.filter((i) => i.status === "draft").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Paid", value: stats.paid },
            { label: "Pending", value: stats.pending },
            { label: "Drafts", value: stats.draft },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mt-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Invoices</h1>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:hidden"
          >
            <Plus className="h-4 w-4" />
            New
          </Link>
        </div>

        {/* Invoice list */}
        <div className="mt-4 space-y-3">
          {mockInvoices.map((invoice) => (
            <Link
              key={invoice.id}
              to={invoice.status === "draft" ? "/create" : "/preview"}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">{invoice.id}</p>
                  <StatusBadge status={invoice.status} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {invoice.client} — {invoice.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{invoice.date}</p>
              </div>
              <div className="ml-4 flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {invoice.amount} <span className="text-xs text-muted-foreground">{invoice.currency}</span>
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
