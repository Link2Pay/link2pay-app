import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowLeftRight, ArrowRight, Check, Copy, Landmark, QrCode, Wallet, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';
import { toPositiveAmount } from './InteractiveLinkBuilder';

// Mirrors backend/src/anchors/adapters/MockBreBAdapter.ts SIMULATED_USDC_COP_RATE.
const SIMULATED_USDC_COP_RATE = 4120.5;
const QUICK_AMOUNTS = [49, 199, 499] as const;
// Stellar assets Link2Pay supports for crypto settlement (see the "Accept the assets" section below).
const STELLAR_TOKENS = ['XLM', 'USDC', 'EURC'] as const;
type StellarToken = (typeof STELLAR_TOKENS)[number];

// Matches the real PublicInvoice.payoutMethod values (see src/types/index.ts).
type PayoutMethod = 'CRYPTO' | 'BRE_B';

type CopyBlock = {
  eyebrow: string;
  settlementLabel: string;
  cryptoTitle: string;
  cryptoDesc: string;
  fiatTitle: string;
  fiatDesc: string;
  railLabel: string;
  breBTitle: string;
  pixTitle: string;
  transferenciasTitle: string;
  comingSoon: string;
  tokenLabel: string;
  amountLabel: string;
  copReceiverNote: string;
  createCta: string;
  urlLabel: string;
  copyLink: string;
  copied: string;
  scanCaption: string;
  backCta: string;
  demoNote: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Payment link',
    settlementLabel: 'Settlement',
    cryptoTitle: 'Crypto',
    cryptoDesc: 'Receiver keeps the token on-chain',
    fiatTitle: 'Fiat',
    fiatDesc: 'Payer pays USDC, receiver gets local currency',
    railLabel: 'Payout rail',
    breBTitle: 'Bre-B (COP)',
    pixTitle: 'Pix (BRL)',
    transferenciasTitle: 'Transferencias 3.0 (ARS)',
    comingSoon: 'Soon',
    tokenLabel: 'Token',
    amountLabel: 'Amount',
    copReceiverNote: 'Receiver gets it in COP via Bre-B',
    createCta: 'Create link',
    urlLabel: 'Checkout link',
    copyLink: 'Copy link',
    copied: 'Copied',
    scanCaption: 'Scan to pay',
    backCta: 'Back',
    demoNote: 'Illustrative preview — not a live link.',
  },
  es: {
    eyebrow: 'Link de pago',
    settlementLabel: 'Liquidación',
    cryptoTitle: 'Crypto',
    cryptoDesc: 'El receptor mantiene el token on-chain',
    fiatTitle: 'Fiat',
    fiatDesc: 'El pagador paga USDC, el receptor recibe moneda local',
    railLabel: 'Riel de pago',
    breBTitle: 'Bre-B (COP)',
    pixTitle: 'Pix (BRL)',
    transferenciasTitle: 'Transferencias 3.0 (ARS)',
    comingSoon: 'Pronto',
    tokenLabel: 'Token',
    amountLabel: 'Monto',
    copReceiverNote: 'El receptor lo cobra en COP vía Bre-B',
    createCta: 'Crear link',
    urlLabel: 'Link de checkout',
    copyLink: 'Copiar link',
    copied: 'Copiado',
    scanCaption: 'Escanea para pagar',
    backCta: 'Volver',
    demoNote: 'Vista previa ilustrativa, no es un link real.',
  },
  pt: {
    eyebrow: 'Link de pagamento',
    settlementLabel: 'Liquidação',
    cryptoTitle: 'Crypto',
    cryptoDesc: 'Quem recebe mantém o token on-chain',
    fiatTitle: 'Fiat',
    fiatDesc: 'Quem paga envia USDC, quem recebe fica em moeda local',
    railLabel: 'Trilho de pagamento',
    breBTitle: 'Bre-B (COP)',
    pixTitle: 'Pix (BRL)',
    transferenciasTitle: 'Transferencias 3.0 (ARS)',
    comingSoon: 'Em breve',
    tokenLabel: 'Token',
    amountLabel: 'Valor',
    copReceiverNote: 'Quem recebe fica em COP via Bre-B',
    createCta: 'Criar link',
    urlLabel: 'Link de checkout',
    copyLink: 'Copiar link',
    copied: 'Copiado',
    scanCaption: 'Escaneie para pagar',
    backCta: 'Voltar',
    demoNote: 'Prévia ilustrativa, não é um link real.',
  },
};

const formatCop = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

