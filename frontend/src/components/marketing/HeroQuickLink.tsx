import { useState } from 'react';
import { ArrowRight, Check, Copy, Link as LinkIcon, Zap } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useNetworkStore } from '../../store/networkStore';
import { useWalletStore } from '../../store/walletStore';
import { createLink } from '../../services/api';
import toast from 'react-hot-toast';
import type { Language } from '../../i18n/translations';

type Asset = 'XLM' | 'USDC';

type CopyBlock = {
  title: string;
  subtitle: string;
  network: string;
  amount: string;
  asset: string;
  expires: string;
  expiresMinutesGroup: string;
  expiresHoursGroup: string;
  activateNewAccounts: string;
  activateHint: string;
  activateXlmOnlyHint: string;
  connectWallet: string;
  connecting: string;
  creating: string;
  createLink: string;
  openCheckout: string;
  copyLink: string;
  copied: string;
  checkoutLabel: string;
  previewPlaceholder: string;
  linkCreatedToast: string;
  connectWalletError: string;
  invalidAmountError: string;
  createLinkError: string;
  networkMismatch: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    title: 'Create a live payment link',
    subtitle: 'Set amount and asset, generate checkout, and share in seconds.',
    network: 'Network',
    amount: 'Amount',
    asset: 'Token',
    expires: 'Expiration',
    expiresMinutesGroup: 'Minutes',
    expiresHoursGroup: 'Hours',
    activateNewAccounts: 'Activate new account if destination is not funded',
    activateHint: 'XLM only. Uses create-account on first payment when needed.',
    activateXlmOnlyHint: 'Available only for XLM links.',
    connectWallet: 'Connect Wallet',
    connecting: 'Connecting...',
    creating: 'Creating...',
    createLink: 'Create Link',
    openCheckout: 'Open checkout',
    copyLink: 'Copy link',
    copied: 'Copied',
    checkoutLabel: 'Checkout link',
    previewPlaceholder: 'Create a link to preview it here.',
    linkCreatedToast: 'Payment link created',
    connectWalletError: 'Failed to connect wallet',
    invalidAmountError: 'Amount must be greater than 0',
    createLinkError: 'Failed to create link',
    networkMismatch:
      'Network mismatch: You selected {selected} but Freighter wallet is on {freighter}. Please switch your Freighter wallet to {selected}, disconnect and reconnect your wallet.',
  },
  es: {
    title: 'Crea un link de pago real',
    subtitle: 'Define monto y activo, genera checkout y compártelo en segundos.',
    network: 'Red',
    amount: 'Monto',
    asset: 'Token',
    expires: 'Expiración',
    expiresMinutesGroup: 'Minutos',
    expiresHoursGroup: 'Horas',
    activateNewAccounts: 'Activar cuenta nueva si el destino no esta fondeado',
    activateHint: 'Solo XLM. Usa create-account en el primer pago si es necesario.',
    activateXlmOnlyHint: 'Disponible solo en links XLM.',
    connectWallet: 'Conectar wallet',
    connecting: 'Conectando...',
    creating: 'Creando...',
    createLink: 'Crear link',
    openCheckout: 'Abrir checkout',
    copyLink: 'Copiar link',
    copied: 'Copiado',
    checkoutLabel: 'Link de checkout',
    previewPlaceholder: 'Crea un link para previsualizarlo aquí.',
    linkCreatedToast: 'Link de pago creado',
    connectWalletError: 'No se pudo conectar la wallet',
    invalidAmountError: 'El monto debe ser mayor a 0',
    createLinkError: 'No se pudo crear el link',
    networkMismatch:
      'Red incorrecta: Seleccionaste {selected} pero Freighter está en {freighter}. Cambia tu wallet Freighter a {selected}, desconecta y vuelve a conectar.',
  },
  pt: {
    title: 'Crie um link de pagamento real',
    subtitle: 'Defina valor e ativo, gere checkout e compartilhe em segundos.',
    network: 'Rede',
    amount: 'Valor',
    asset: 'Token',
    expires: 'Expiração',
    expiresMinutesGroup: 'Minutos',
    expiresHoursGroup: 'Horas',
    activateNewAccounts: 'Ativar conta nova se o destino nao estiver fondeado',
    activateHint: 'Somente XLM. Usa create-account no primeiro pagamento quando necessario.',
    activateXlmOnlyHint: 'Disponivel apenas para links XLM.',
    connectWallet: 'Conectar wallet',
    connecting: 'Conectando...',
    creating: 'Criando...',
    createLink: 'Criar link',
    openCheckout: 'Abrir checkout',
    copyLink: 'Copiar link',
    copied: 'Copiado',
    checkoutLabel: 'Link de checkout',
    previewPlaceholder: 'Crie um link para visualizar aqui.',
    linkCreatedToast: 'Link de pagamento criado',
    connectWalletError: 'Falha ao conectar wallet',
    invalidAmountError: 'O valor deve ser maior que 0',
    createLinkError: 'Falha ao criar link',
    networkMismatch:
      'Rede incorreta: Você selecionou {selected} mas o Freighter está em {freighter}. Mude a carteira Freighter para {selected}, desconecte e conecte novamente.',
  },
};

