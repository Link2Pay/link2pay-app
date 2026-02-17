import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { Users, Mail, Building2, Wallet, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

export default function ClientsPage() {
  const { clients, addClient } = useAppState();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [email, setEmail] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.wallet.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !wallet.trim()) {
      toast.error("Nombre y wallet son obligatorios");
      return;
    }
    addClient({ name: name.trim(), email: email.trim(), company: "", wallet: wallet.trim() });
    toast.success("Cliente agregado");
    setName("");
    setWallet("");
    setEmail("");
    setShowForm(false);
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancelar" : "Agregar Cliente"}
        </button>
      </div>

      {/* Add client form */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl bg-card neon-border p-5 mb-6">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">Nuevo Cliente</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div>
              <label className={labelClass}>Wallet pública *</label>
              <input className={inputClass} value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="G..." />
            </div>
            <div>
              <label className={labelClass}>Email (opcional)</label>
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Guardar Cliente
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o wallet..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card neon-border p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? "No se encontraron clientes." : "No hay clientes aún. Agrega uno manualmente o se crearán al generar invoices."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div key={client.id} className="rounded-xl bg-card neon-border p-5 hover:neon-border-strong transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{client.name}</h3>
                  {client.email && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{client.email}</span>
                    </div>
                  )}
                  {client.company && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{client.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Wallet className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate font-mono">{client.wallet}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
