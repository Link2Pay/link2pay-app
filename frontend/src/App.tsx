import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './components/Invoice/InvoiceList';
import InvoiceDetail from './components/Invoice/InvoiceDetail';
import PaymentFlow from './components/Payment/PaymentFlow';
import MarketingLayout from './components/marketing/MarketingLayout';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import RoleSelect from './pages/RoleSelect';
import Register from './pages/Register';
import ClientInvoiceLookup from './pages/ClientInvoiceLookup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function LegacyInvoiceRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/dashboard/invoices/${id}` : '/dashboard/invoices'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Role selection (gateway to dashboard) */}
          <Route path="/get-started" element={<RoleSelect />} />

          {/* Client invoice lookup */}
          <Route path="/client" element={<ClientInvoiceLookup />} />

          {/* Freelancer registration */}
          <Route path="/register" element={<Register />} />

          {/* Public payment page (no sidebar layout) */}
          <Route path="/pay/:id" element={<PaymentFlow />} />

          {/* Public marketing pages */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* App routes with sidebar layout */}
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="create" element={<CreateInvoice />} />
          </Route>

          {/* Backward-compatible redirects */}
          <Route path="/invoices" element={<Navigate to="/dashboard/invoices" replace />} />
          <Route path="/invoices/:id" element={<LegacyInvoiceRedirect />} />
          <Route path="/create" element={<Navigate to="/dashboard/create" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
