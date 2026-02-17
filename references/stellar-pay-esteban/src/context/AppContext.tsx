import { createContext, useContext, useState, ReactNode } from "react";

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  companyName: string;
  companyEmail: string;
  company: string;
  description: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "paid" | "pending";
  payLink: string;
  payerWallet?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  wallet: string;
}

interface AppState {
  isConnected: boolean;
  walletAddress: string;
  plan: string | null;
  invoices: Invoice[];
  clients: Client[];
  connectWallet: () => void;
  disconnectWallet: () => void;
  selectPlan: (plan: string) => void;
  addInvoice: (invoice: Omit<Invoice, "id" | "payLink" | "status">) => Invoice;
  addClient: (client: Omit<Client, "id">) => Client;
  markInvoicePaid: (id: string, payerWallet: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const sampleClients: Client[] = [
  { id: "c1", name: "Alice Johnson", email: "alice@acme.com", company: "Acme Corp", wallet: "GALICE...TESTW1" },
  { id: "c2", name: "Bob Smith", email: "bob@globex.io", company: "Globex Inc", wallet: "GBOB...TESTW2" },
];

const sampleInvoices: Invoice[] = [
  {
    id: "inv-001",
    clientName: "Alice Johnson",
    clientEmail: "alice@acme.com",
    clientCompany: "Acme Corp",
    companyName: "My Studio",
    companyEmail: "me@mystudio.com",
    company: "My Studio LLC",
    description: "Website redesign project",
    date: "2026-02-01",
    items: [
      { name: "Design", quantity: 1, price: 2000 },
      { name: "Development", quantity: 1, price: 3000 },
    ],
    total: 5000,
    status: "paid",
    payLink: "https://link2pay.app/pay/inv-001",
    payerWallet: "GBXYZ...TESTPAYER",
  },
  {
    id: "inv-002",
    clientName: "Bob Smith",
    clientEmail: "bob@globex.io",
    clientCompany: "Globex Inc",
    companyName: "My Studio",
    companyEmail: "me@mystudio.com",
    company: "My Studio LLC",
    description: "Monthly consulting",
    date: "2026-02-10",
    items: [
      { name: "Consulting hours", quantity: 20, price: 150 },
    ],
    total: 3000,
    status: "pending",
    payLink: "https://link2pay.app/pay/inv-002",
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(sampleInvoices);
  const [clients, setClients] = useState<Client[]>(sampleClients);

  const connectWallet = () => {
    setIsConnected(true);
    setWalletAddress("GTEST..." + generateId().toUpperCase());
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setPlan(null);
  };

  const selectPlan = (p: string) => {
    setPlan(p);
  };

  const addInvoice = (invoice: Omit<Invoice, "id" | "payLink" | "status">) => {
    const id = "inv-" + generateId();
    const newInvoice: Invoice = {
      ...invoice,
      id,
      status: "pending",
      payLink: `https://link2pay.app/pay/${id}`,
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    // Auto-add client if new
    const existing = clients.find(
      (c) => c.email === invoice.clientEmail
    );
    if (!existing) {
      addClient({
        name: invoice.clientName,
        email: invoice.clientEmail,
        company: invoice.clientCompany,
        wallet: "",
      });
    }

    return newInvoice;
  };

  const addClient = (client: Omit<Client, "id">) => {
    const newClient: Client = { ...client, id: "c-" + generateId() };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const markInvoicePaid = (id: string, payerWallet: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "paid" as const, payerWallet } : inv
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        isConnected,
        walletAddress,
        plan,
        invoices,
        clients,
        connectWallet,
        disconnectWallet,
        selectPlan,
        addInvoice,
        addClient,
        markInvoicePaid,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
