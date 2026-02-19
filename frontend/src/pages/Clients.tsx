import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin, Plus, Search, Star, Users, X } from 'lucide-react';
import { listSavedClients, saveClient, updateClientFavorite } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';
import { useWalletStore } from '../store/walletStore';
import type { SavedClient } from '../types';
import type { Language } from '../i18n/translations';

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

const COPY: Record<Language, {
  loadingClients: string;
  title: string;
  subtitle: string;
  close: string;
  addClient: string;
  newClient: string;
  clientName: string;
  clientEmail: string;
  company: string;
  address: string;
  clientNamePlaceholder: string;
  clientEmailPlaceholder: string;
  optional: string;
  markAsFavorite: string;
  saving: string;
  saveClient: string;
  searchPlaceholder: string;
  search: string;
  clear: string;
  noClientsSearch: string;
  noClientsEmpty: string;
  removeFavorite: string;
  markFavorite: string;
  useInInvoice: string;
  failedLoadClients: string;
  failedSaveClient: string;
  failedUpdateFavorite: string;
}> = {
  en: {
    loadingClients: 'Loading clients...',
    title: 'Clients',
    subtitle: 'Save, search, and reuse your clients while creating invoices.',
    close: 'Close',
    addClient: 'Add Client',
    newClient: 'New Client',
    clientName: 'Client Name',
    clientEmail: 'Client Email',
    company: 'Company',
    address: 'Address',
    clientNamePlaceholder: 'Client name',
    clientEmailPlaceholder: 'client@example.com',
    optional: 'Optional',
    markAsFavorite: 'Mark as favorite',
    saving: 'Saving...',
    saveClient: 'Save Client',
    searchPlaceholder: 'Search by name, email, company, or address',
    search: 'Search',
    clear: 'Clear',
    noClientsSearch: 'No clients found for your search.',
    noClientsEmpty: 'No clients yet. Add one now or save clients while creating invoices.',
    removeFavorite: 'Remove favorite',
    markFavorite: 'Mark as favorite',
    useInInvoice: 'Use in Invoice',
    failedLoadClients: 'Failed to load clients',
    failedSaveClient: 'Failed to save client',
    failedUpdateFavorite: 'Failed to update favorite',
  },
  es: {
    loadingClients: 'Cargando clientes...',
    title: 'Clientes',
    subtitle: 'Guarda, busca y reutiliza clientes al crear facturas.',
    close: 'Cerrar',
    addClient: 'Agregar cliente',
    newClient: 'Nuevo cliente',
    clientName: 'Nombre del cliente',
    clientEmail: 'Email del cliente',
    company: 'Empresa',
    address: 'Direccion',
    clientNamePlaceholder: 'Nombre del cliente',
    clientEmailPlaceholder: 'cliente@email.com',
    optional: 'Opcional',
    markAsFavorite: 'Marcar como favorito',
    saving: 'Guardando...',
    saveClient: 'Guardar cliente',
    searchPlaceholder: 'Buscar por nombre, email, empresa o direccion',
    search: 'Buscar',
    clear: 'Limpiar',
    noClientsSearch: 'No se encontraron clientes para tu busqueda.',
    noClientsEmpty: 'Aun no hay clientes. Agrega uno o guardalos al crear facturas.',
    removeFavorite: 'Quitar favorito',
    markFavorite: 'Marcar favorito',
    useInInvoice: 'Usar en factura',
    failedLoadClients: 'No se pudieron cargar los clientes',
    failedSaveClient: 'No se pudo guardar el cliente',
    failedUpdateFavorite: 'No se pudo actualizar favorito',
  },
  pt: {
    loadingClients: 'Carregando clientes...',
    title: 'Clientes',
    subtitle: 'Salve, busque e reutilize clientes ao criar faturas.',
    close: 'Fechar',
    addClient: 'Adicionar cliente',
    newClient: 'Novo cliente',
    clientName: 'Nome do cliente',
    clientEmail: 'Email do cliente',
    company: 'Empresa',
    address: 'Endereco',
    clientNamePlaceholder: 'Nome do cliente',
    clientEmailPlaceholder: 'cliente@email.com',
    optional: 'Opcional',
    markAsFavorite: 'Marcar como favorito',
    saving: 'Salvando...',
    saveClient: 'Salvar cliente',
    searchPlaceholder: 'Buscar por nome, email, empresa ou endereco',
    search: 'Buscar',
    clear: 'Limpar',
    noClientsSearch: 'Nenhum cliente encontrado para sua busca.',
    noClientsEmpty: 'Ainda nao ha clientes. Adicione agora ou salve ao criar faturas.',
    removeFavorite: 'Remover favorito',
    markFavorite: 'Marcar favorito',
    useInInvoice: 'Usar na fatura',
    failedLoadClients: 'Falha ao carregar clientes',
    failedSaveClient: 'Falha ao salvar cliente',
    failedUpdateFavorite: 'Falha ao atualizar favorito',
  },
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
  const { language } = useI18n();
  const copy = COPY[language];

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
      .catch((err: any) => setError(err.message || copy.failedLoadClients))
      .finally(() => setLoading(false));
  }, [publicKey, copy.failedLoadClients]);

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
      setError(err.message || copy.failedSaveClient);
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
      setError(err.message || copy.failedUpdateFavorite);
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
    return <div className="py-20 text-center text-sm text-muted-foreground">{copy.loadingClients}</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowClientForm((prev) => !prev);
            setError(null);
          }}
          className="btn-primary w-full text-sm sm:w-auto"
        >
          {showClientForm ? (
            <>
              <X className="h-4 w-4" />
              {copy.close}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {copy.addClient}
            </>
          )}
        </button>
      </div>

      {showClientForm && (
        <form onSubmit={handleAddClient} className="card space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{copy.newClient}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">{copy.clientName}</label>
              <input
                className="input"
                value={clientForm.name}
                onChange={(event) => handleClientField('name', event.target.value)}
                placeholder={copy.clientNamePlaceholder}
                required
              />
            </div>
            <div>
              <label className="label">{copy.clientEmail}</label>
              <input
                type="email"
                className="input"
                value={clientForm.email}
                onChange={(event) => handleClientField('email', event.target.value)}
                placeholder={copy.clientEmailPlaceholder}
                required
              />
            </div>
            <div>
              <label className="label">{copy.company}</label>
              <input
                className="input"
                value={clientForm.company}
                onChange={(event) => handleClientField('company', event.target.value)}
                placeholder={copy.optional}
              />
            </div>
            <div>
              <label className="label">{copy.address}</label>
              <input
                className="input"
                value={clientForm.address}
                onChange={(event) => handleClientField('address', event.target.value)}
                placeholder={copy.optional}
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={clientForm.isFavorite}
              onChange={(event) => handleClientField('isFavorite', event.target.checked)}
            />
            {copy.markAsFavorite}
          </label>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary text-sm" disabled={savingClient}>
              {savingClient ? copy.saving : copy.saveClient}
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
            placeholder={copy.searchPlaceholder}
          />
        </div>
        <button type="submit" className="btn-secondary w-full text-sm sm:w-auto">
          <Search className="h-4 w-4" />
          {copy.search}
        </button>
        {searchQuery && (
          <button type="button" onClick={handleClearSearch} className="btn-ghost w-full text-sm sm:w-auto">
            {copy.clear}
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
            {searchQuery ? copy.noClientsSearch : copy.noClientsEmpty}
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
                  title={client.isFavorite ? copy.removeFavorite : copy.markFavorite}
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
                <Link to={`/dashboard/create?client=${client.id}`} className="btn-secondary px-2.5 py-1.5 text-xs">
                  {copy.useInInvoice}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
