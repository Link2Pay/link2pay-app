import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ClientInvoiceLookup() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseInvoiceId = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Try to extract from URL patterns like http://*/pay/ID or /pay/ID
    const urlMatch = trimmed.match(/\/pay\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];

    // If it looks like a plain ID (no slashes, no spaces), accept it directly
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const invoiceId = parseInvoiceId(input);
    if (!invoiceId) {
      setError('Could not find an invoice ID. Please paste a valid payment URL or invoice ID.');
      return;
    }

    navigate(`/pay/${invoiceId}`);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-lg font-bold font-display">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display mb-1">Pay an Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Paste the payment link or invoice ID shared by your freelancer
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Payment URL or Invoice ID</label>
              <input
                type="text"
                className="input font-mono text-sm"
                placeholder="https://link2pay.vercel.app/pay/abc123 or abc123"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(null); }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Paste the full URL from your invoice email, or enter the invoice ID directly.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full py-3 text-base">
              View Invoice
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {'←'} Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
