import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useWalletRestore } from './hooks/useWalletRestore';

// Layout shells are loaded eagerly — they're tiny and needed immediately
import Layout from './components/Layout';
import MarketingLayout from './components/marketing/MarketingLayout';

// All page/feature components are lazy-loaded per route
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const InvoiceList = lazy(() => import('./components/Invoice/InvoiceList'));
const InvoiceDetail = lazy(() => import('./components/Invoice/InvoiceDetail'));
const PaymentFlow = lazy(() => import('./components/Payment/PaymentFlow'));
const Home = lazy(() => import('./pages/Home'));
const Features = lazy(() => import('./pages/Features'));
const SDK = lazy(() => import('./pages/SDK'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const RoleSelect = lazy(() => import('./pages/RoleSelect'));
const Register = lazy(() => import('./pages/Register'));
const ClientInvoiceLookup = lazy(() => import('./pages/ClientInvoiceLookup'));
const Login = lazy(() => import('./pages/Login'));
const ProfileOptions = lazy(() => import('./pages/ProfileOptions'));
const GetPaid = lazy(() => import('./pages/GetPaid'));
const Wallet = lazy(() => import('./pages/Wallet'));
const ScanHandoff = lazy(() => import('./pages/ScanHandoff'));

// Preview solo-dev del checkout. La condición `import.meta.env.DEV` deja este
// lazy import en una rama muerta en el build de producción, así que ni el chunk
// ni los fixtures (`src/dev/*`) se empaquetan.
const CheckoutPreviewIndex = import.meta.env.DEV
  ? lazy(() => import('./dev/CheckoutPreviewIndex'))
  : null;

// Preview solo-dev del detalle de link (InvoiceDetail con datos mock). Mismo
// guard que arriba → excluido del build de producción.
const LinkPreviewIndex = import.meta.env.DEV
  ? lazy(() => import('./dev/LinkPreviewIndex'))
  : null;

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
        position="bottom-right"
        toastOptions={{
          // Theming con tokens del sistema (CSS vars resuelven contra el root
          // temado, así el toast sigue light/dark automáticamente).
          duration: 4000,
          style: {
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '13px',
            boxShadow: '0 8px 24px hsl(240 6% 10% / .10), 0 2px 6px hsl(240 6% 10% / .06)',
          },
          success: {
            duration: 3000,
            iconTheme: { primary: 'hsl(var(--success))', secondary: 'hsl(var(--success-subtle))' },
          },
          error: {
            duration: 5000,
            iconTheme: { primary: 'hsl(var(--destructive))', secondary: 'hsl(var(--destructive-subtle))' },
          },
        }}
      />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Role selection (gateway to app) */}
          <Route path="/app" element={<RoleSelect />} />

          {/* Checkout lookup */}
          <Route path="/checkout" element={<ClientInvoiceLookup />} />

          {/* Freelancer registration */}
          <Route path="/register" element={<Register />} />

          {/* Public payment page (no sidebar layout) */}
          <Route path="/pay/:id" element={<PaymentFlow />} />
          <Route path="/links/:id" element={<PaymentFlow />} />

          {/* Public Bre-B scan handoff (phone side, no login) */}
          <Route path="/scan/:token" element={<ScanHandoff />} />

          {/* Índice de preview del checkout — solo desarrollo. */}
          {import.meta.env.DEV && CheckoutPreviewIndex && (
            <Route path="/dev/checkout" element={<CheckoutPreviewIndex />} />
          )}

          {/* Preview del detalle de link — solo desarrollo. Fuera del guard de
              <Layout>, renderiza el InvoiceDetail real con datos mock. */}
          {import.meta.env.DEV && LinkPreviewIndex && (
            <Route path="/dev/links" element={<LinkPreviewIndex />} />
          )}
          {import.meta.env.DEV && (
            <Route element={<Layout />}>
              <Route path="/dev/links/:id" element={<InvoiceDetail />} />
            </Route>
          )}

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
            <Route path="get-paid" element={<GetPaid />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="api-keys" element={<Navigate to="/dashboard" replace />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile-options" element={<ProfileOptions />} />
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
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
