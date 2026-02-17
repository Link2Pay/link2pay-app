import { useAppState } from "@/context/AppContext";
import { CheckCircle2, Clock, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function InvoiceHistoryPage() {
  const { invoices } = useAppState();

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Historial de Invoices</h1>

      <div className="rounded-xl bg-card neon-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left px-5 py-3 font-medium">Invoice</th>
                <th className="text-left px-5 py-3 font-medium">Cliente</th>
                <th className="text-left px-5 py-3 font-medium">Fecha</th>
                <th className="text-right px-5 py-3 font-medium">Monto</th>
                <th className="text-center px-5 py-3 font-medium">Estado</th>
                <th className="text-center px-5 py-3 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No hay invoices aún. ¡Crea tu primer invoice!
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-foreground">{inv.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-foreground">{inv.clientName}</div>
                      <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>
                    </td>
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
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => copyLink(inv.payLink)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
