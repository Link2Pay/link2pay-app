import { useState } from "react";
import { useAppState, Client } from "@/context/AppContext";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function CreateInvoicePage() {
  const { addInvoice, clients } = useAppState();
  const [copied, setCopied] = useState(false);
  const [createdLink, setCreatedLink] = useState("");

  // Company info
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [company, setCompany] = useState("");

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientWallet, setClientWallet] = useState("");
  const [selectedClient, setSelectedClient] = useState("");

  // Invoice details
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Items
  const [items, setItems] = useState([{ name: "", quantity: 1, price: 0 }]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const addItem = () => setItems([...items, { name: "", quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const fillClient = (clientId: string) => {
    setSelectedClient(clientId);
    const c = clients.find((c) => c.id === clientId);
    if (c) {
      setClientName(c.name);
      setClientEmail(c.email);
      setClientCompany(c.company);
      setClientWallet(c.wallet);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !clientName || items.some((i) => !i.name)) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }
    const invoice = addInvoice({
      companyName,
      companyEmail,
      company,
      clientName,
      clientEmail,
      clientCompany,
      description,
      date,
      items,
      total: subtotal,
    });
    setCreatedLink(invoice.payLink);
    toast.success("Invoice creado exitosamente");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdLink) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          ¡Invoice Creado!
        </h1>
        <p className="text-muted-foreground mb-6">
          Comparte este link con tu cliente para recibir el pago.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted neon-border">
          <span className="flex-1 text-sm font-mono text-foreground truncate">{createdLink}</span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <button
          onClick={() => {
            setCreatedLink("");
            setCompanyName("");
            setCompanyEmail("");
            setCompany("");
            setClientName("");
            setClientEmail("");
            setClientCompany("");
            setClientWallet("");
            setDescription("");
            setItems([{ name: "", quantity: 1, price: 0 }]);
            setSelectedClient("");
          }}
          className="mt-6 text-sm text-primary hover:text-primary/80"
        >
          Crear otro invoice
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Crear Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Info */}
        <section className="rounded-xl bg-card neon-border p-5">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">
            Información de tu empresa
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div>
              <label className={labelClass}>Compañía</label>
              <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Tu compañía" />
            </div>
          </div>
        </section>

        {/* Client Info */}
        <section className="rounded-xl bg-card neon-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">
              Información del cliente
            </h2>
            {clients.length > 0 && (
              <select
                value={selectedClient}
                onChange={(e) => fillClient(e.target.value)}
                className="text-xs px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground"
              >
                <option value="">Cliente existente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input className={inputClass} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="cliente@email.com" />
            </div>
            <div>
              <label className={labelClass}>Compañía</label>
              <input className={inputClass} value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Compañía del cliente" />
            </div>
            <div>
              <label className={labelClass}>Wallet pública</label>
              <input className={inputClass} value={clientWallet} onChange={(e) => setClientWallet(e.target.value)} placeholder="G..." />
            </div>
          </div>
        </section>

        {/* Invoice Details */}
        <section className="rounded-xl bg-card neon-border p-5">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">
            Detalles del invoice
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Descripción</label>
              <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción del servicio" />
            </div>
            <div>
              <label className={labelClass}>Fecha</label>
              <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="rounded-xl bg-card neon-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">Ítems</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar ítem
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs text-muted-foreground font-medium px-1">
              <div className="col-span-5">Ítem</div>
              <div className="col-span-2">Cantidad</div>
              <div className="col-span-3">Precio</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <input
                    className={inputClass}
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    placeholder="Descripción"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="text-sm font-mono text-foreground">
                    ${(item.quantity * item.price).toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-4">Total</span>
              <span className="font-display text-xl font-bold text-foreground">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Generar Invoice y Link de Pago
        </button>
      </form>
    </div>
  );
}
