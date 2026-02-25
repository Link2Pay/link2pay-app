import { useMemo, useState } from 'react';
import { Check, Copy, Link2, TerminalSquare } from 'lucide-react';
import { config } from '../../config';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

type Asset = 'XLM' | 'USDC' | 'EURC';

type BuilderCopy = {
  title: string;
  subtitle: string;
  asset: string;
  amount: string;
  ttl: string;
  generatedUrl: string;
  apiRequest: string;
  copyUrl: string;
  copyRequest: string;
  copied: string;
  minutes15: string;
  hour1: string;
  day1: string;
  demoRef: string;
};

const COPY: Record<Language, BuilderCopy> = {
  en: {
    title: 'Build a payment link in seconds',
    subtitle:
      'Preview the checkout URL and API payload before creating links in production.',
    asset: 'Asset',
    amount: 'Amount',
    ttl: 'Expiration',
    generatedUrl: 'Generated checkout URL',
    apiRequest: 'API request preview',
    copyUrl: 'Copy URL',
    copyRequest: 'Copy request',
    copied: 'Copied',
    minutes15: '15 minutes',
    hour1: '1 hour',
    day1: '24 hours',
    demoRef: 'DEMO-CHECKOUT',
  },
  es: {
    title: 'Construye un link de pago en segundos',
    subtitle:
      'Previsualiza la URL de checkout y el payload API antes de crear links en produccion.',
    asset: 'Activo',
    amount: 'Monto',
    ttl: 'Expiracion',
    generatedUrl: 'URL de checkout generada',
    apiRequest: 'Vista previa del request API',
    copyUrl: 'Copiar URL',
    copyRequest: 'Copiar request',
    copied: 'Copiado',
    minutes15: '15 minutos',
    hour1: '1 hora',
    day1: '24 horas',
    demoRef: 'DEMO-CHECKOUT',
  },
  pt: {
    title: 'Crie um link de pagamento em segundos',
    subtitle:
      'Visualize a URL de checkout e o payload da API antes de criar links em producao.',
    asset: 'Ativo',
    amount: 'Valor',
    ttl: 'Expiracao',
    generatedUrl: 'URL de checkout gerada',
    apiRequest: 'Preview do request da API',
    copyUrl: 'Copiar URL',
    copyRequest: 'Copiar request',
    copied: 'Copiado',
    minutes15: '15 minutos',
    hour1: '1 hora',
    day1: '24 horas',
    demoRef: 'DEMO-CHECKOUT',
  },
};

const TTL_OPTIONS = [
  { value: 15, key: 'minutes15' },
  { value: 60, key: 'hour1' },
  { value: 24 * 60, key: 'day1' },
] as const;

export default function InteractiveLinkBuilder() {
  const { language } = useI18n();
  const copy = COPY[language];

  const [asset, setAsset] = useState<Asset>('USDC');
  const [amount, setAmount] = useState<number>(199);
  const [ttlMinutes, setTtlMinutes] = useState<number>(60);
  const [copiedKey, setCopiedKey] = useState<'url' | 'request' | null>(null);

  const expiresAt = useMemo(
    () => new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
    [ttlMinutes]
  );

  const checkoutUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://link2pay.app';
    const params = new URLSearchParams({
      asset,
      amount: amount.toFixed(2),
      ttl: String(ttlMinutes),
      ref: copy.demoRef,
    });
    return `${base}/pay/demo?${params.toString()}`;
  }, [asset, amount, ttlMinutes, copy.demoRef]);

  const requestPayload = useMemo(() => {
    return JSON.stringify(
      {
        amount: Number(amount.toFixed(2)),
        asset,
        expiresAt,
        metadata: {
          title: 'Checkout demo',
          reference: copy.demoRef,
        },
      },
      null,
      2
    );
  }, [amount, asset, expiresAt, copy.demoRef]);

  const requestPreview = useMemo(() => {
    return `POST ${config.apiUrl}/api/links\n${requestPayload}`;
  }, [requestPayload]);

  const handleCopy = async (value: string, key: 'url' | 'request') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1600);
    } catch {
      // Ignore clipboard errors; preview still visible.
    }
  };

  return (
    <section className="card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-border p-6 sm:p-8 md:border-b-0 md:border-r">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground">{copy.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{copy.asset}</p>
              <div className="grid grid-cols-3 gap-2">
                {(['XLM', 'USDC', 'EURC'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAsset(item)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      asset === item
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/40'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {copy.amount}
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                value={Number.isFinite(amount) ? amount : 0}
                onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                className="input"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{copy.ttl}</p>
              <div className="grid grid-cols-3 gap-2">
                {TTL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTtlMinutes(option.value)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors ${
                      ttlMinutes === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {copy[option.key]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {copy.generatedUrl}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(checkoutUrl, 'url')}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  {copiedKey === 'url' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey === 'url' ? copy.copied : copy.copyUrl}
                </button>
              </div>
              <code className="block break-all text-xs text-foreground">{checkoutUrl}</code>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TerminalSquare className="h-3.5 w-3.5" />
              {copy.apiRequest}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(requestPreview, 'request')}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              {copiedKey === 'request' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === 'request' ? copy.copied : copy.copyRequest}
            </button>
          </div>
          <pre className="max-h-[340px] overflow-auto rounded-lg border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
            {requestPreview}
          </pre>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 className="h-3.5 w-3.5 text-primary" />
            Demo preview only. Real links are generated from your dashboard API key.
          </div>
        </div>
      </div>
    </section>
  );
}