/** Interactive marketing preview for the landing hero — local-only, no backend calls. */
export default function HeroPaymentMockup() {
  const { language } = useI18n();
  const copy = COPY[language];

  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('BRE_B');
  const [cryptoAsset, setCryptoAsset] = useState<StellarToken>('USDC');
  const [amountInput, setAmountInput] = useState('199');
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  const amount = useMemo(() => toPositiveAmount(amountInput, 1), [amountInput]);
  const isFiat = payoutMethod === 'BRE_B';
  const isCrypto = payoutMethod === 'CRYPTO';
  // Fiat off-ramp always settles from USDC, same as the real Bre-B flow; only crypto mode lets you pick the token.
  const asset = isCrypto ? cryptoAsset : 'USDC';
  const copAmount = amount * SIMULATED_USDC_COP_RATE;

  // Real prod domain when deployed; falls back to the public domain while developing locally.
  const checkoutBase = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://link2pay.app';
    return /localhost|127\.0\.0\.1/i.test(origin) ? 'https://link2pay.app' : origin;
  }, []);

  const checkoutUrl = useMemo(() => {
    const params = new URLSearchParams({
      amount: amount.toFixed(2),
      asset,
      payout: payoutMethod.toLowerCase(),
    });
    return `${checkoutBase}/pay/demo?${params.toString()}`;
  }, [amount, asset, payoutMethod, checkoutBase]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard errors; preview still visible.
    }
  };

  return (
    <div className="space-y-5">
      <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
        <Zap className="h-4 w-4" />
        {copy.eyebrow}
      </span>

      {!created && (
      <>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {copy.settlementLabel}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPayoutMethod('CRYPTO')}
            aria-pressed={payoutMethod === 'CRYPTO'}
            className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
              payoutMethod === 'CRYPTO'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/40'
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Wallet className="h-3.5 w-3.5" />
              {copy.cryptoTitle}
            </span>
            <span className="mt-0.5 block text-2xs text-muted-foreground">{copy.cryptoDesc}</span>
          </button>
          <button
            type="button"
            onClick={() => setPayoutMethod('BRE_B')}
            aria-pressed={payoutMethod === 'BRE_B'}
            className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
              payoutMethod === 'BRE_B'
                ? 'border-warning-border bg-warning-subtle text-warning'
                : 'border-border bg-background text-foreground hover:border-primary/40'
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Landmark className="h-3.5 w-3.5" />
              {copy.fiatTitle}
            </span>
            <span className="mt-0.5 block text-2xs text-muted-foreground">{copy.fiatDesc}</span>
          </button>
        </div>

        {isFiat && (
          <div className="animate-in mt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {copy.railLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-subtle px-4 py-3 text-xs font-medium text-warning">
                <Landmark className="h-3.5 w-3.5" />
                {copy.breBTitle}
              </span>
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-background/50 px-4 py-3 text-xs font-medium text-muted-foreground opacity-60"
              >
                <QrCode className="h-3.5 w-3.5" />
                {copy.pixTitle}
                <span className="text-3xs font-semibold uppercase tracking-wide">({copy.comingSoon})</span>
              </button>
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-background/50 px-4 py-3 text-xs font-medium text-muted-foreground opacity-60"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                {copy.transferenciasTitle}
                <span className="text-3xs font-semibold uppercase tracking-wide">({copy.comingSoon})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="hero-mock-amount"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          {copy.amountLabel}
        </label>
        <div className="flex items-center gap-2">
          {asset === 'USDC' && <span className="text-2xl font-semibold text-foreground">$</span>}
          <input
            id="hero-mock-amount"
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            onBlur={() => setAmountInput(amount.toFixed(2))}
            className="input text-2xl font-semibold"
          />
          <span className="text-sm font-medium text-muted-foreground">{asset}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmountInput(String(preset))}
              className={`rounded-full border px-4 py-3 text-xs font-medium transition-colors ${
                amount === preset
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>

        {isCrypto && (
          <div className="animate-in mt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {copy.tokenLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {STELLAR_TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setCryptoAsset(token)}
                  aria-pressed={cryptoAsset === token}
                  className={`rounded-full border px-4 py-3 text-xs font-medium transition-colors ${
                    cryptoAsset === token
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        )}

        {isFiat && (
          <p className="animate-in mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium text-warning">
            <Landmark className="h-4 w-4 flex-shrink-0" />
            ≈ ${formatCop(copAmount)} COP
            <span className="font-normal text-muted-foreground">· {copy.copReceiverNote}</span>
          </p>
        )}
      </div>

      <button type="button" onClick={() => setCreated(true)} className="btn-primary w-full justify-center py-3.5 text-sm">
        {copy.createCta}
        <ArrowRight className="h-4 w-4" />
      </button>
      </>
      )}

      {created && (
        <div className="animate-in space-y-4">
          <div className="flex justify-center">
            {/* Fixed white background: QR codes need light-on-dark contrast regardless of app theme.
                aria-hidden: decorative — the same URL is already exposed as accessible text below. */}
            <div aria-hidden="true" className="rounded-2xl bg-white p-4">
              <QRCodeSVG value={checkoutUrl} size={176} level="M" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 lg:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{copy.urlLabel}</p>
              <button type="button" onClick={handleCopy} className="btn-secondary shrink-0 px-3.5 py-3 text-xs">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? copy.copied : copy.copyLink}
              </button>
            </div>
            <code className="mt-2 block break-all font-mono text-xs leading-relaxed text-foreground">
              {checkoutUrl}
            </code>
            <p className="mt-2 text-xs text-muted-foreground">{copy.scanCaption}</p>
          </div>

          <button
            type="button"
            onClick={() => setCreated(false)}
            className="btn-secondary w-full justify-center py-3.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.backCta}
          </button>

          <p className="text-xs text-muted-foreground">{copy.demoNote}</p>
        </div>
      )}
    </div>
  );
}
