import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Transactions from './pages/Transactions';
import ApiKeys from './pages/ApiKeys';
import Analytics from './pages/Analytics';
import CreateInvoice from './pages/CreateInvoice';
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
import Register from './pages/Register';
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
  return <Navigate to={id ? `/dashboard/links/${id}` : '/dashboard/links'} replace />;
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
          {/* Role selection (gateway to app) */}
          <Route path="/app" element={<RoleSelect />} />

          {/* Checkout lookup */}
          <Route path="/checkout" element={<ClientInvoiceLookup />} />

          {/* Freelancer registration */}
          <Route path="/register" element={<Register />} />

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
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="links" element={<InvoiceList />} />
            <Route path="links/:id" element={<InvoiceDetail />} />
            <Route path="api-keys" element={<ApiKeys />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile-options" element={<Navigate to="/dashboard" replace />} />
            <Route path="create-link" element={<CreateInvoice />} />

            {/* Backward-compatible nested redirects */}
            <Route path="invoices" element={<Navigate to="/dashboard/links" replace />} />
            <Route path="invoices/:id" element={<LegacyInvoiceRedirect />} />
            <Route path="create" element={<Navigate to="/dashboard/create-link" replace />} />
          </Route>

          {/* Backward-compatible redirects */}
          <Route path="/features" element={<Navigate to="/payment-links" replace />} />
          <Route path="/developers" element={<Navigate to="/sdk" replace />} />
          <Route path="/pricing" element={<Navigate to="/plans" replace />} />
          <Route path="/about" element={<Navigate to="/why-link2pay" replace />} />
          <Route path="/get-started" element={<Navigate to="/app" replace />} />
          <Route path="/payer" element={<Navigate to="/checkout" replace />} />
          <Route path="/client" element={<Navigate to="/checkout" replace />} />
          <Route path="/invoices" element={<Navigate to="/dashboard/links" replace />} />
          <Route path="/invoices/:id" element={<LegacyInvoiceRedirect />} />
          <Route path="/create" element={<Navigate to="/dashboard/create-link" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <SpeedInsights />
    </QueryClientProvider>
  );
}
