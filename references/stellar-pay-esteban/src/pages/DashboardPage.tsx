import { useAppState } from "@/context/AppContext";
import {
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { invoices } = useAppState();

  const totalInvoices = invoices.length;
  const paid = invoices.filter((i) => i.status === "paid").length;
  const pending = invoices.filter((i) => i.status === "pending").length;
  const revenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.total, 0);

  const stats = [
    { label: "Total Invoices", value: totalInvoices, icon: FileText, color: "text-primary" },
    { label: "Paid", value: paid, icon: CheckCircle2, color: "text-success" },
    { label: "Pending", value: pending, icon: Clock, color: "text-warning" },
    { label: "Revenue", value: `$${revenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card neon-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="rounded-xl bg-card neon-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Recent Invoices
          </h2>
          <Link
            to="/dashboard/history"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left px-5 py-3 font-medium">Invoice</th>
                <th className="text-left px-5 py-3 font-medium">Cliente</th>
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
                <th className="text-right px-5 py-3 font-medium">Monto</th>
                <th className="text-center px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-foreground">{inv.id}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{inv.clientName}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{inv.date}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground text-right font-medium">
                    ${inv.total.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                        inv.status === "paid"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {inv.status === "paid" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {inv.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