const EXPIRATION_OPTIONS = [
  { value: 15, label: '15m', group: 'minutes' },
  { value: 30, label: '30m', group: 'minutes' },
  { value: 60, label: '1h', group: 'hours' },
  { value: 120, label: '2h', group: 'hours' },
  { value: 240, label: '4h', group: 'hours' },
  { value: 480, label: '8h', group: 'hours' },
  { value: 720, label: '12h', group: 'hours' },
  { value: 1440, label: '24h', group: 'hours' },
  { value: 2880, label: '48h', group: 'hours' },
] as const;

const HERO_PREVIEW_REFERENCE = '__hero_preview_v1__';

export default function HeroQuickLink() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { network, networkPassphrase, setNetwork } = useNetworkStore();
  const { publicKey, connected, isConnecting, connect, getFreighterNetwork } = useWalletStore();

  const [asset, setAsset] = useState<Asset>('USDC');
  const [amount, setAmount] = useState<number>(199);
  const [expirationMinutes, setExpirationMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activateNewAccounts, setActivateNewAccounts] = useState(false);

  const handleCopy = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error(copy.invalidAmountError);
      return;
    }

    setIsSubmitting(true);
    try {
      let walletAddress = publicKey;
      if (!connected || !walletAddress) {
        await connect();
        const refreshedState = useWalletStore.getState();
        walletAddress = refreshedState.publicKey;
        if (!refreshedState.connected || !walletAddress) {
          throw new Error(copy.connectWalletError);
        }
      }

      const freighterNetwork = await getFreighterNetwork();
      if (freighterNetwork && freighterNetwork !== networkPassphrase) {
        const selectedName = networkPassphrase.includes('Test') ? 'TESTNET' : 'MAINNET';
        const freighterName = freighterNetwork.includes('Test') ? 'TESTNET' : 'MAINNET';
        const errorMsg = copy.networkMismatch
          .replace('{selected}', selectedName)
          .replace('{freighter}', freighterName)
          .replace('{selected}', selectedName);
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
      const result = await createLink(
        {
          amount: Number(numericAmount.toFixed(2)),
          asset,
          activateNewAccounts: asset === 'XLM' && activateNewAccounts,
          expiresAt,
          networkPassphrase,
          metadata: {
            reference: HERO_PREVIEW_REFERENCE,
          },
        },
        walletAddress
      );
      setLinkUrl(result.checkoutUrl);
      toast.success(copy.linkCreatedToast);
    } catch (error: any) {
      toast.error(error?.message || copy.createLinkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            <Zap className="h-4 w-4" />
            {copy.title}
          </div>
          <p className="mt-2 text-lg text-muted-foreground/90">{copy.subtitle}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {copy.network}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['testnet', 'mainnet'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNetwork(value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    network === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:border-primary/40'
                  }`}
                >
                  {value === 'testnet' ? 'Testnet' : 'Mainnet'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {copy.asset}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['USDC', 'XLM'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setAsset(item);
                    if (item !== 'XLM') {
                      setActivateNewAccounts(false);
                    }
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
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
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {copy.amount}
            </label>
            <input
              type="number"
              min={1}
              step={0.01}
              value={Number.isFinite(amount) ? amount : 0}
              onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 1))}
              className="input text-lg"
            />
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {copy.expires}
            </label>
            <select
              value={expirationMinutes}
              onChange={(e) => setExpirationMinutes(Number(e.target.value))}
              className="input text-lg"
            >
              <optgroup label={copy.expiresMinutesGroup}>
                {EXPIRATION_OPTIONS
                  .filter((option) => option.group === 'minutes')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label={copy.expiresHoursGroup}>
                {EXPIRATION_OPTIONS
                  .filter((option) => option.group === 'hours')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-card/70 p-3.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            checked={activateNewAccounts}
            onChange={(e) => setActivateNewAccounts(e.target.checked)}
            disabled={asset !== 'XLM'}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              {copy.activateNewAccounts}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {asset === 'XLM' ? copy.activateHint : copy.activateXlmOnlyHint}
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || isConnecting}
          className="btn-primary w-full justify-center py-3.5 text-base"
        >
          {isConnecting
            ? copy.connecting
            : isSubmitting
              ? copy.creating
              : connected
                ? copy.createLink
                : copy.connectWallet}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="rounded-2xl border border-border/70 bg-background/70 p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <LinkIcon className="h-4 w-4 text-primary" />
            {copy.checkoutLabel}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!linkUrl}
              className="btn-secondary px-3 py-2 text-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? copy.copied : copy.copyLink}
            </button>
            {linkUrl && (
              <a
                href={linkUrl}
                className="btn-primary px-3 py-2 text-sm"
                target="_blank"
                rel="noreferrer"
              >
                {copy.openCheckout}
              </a>
            )}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-card/80 px-3 py-2.5 text-sm text-foreground">
          {linkUrl ? (
            <code className="block break-all whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
              {linkUrl}
            </code>
          ) : (
            <span className="text-muted-foreground">{copy.previewPlaceholder}</span>
          )}
        </div>
      </div>
    </div>
  );
}
