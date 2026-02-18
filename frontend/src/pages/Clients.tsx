import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin, Plus, Search, Star, Users, X } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { listSavedClients, saveClient, updateClientFavorite } from '../services/api';
import type { SavedClient } from '../types';

interface ClientFormState {
  name: string;
  email: string;
  company: string;
  address: string;
  isFavorite: boolean;
}

const initialClientForm: ClientFormState = {
  name: '',
  email: '',
  company: '',
  address: '',
  isFavorite: false,
};

function sortClients(clients: SavedClient[]): SavedClient[] {
  return [...clients].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function matchesSearch(client: SavedClient, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  return (
    client.name.toLowerCase().includes(q) ||
    client.email.toLowerCase().includes(q) ||
    (client.company ?? '').toLowerCase().includes(q) ||
    (client.address ?? '').toLowerCase().includes(q)
  );
}

export default function ClientsPage() {
  const { publicKey } = useWalletStore();
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState<ClientFormState>(initialClientForm);
  const [savingClient, setSavingClient] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    listSavedClients(publicKey)
      .then((clients) => setSavedClients(sortClients(clients)))
      .catch((err: any) => setError(err.message || 'Failed to load clients'))
      .finally(() => setLoading(false));
  }, [publicKey]);

  const filteredClients = useMemo(
    () => savedClients.filter((client) => matchesSearch(client, searchQuery)),
    [savedClients, searchQuery]
  );

  const handleClientField = (field: keyof ClientFormState, value: string | boolean) => {
    setClientForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddClient = async (event: FormEvent) => {
    event.preventDefault();
    if (!publicKey) return;

    setSavingClient(true);
    setError(null);

    try {
      const saved = await saveClient(
        {
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          company: clientForm.company.trim() || undefined,
          address: clientForm.address.trim() || undefined,
          isFavorite: clientForm.isFavorite,
        },
        publicKey
      );

      setSavedClients((prev) => sortClients([saved, ...prev.filter((client) => client.id !== saved.id)]));
      setClientForm(initialClientForm);
      setShowClientForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save client');
    } finally {
      setSavingClient(false);
    }
  };

  const toggleFavorite = async (client: SavedClient) => {
    if (!publicKey) return;

    setError(null);

    try {
      const updated = await updateClientFavorite(client.id, !client.isFavorite, publicKey);
      setSavedClients((prev) =>
        sortClients(prev.map((item) => (item.id === updated.id ? updated : item)))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update favorite');
    }
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading clients...</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Clients</h2>
          <p className="text-sm text-muted-foreground">
            Save, search, and reuse your clients while creating invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowClientForm((prev) => !prev);
            setError(null);
          }}
          className="btn-primary text-sm"
        >
          {showClientForm ? (
            <>
              <X className="h-4 w-4" />
              Close
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Client
            </>
          )}
        </button>
      </div>

      {showClientForm && (
        <form onSubmit={handleAddClient} className="card space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">New Client</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Client Name</label>
              <input
                className="input"
                value={clientForm.name}
                onChange={(event) => handleClientField('name', event.target.value)}
                placeholder="Client name"
                required
              />
            </div>
            <div>
              <label className="label">Client Email</label>
              <input
                type="email"
                className="input"
                value={clientForm.email}
                onChange={(event) => handleClientField('email', event.target.value)}
                placeholder="client@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="input"
                value={clientForm.company}
                onChange={(event) => handleClientField('company', event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="label">Address</label>
              <input
                className="input"
                value={clientForm.address}
                onChange={(event) => handleClientField('address', event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={clientForm.isFavorite}
              onChange={(event) => handleClientField('isFavorite', event.target.checked)}
            />
            Mark as favorite
          </label>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary text-sm" disabled={savingClient}>
              {savingClient ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="input pl-10"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email, company, or address"
          />
        </div>
        <button type="submit" className="btn-secondary text-sm">
          <Search className="h-4 w-4" />
          Search
        </button>
        {searchQuery && (
          <button type="button" onClick={handleClearSearch} className="btn-ghost text-sm">
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {filteredClients.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'No clients found for your search.'
              : 'No clients yet. Add one now or save clients while creating invoices.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div key={client.id} className="card p-5 hover-glow">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{client.name}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{client.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(client)}
                  className="btn-ghost px-2 py-1"
                  title={client.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
                >
                  <Star
                    className={`h-4 w-4 ${client.isFavorite ? 'fill-current text-warning' : 'text-muted-foreground'}`}
                  />
                </button>
              </div>

              {client.company && (
                <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="truncate">{client.company}</span>
                </div>
              )}

              {client.address && (
                <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{client.address}</span>
                </div>
              )}

              <div className="flex items-center justify-end">
                <Link
                  to={`/dashboard/create?client=${client.id}`}
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                >
                  Use in Invoice
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
