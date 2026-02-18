import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import ThemeToggle from '../components/ThemeToggle';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { connected, isConnecting, error, connect } = useWalletStore();
  const [walletError, setWalletError] = useState<string | null>(null);

  const handleFreelancer = async () => {
    if (connected) {
      navigate('/dashboard');
      return;
    }

    setWalletError(null);
    try {
      await connect();
      navigate('/dashboard');
    } catch (err: any) {
      setWalletError(err.message || 'Failed to connect wallet');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-3xl animate-in">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-primary-foreground text-xl font-bold font-display">S</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground font-display mb-2">Link2Pay</h1>
          <p className="text-muted-foreground text-sm">
            Instant invoicing & payments on the Stellar network
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Freelancer Card */}
          <button
            onClick={handleFreelancer}
            disabled={isConnecting}
            className="glass-card group p-8 text-left transition-all duration-300 hover:scale-[1.02] neon-border hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground font-display mb-2">Freelancer</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create and send invoices, track payments, and manage your business — all powered by your Stellar wallet.
            </p>
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting wallet...
                </span>
              ) : (
                <>
                  Connect Wallet & Enter
                  <span className="transition-transform group-hover:translate-x-1">{'→'}</span>
                </>
              )}
            </div>
          </button>

          {/* Client Card */}
          <button
            onClick={() => navigate('/client')}
            className="glass-card group p-8 text-left transition-all duration-300 hover:scale-[1.02] neon-border hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground font-display mb-2">Client</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pay an invoice using a link or code shared by your freelancer. Quick, secure, and borderless.
            </p>
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              Pay an Invoice
              <span className="transition-transform group-hover:translate-x-1">{'→'}</span>
            </div>
          </button>
        </div>

        {/* Error */}
        {(walletError || error) && (
          <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center max-w-md mx-auto">
            {walletError || error}
          </div>
        )}
      </div>
    </div>
  );
}
