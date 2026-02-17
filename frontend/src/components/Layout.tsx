import { Link, useLocation, Outlet } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import WalletConnect from './Wallet/WalletConnect';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◆' },
  { path: '/invoices', label: 'Invoices', icon: '▤' },
  { path: '/create', label: 'Create Invoice', icon: '+' },
];

export default function Layout() {
  const location = useLocation();
  const { connected } = useWalletStore();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-surface-3 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-surface-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stellar-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-ink-0 leading-none">
                StellarPay
              </h1>
              <span className="text-[10px] text-ink-3 uppercase tracking-wider">
                Invoice Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-stellar-50 text-stellar-700'
                      : 'text-ink-2 hover:bg-surface-1 hover:text-ink-0'
                  }`}
                >
                  <span className={`text-base ${isActive ? 'text-stellar-500' : 'text-ink-4'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Network Badge */}
        <div className="px-4 py-3 border-t border-surface-3">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            Stellar Testnet
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-surface-3 px-8 py-3 flex items-center justify-between">
          <div />
          <WalletConnect />
        </header>

        {/* Page Content */}
        <div className="px-8 py-6 max-w-5xl">
          {connected ? (
            <Outlet />
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-md animate-in">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-stellar-50 flex items-center justify-center">
                  <span className="text-3xl text-stellar-500">◆</span>
                </div>
                <h2 className="text-xl font-semibold text-ink-0 mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-ink-3 text-sm mb-6 leading-relaxed">
                  Connect your Freighter wallet to start creating invoices and
                  receiving instant payments on the Stellar network.
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
