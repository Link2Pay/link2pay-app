import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  title: string;
  subtitle: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputHint: string;
  invalidInvoiceId: string;
  viewInvoice: string;
  backHome: string;
}> = {
  en: {
    title: 'Pay an Invoice',
    subtitle: 'Paste the payment link or invoice ID shared by your freelancer',
    inputLabel: 'Payment URL or Invoice ID',
    inputPlaceholder: 'https://link2pay.vercel.app/pay/abc123 or abc123',
    inputHint: 'Paste the full URL from your invoice email, or enter the invoice ID directly.',
    invalidInvoiceId: 'Could not find an invoice ID. Please paste a valid payment URL or invoice ID.',
    viewInvoice: 'View Invoice',
    backHome: 'Back to home',
  },
  es: {
    title: 'Pagar una factura',
    subtitle: 'Pega el link de pago o el ID de factura compartido por tu freelancer',
    inputLabel: 'URL de pago o ID de factura',
    inputPlaceholder: 'https://link2pay.vercel.app/pay/abc123 o abc123',
    inputHint: 'Pega la URL completa del email de factura o ingresa el ID directamente.',
    invalidInvoiceId: 'No se pudo encontrar un ID de factura. Pega una URL o ID valido.',
    viewInvoice: 'Ver factura',
    backHome: 'Volver al inicio',
  },
  pt: {
    title: 'Pagar uma fatura',
    subtitle: 'Cole o link de pagamento ou ID da fatura enviado pelo freelancer',
    inputLabel: 'URL de pagamento ou ID da fatura',
    inputPlaceholder: 'https://link2pay.vercel.app/pay/abc123 ou abc123',
    inputHint: 'Cole a URL completa do email da fatura ou informe o ID diretamente.',
    invalidInvoiceId: 'Nao foi possivel encontrar um ID de fatura. Cole uma URL ou ID valido.',
    viewInvoice: 'Ver fatura',
    backHome: 'Voltar ao inicio',
  },
};

export default function ClientInvoiceLookup() {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[language];

  const parseInvoiceId = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const urlMatch = trimmed.match(/\/pay\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];

    if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const invoiceId = parseInvoiceId(input);
    if (!invoiceId) {
      setError(copy.invalidInvoiceId);
      return;
    }

    navigate(`/pay/${invoiceId}`);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="fixed right-4 top-4 z-20 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-lg font-bold font-display">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display mb-1">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{copy.inputLabel}</label>
              <input
                type="text"
                className="input font-mono text-sm"
                placeholder={copy.inputPlaceholder}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">{copy.inputHint}</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" className="btn-primary w-full py-3 text-base">
              {copy.viewInvoice}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {'<-'} {copy.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
