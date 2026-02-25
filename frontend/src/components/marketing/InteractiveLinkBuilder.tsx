import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Copy, Link2, TerminalSquare } from 'lucide-react';
import { config } from '../../config';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

type Asset = 'XLM' | 'USDC' | 'EURC';

type BuilderCopy = {
  title: string;
  subtitle: string;
  stepAsset: string;
  stepAmount: string;
  stepTtl: string;
  asset: string;
  amount: string;
  amountPresets: string;
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
  demoNote: string;
  instantPreview: string;
  startLiveCta: string;
};

const COPY: Record<Language, BuilderCopy> = {
  en: {
    title: 'Build a payment link in seconds',
    subtitle: 'Preview checkout and API payload before creating links in production.',
    stepAsset: 'Step 1',
    stepAmount: 'Step 2',
    stepTtl: 'Step 3',
    asset: 'Choose asset',
    amount: 'Set amount',
    amountPresets: 'Quick amounts',
    ttl: 'Choose expiration',
    generatedUrl: 'Generated checkout URL',
    apiRequest: 'API request preview',
    copyUrl: 'Copy URL',
    copyRequest: 'Copy request',
    copied: 'Copied',
    minutes15: '15 minutes',
    hour1: '1 hour',
    day1: '24 hours',
    demoRef: 'DEMO-CHECKOUT',
    demoNote: 'Demo preview only. Real links are generated from your dashboard API key.',
    instantPreview: 'Preview updates instantly as you edit.',
    startLiveCta: 'Try Live Link Builder',
  },
  es: {
    title: 'Crea un link de pago en segundos',
    subtitle: 'Previsualiza checkout y payload de API antes de crear links en producción.',
    stepAsset: 'Paso 1',
    stepAmount: 'Paso 2',
    stepTtl: 'Paso 3',
    asset: 'Elige activo',
    amount: 'Define monto',
    amountPresets: 'Montos rápidos',
    ttl: 'Elige expiración',
    generatedUrl: 'URL de checkout generada',
    apiRequest: 'Vista previa del request API',
    copyUrl: 'Copiar URL',
    copyRequest: 'Copiar request',
    copied: 'Copiado',
    minutes15: '15 minutos',
    hour1: '1 hora',
    day1: '24 horas',
    demoRef: 'DEMO-CHECKOUT',
    demoNote: 'Solo vista previa demo. Los links reales se generan con tu API key del dashboard.',
    instantPreview: 'La vista previa se actualiza al instante mientras editas.',
    startLiveCta: 'Probar Creador En Vivo',
  },
  pt: {
    title: 'Crie um link de pagamento em segundos',
    subtitle: 'Visualize checkout e payload da API antes de criar links em produção.',
    stepAsset: 'Etapa 1',
    stepAmount: 'Etapa 2',
    stepTtl: 'Etapa 3',
    asset: 'Escolha o ativo',
    amount: 'Defina o valor',
    amountPresets: 'Valores rápidos',
    ttl: 'Escolha a expiração',
    generatedUrl: 'URL de checkout gerada',
    apiRequest: 'Prévia do request API',
    copyUrl: 'Copiar URL',
    copyRequest: 'Copiar request',
    copied: 'Copiado',
    minutes15: '15 minutos',
    hour1: '1 hora',
    day1: '24 horas',
    demoRef: 'DEMO-CHECKOUT',
    demoNote: 'Apenas prévia de demo. Links reais são gerados com sua API key do dashboard.',
    instantPreview: 'A prévia atualiza instantaneamente enquanto você edita.',
    startLiveCta: 'Testar Criador Ao Vivo',
  },
};

const TTL_OPTIONS = [
  { value: 15, key: 'minutes15' },
  { value: 60, key: 'hour1' },
  { value: 24 * 60, key: 'day1' },
] as const;

const QUICK_AMOUNTS = [49, 199, 499] as const;

const toPositiveAmount = (raw: string, fallback = 1): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const firstDot = normalized.indexOf('.');
  const clean =
    firstDot === -1
      ? normalized
      : `${normalized.slice(0, firstDot + 1)}${normalized.slice(firstDot + 1).replace(/\./g, '')}`;

  const parsed = Number.parseFloat(clean);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default function InteractiveLinkBuilder() {
  const { language } = useI18n();
  const copy = COPY[language];

  const [asset, setAsset] = useState<Asset>('USDC');
  const [amountInput, setAmountInput] = useState<string>('199');
  const [ttlMinutes, setTtlMinutes] = useState<number>(60);
  const [copiedKey, setCopiedKey] = useState<'url' | 'request' | null>(null);

  const amount = useMemo(() => toPositiveAmount(amountInput, 1), [amountInput]);

  const previewCheckoutBase = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://link2pay.app';
    return /localhost|127\.0\.0\.1/i.test(origin) ? 'https://link2pay.app' : origin;
  }, []);

  const previewApiBase = useMemo(() => {
    const base = (config.apiUrl || '').trim() || 'https://api.link2pay.app';
    return /localhost|127\.0\.0\.1/i.test(base) ? 'https://api.link2pay.app' : base;
  }, []);

  const expiresAt = useMemo(
    () => new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
    [ttlMinutes]
  );

  const checkoutUrl = useMemo(() => {
    const params = new URLSearchParams({
      asset,
      amount: amount.toFixed(2),
      ttl: String(ttlMinutes),
      ref: copy.demoRef,
    });
    return `${previewCheckoutBase}/pay/demo?${params.toString()}`;
  }, [asset, amount, ttlMinutes, copy.demoRef, previewCheckoutBase]);

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
    return `POST ${previewApiBase}/api/links\nContent-Type: application/json\nAuthorization: Bearer <YOUR_API_KEY>\n\n${requestPayload}`;
  }, [requestPayload, previewApiBase]);

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

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-primary">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[10px]">
                  1
                </span>
                {copy.stepAsset}
              </div>
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
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-primary">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[10px]">
                  2
                </span>
                {copy.stepAmount}
              </div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {copy.amount}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                onBlur={() => setAmountInput(amount.toFixed(2))}
                className="input"
                aria-label={copy.amount}
              />
              <div className="mt-2">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{copy.amountPresets}</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(String(preset))}
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                        amount === preset
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-primary">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[10px]">
                  3
                </span>
                {copy.stepTtl}
              </div>
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
                  className="btn-secondary px-2.5 py-1.5 text-xs"
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
              className="btn-secondary px-2.5 py-1.5 text-xs"
            >
              {copiedKey === 'request' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedKey === 'request' ? copy.copied : copy.copyRequest}
            </button>
          </div>
          <pre className="max-h-[340px] overflow-auto rounded-lg border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
            {requestPreview}
          </pre>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="text-foreground">{copy.instantPreview}</p>
            <div className="mt-2 flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              {copy.demoNote}
            </div>
          </div>
          <Link to="/app" className="btn-primary mt-4 w-full justify-center py-3 text-sm">
            {copy.startLiveCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
