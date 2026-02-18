import { Link, Outlet, useLocation } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import WalletConnect from './Wallet/WalletConnect';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'D' },
  { path: '/dashboard/clients', label: 'Clients', icon: 'C' },
  { path: '/dashboard/invoices', label: 'Invoices', icon: 'I' },
  { path: '/dashboard/create', label: 'Create Invoice', icon: '+' },
];

export default function Layout() {
  const location = useLocation();
  const { connected } = useWalletStore();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed z-10 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-6 py-5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <h1 className="leading-none text-base font-semibold text-foreground">Link2Pay</h1>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice Platform</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sidebar-accent text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  }`}
                >
                  <span className={`text-base ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            Stellar Testnet
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-8 py-3 backdrop-blur-md">
          <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
            Back to site
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <WalletConnect />
          </div>
        </header>

        <div className="max-w-5xl px-8 py-6">
          {connected ? (
            <Outlet />
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="max-w-md text-center animate-in">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="text-3xl text-primary">S</span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">Connect Your Wallet</h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Connect your Freighter wallet to start creating invoices and receiving payments on
                  Stellar.
                </p>
                <WalletConnect variant="large" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
