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
    title: 'Open Payment Link',
    subtitle: 'Paste the checkout URL or payment link ID',
    inputLabel: 'Checkout URL or Link ID',
    inputPlaceholder: 'https://link2pay.vercel.app/pay/abc123 or abc123',
    inputHint: 'Paste the full checkout URL or enter the link ID directly.',
    invalidInvoiceId: 'Could not find a link ID. Please paste a valid checkout URL or link ID.',
    viewInvoice: 'Open Checkout',
    backHome: 'Back to home',
  },
  es: {
    title: 'Abrir link de pago',
    subtitle: 'Pega la URL de checkout o el ID del link de pago',
    inputLabel: 'URL de checkout o ID del link',
    inputPlaceholder: 'https://link2pay.vercel.app/pay/abc123 o abc123',
    inputHint: 'Pega la URL completa del checkout o ingresa el ID del link.',
    invalidInvoiceId: 'No se pudo encontrar un ID de link. Pega una URL o ID valido.',
    viewInvoice: 'Abrir checkout',
    backHome: 'Volver al inicio',
  },
  pt: {
    title: 'Abrir link de pagamento',
    subtitle: 'Cole a URL de checkout ou o ID do link de pagamento',
    inputLabel: 'URL de checkout ou ID do link',
    inputPlaceholder: 'https://link2pay.vercel.app/pay/abc123 ou abc123',
    inputHint: 'Cole a URL completa do checkout ou informe o ID do link.',
    invalidInvoiceId: 'Nao foi possivel encontrar um ID de link. Cole uma URL ou ID valido.',
    viewInvoice: 'Abrir checkout',
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
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex justify-end gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="animate-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-bold font-display">S</span>
            </div>
            <h1 className="text-xl font-bold text-foreground font-display mb-1 sm:text-2xl">{copy.title}</h1>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="card p-5 sm:p-6">
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
    </div>
  );
}
