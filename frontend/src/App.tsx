import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Transactions from './pages/Transactions';
import ApiKeys from './pages/ApiKeys';
import Analytics from './pages/Analytics';
import CreateInvoice from './pages/CreateInvoice';
import Projects from './pages/Projects';
import Webhooks from './pages/Webhooks';
import ExportsLogs from './pages/ExportsLogs';
import Team from './pages/Team';
import Branding from './pages/Branding';
import Billing from './pages/Billing';
import InvoiceList from './components/Invoice/InvoiceList';
import InvoiceDetail from './components/Invoice/InvoiceDetail';
import PaymentFlow from './components/Payment/PaymentFlow';
import MarketingLayout from './components/marketing/MarketingLayout';
import Home from './pages/Home';
import Features from './pages/Features';
import SDK from './pages/SDK';
import Pricing from './pages/Pricing';
import About from './pages/About';
import RoleSelect from './pages/RoleSelect';
import ProfileOptions from './pages/ProfileOptions';
import ClientInvoiceLookup from './pages/ClientInvoiceLookup';
import { useWalletRestore } from './hooks/useWalletRestore';

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
  return <Navigate to={id ? `/app/links/${id}` : '/app/links'} replace />;
}

function LegacyDashboardRedirect() {
  const location = useLocation();
  const mappedPath = location.pathname.replace(/^\/dashboard/, '/app');
  return <Navigate to={`${mappedPath}${location.search}${location.hash}`} replace />;
}

export default function App() {
  useWalletRestore();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '13px' },
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Login route */}
          <Route path="/app/login" element={<RoleSelect />} />
          <Route path="/login" element={<Navigate to="/app/login" replace />} />

          {/* Checkout lookup */}
          <Route path="/checkout" element={<ClientInvoiceLookup />} />

          {/* Legacy registration route */}
          <Route path="/register" element={<Navigate to="/app/login" replace />} />

          {/* Public payment page (no sidebar layout) */}
          <Route path="/pay/:id" element={<PaymentFlow />} />
          <Route path="/links/:id" element={<PaymentFlow />} />

          {/* Public marketing pages */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/payment-links" element={<Features />} />
            <Route path="/sdk" element={<SDK />} />
            <Route path="/plans" element={<Pricing />} />
            <Route path="/why-link2pay" element={<About />} />
          </Route>

          {/* App routes with sidebar layout */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="links" element={<InvoiceList />} />
            <Route path="links/:id" element={<InvoiceDetail />} />
            <Route path="api-keys" element={<ApiKeys />} />
            <Route path="projects" element={<Projects />} />
            <Route path="webhooks" element={<Webhooks />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="exports-logs" element={<ExportsLogs />} />
            <Route path="team" element={<Team />} />
            <Route path="branding" element={<Branding />} />
            <Route path="billing" element={<Billing />} />
            <Route path="profile-options" element={<ProfileOptions />} />
            <Route path="create-link" element={<CreateInvoice />} />

            {/* Backward-compatible nested redirects */}
            <Route path="invoices" element={<Navigate to="/app/links" replace />} />
            <Route path="invoices/:id" element={<LegacyInvoiceRedirect />} />
            <Route path="create" element={<Navigate to="/app/create-link" replace />} />
          </Route>

          {/* Legacy dashboard path mapping */}
          <Route path="/dashboard/*" element={<LegacyDashboardRedirect />} />

          {/* Backward-compatible redirects */}
          <Route path="/features" element={<Navigate to="/payment-links" replace />} />
          <Route path="/developers" element={<Navigate to="/sdk" replace />} />
          <Route path="/pricing" element={<Navigate to="/plans" replace />} />
          <Route path="/about" element={<Navigate to="/why-link2pay" replace />} />
          <Route path="/get-started" element={<Navigate to="/app/login" replace />} />
          <Route path="/payer" element={<Navigate to="/checkout" replace />} />
          <Route path="/client" element={<Navigate to="/checkout" replace />} />
          <Route path="/invoices" element={<Navigate to="/app/links" replace />} />
          <Route path="/invoices/:id" element={<LegacyInvoiceRedirect />} />
          <Route path="/create" element={<Navigate to="/app/create-link" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
