import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';

export default function Register() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWalletStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  if (!connected || !publicKey) {
    navigate('/');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Registration backend TBD — for now just navigate to dashboard
    navigate('/dashboard');
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-lg font-bold font-display">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display mb-1">Welcome to Link2Pay</h1>
          <p className="text-sm text-muted-foreground">Set up your freelancer profile to get started</p>
        </div>

        <div className="card p-6">
          {/* Wallet info */}
          <div className="mb-6 p-3 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-muted-foreground">Connected as</span>
            </div>
            <p className="text-sm font-mono text-foreground mt-1">{truncateAddress(publicKey)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name <span className="text-destructive">*</span></label>
              <input
                type="text"
                className="input"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email <span className="text-destructive">*</span></label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                type="text"
                className="input"
                placeholder="Optional"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-base mt-2">
              Get Started
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip for now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
