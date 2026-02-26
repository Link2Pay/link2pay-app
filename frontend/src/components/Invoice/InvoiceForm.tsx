import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Lock,
  Plus,
  QrCode,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createLink } from '../../services/api';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import { useActorWallet } from '../../hooks/useActorWallet';
import type { Currency, PaymentLink } from '../../types';
import type { Language } from '../../i18n/translations';

type ProFeature =
  | 'customExpiry'
  | 'invoiceMode'
  | 'redirectUrl'
  | 'reusable'
  | 'variable'
  | 'webhooks';

interface MetadataEntry {
  id: string;
  key: string;
  value: string;
}

interface CopyBlock {
  failedCreateLink: string;
  invalidAmount: string;
  walletRequired: string;
  paymentSection: string;
  paymentHint: string;
  amount: string;
  amountPlaceholder: string;
  asset: string;
  expiresIn: string;
  expiresLocked: string;
  paymentReason: string;
  paymentReasonPlaceholder: string;
  memo: string;
  memoPlaceholder: string;
  receiverSection: string;
  payoutWallet: string;
  payoutWalletHint: string;
  outputSection: string;
  outputHint: string;
  generateLink: string;
  generating: string;
  checkoutLink: string;
  statusPage: string;
  copyLink: string;
  copied: string;
  openCheckout: string;
  openStatus: string;
  qrCode: string;
  qrHint: string;
  linkReady: string;
  noLinkYet: string;
  advancedSection: string;
  advancedHint: string;
  showAdvanced: string;
  hideAdvanced: string;
  metadata: string;
  metadataHint: string;
  metadataKey: string;
  metadataValue: string;
  metadataKeyPlaceholder: string;
  metadataValuePlaceholder: string;
  addMetadata: string;
  removeMetadata: string;
  proBadge: string;
  unlock: string;
  proModalTitle: string;
  keepFree: string;
  upgrade: string;
  proCustomExpiry: string;
  proInvoiceMode: string;
  proRedirectUrl: string;
  proReusable: string;
  proVariable: string;
  proWebhooks: string;
  networkMismatch: string;
  createdToast: string;
}

const FREE_EXPIRY_MINUTES = 15;
const MAX_METADATA_ENTRIES = 4;
const MAX_REFERENCE_LENGTH = 120;

const COPY: Record<Language, CopyBlock> = {
  en: {
    failedCreateLink: 'Failed to create payment link',
    invalidAmount: 'Amount must be greater than 0',
    walletRequired: 'Connect a wallet or sign in with a linked account before creating links.',
    paymentSection: 'Payment',
    paymentHint: 'Minimal required fields for a fixed one-time link.',
    amount: 'Amount',
    amountPlaceholder: '0.00',
    asset: 'Asset',
    expiresIn: 'Expires in',
    expiresLocked: '15 minutes (Free)',
    paymentReason: 'Payment reason',
    paymentReasonPlaceholder: 'Subscription renewal, service fee, etc.',
    memo: 'Description / memo',
    memoPlaceholder: 'Optional short memo shown in the link metadata.',
    receiverSection: 'Receiver',
    payoutWallet: 'Payout wallet',
    payoutWalletHint: 'Auto-filled from your connected account. Multiple payout wallets are not enabled on Free.',
    outputSection: 'Output',
    outputHint: 'Generate the link, then share checkout URL, QR, or status page.',
    generateLink: 'Generate Link',
    generating: 'Generating...',
    checkoutLink: 'Checkout link',
    statusPage: 'Status page',
    copyLink: 'Copy link',
    copied: 'Copied',
    openCheckout: 'Open checkout',
    openStatus: 'Open status',
    qrCode: 'QR code',
    qrHint: 'Scan to open checkout on mobile.',
    linkReady: 'Link ready',
    noLinkYet: 'No link generated yet. Use the button above to create one.',
    advancedSection: 'Advanced',
    advancedHint: 'Optional metadata + Pro capabilities.',
    showAdvanced: 'Show advanced',
    hideAdvanced: 'Hide advanced',
    metadata: 'Metadata (key-value)',
    metadataHint: 'Developer metadata is packed into a reference string for this version.',
    metadataKey: 'Key',
    metadataValue: 'Value',
    metadataKeyPlaceholder: 'order_id',
    metadataValuePlaceholder: 'ord_12345',
    addMetadata: 'Add metadata',
    removeMetadata: 'Remove metadata',
    proBadge: 'Pro',
    unlock: 'Unlock',
    proModalTitle: 'This is a Pro feature',
    keepFree: 'Keep Free',
    upgrade: 'Upgrade to Pro',
    proCustomExpiry: 'Custom expiry is Pro. Free links are fixed at 15 minutes.',
    proInvoiceMode: 'Invoice mode is Pro. Free keeps a simple payment link flow.',
    proRedirectUrl: 'Custom redirect URL after payment is Pro.',
    proReusable: 'Reusable links are Pro. Free supports one-time links only.',
    proVariable: 'Variable amount links are Pro. Free uses fixed amount only.',
    proWebhooks: 'Webhooks and retry/signing controls are Pro.',
    networkMismatch:
      'Network mismatch: You selected {selected} but Freighter wallet is on {freighter}. Please switch your Freighter wallet to {selected}, disconnect and reconnect your wallet.',
    createdToast: 'Payment link created',
  },
  es: {
    failedCreateLink: 'No se pudo crear el link de pago',
    invalidAmount: 'El monto debe ser mayor a 0',
    walletRequired: 'Conecta una wallet o inicia sesion con una cuenta vinculada antes de crear links.',
    paymentSection: 'Pago',
    paymentHint: 'Campos minimos requeridos para un link fijo de un solo uso.',
    amount: 'Monto',
    amountPlaceholder: '0.00',
    asset: 'Activo',
    expiresIn: 'Expira en',
    expiresLocked: '15 minutos (Free)',
    paymentReason: 'Motivo del pago',
    paymentReasonPlaceholder: 'Renovacion, tarifa de servicio, etc.',
    memo: 'Descripcion / memo',
    memoPlaceholder: 'Memo corto opcional en los metadatos del link.',
    receiverSection: 'Receptor',
    payoutWallet: 'Wallet de cobro',
    payoutWalletHint: 'Se completa automaticamente desde tu cuenta conectada. Multiples wallets no estan habilitadas en Free.',
    outputSection: 'Salida',
    outputHint: 'Genera el link y comparte URL, QR o pagina de estado.',
    generateLink: 'Generar Link',
    generating: 'Generando...',
    checkoutLink: 'Link de checkout',
    statusPage: 'Pagina de estado',
    copyLink: 'Copiar link',
    copied: 'Copiado',
    openCheckout: 'Abrir checkout',
    openStatus: 'Abrir estado',
    qrCode: 'Codigo QR',
    qrHint: 'Escanea para abrir checkout en movil.',
    linkReady: 'Link listo',
    noLinkYet: 'Aun no hay link generado. Usa el boton para crearlo.',
    advancedSection: 'Avanzado',
    advancedHint: 'Metadatos opcionales + capacidades Pro.',
    showAdvanced: 'Mostrar avanzado',
    hideAdvanced: 'Ocultar avanzado',
    metadata: 'Metadatos (clave-valor)',
    metadataHint: 'En esta version, los metadatos se empaquetan en una referencia.',
    metadataKey: 'Clave',
    metadataValue: 'Valor',
    metadataKeyPlaceholder: 'order_id',
    metadataValuePlaceholder: 'ord_12345',
    addMetadata: 'Agregar metadato',
    removeMetadata: 'Quitar metadato',
    proBadge: 'Pro',
    unlock: 'Desbloquear',
    proModalTitle: 'Esta funcion es Pro',
    keepFree: 'Seguir en Free',
    upgrade: 'Mejorar a Pro',
    proCustomExpiry: 'La expiracion personalizada es Pro. Free usa 15 minutos fijos.',
    proInvoiceMode: 'El modo factura es Pro. Free mantiene flujo simple de link.',
    proRedirectUrl: 'La URL de redireccion personalizada es Pro.',
    proReusable: 'Los links reutilizables son Pro. Free solo soporta un uso.',
    proVariable: 'Monto variable es Pro. Free usa monto fijo.',
    proWebhooks: 'Webhooks y reintentos/firma son Pro.',
    networkMismatch:
      'Red incorrecta: Seleccionaste {selected} pero Freighter esta en {freighter}. Cambia tu wallet Freighter a {selected}, desconecta y vuelve a conectar.',
    createdToast: 'Link de pago creado',
  },
  pt: {
    failedCreateLink: 'Falha ao criar o link de pagamento',
    invalidAmount: 'O valor deve ser maior que 0',
    walletRequired: 'Conecte uma wallet ou entre com uma conta vinculada antes de criar links.',
    paymentSection: 'Pagamento',
    paymentHint: 'Campos minimos obrigatorios para um link fixo de uso unico.',
    amount: 'Valor',
    amountPlaceholder: '0.00',
    asset: 'Ativo',
    expiresIn: 'Expira em',
    expiresLocked: '15 minutos (Free)',
    paymentReason: 'Motivo do pagamento',
    paymentReasonPlaceholder: 'Renovacao, taxa de servico, etc.',
    memo: 'Descricao / memo',
    memoPlaceholder: 'Memo curto opcional nos metadados do link.',
    receiverSection: 'Recebedor',
    payoutWallet: 'Wallet de recebimento',
    payoutWalletHint: 'Preenchida automaticamente da conta conectada. Multiplas wallets nao estao habilitadas no Free.',
    outputSection: 'Saida',
    outputHint: 'Gere o link e compartilhe URL, QR ou pagina de status.',
    generateLink: 'Gerar Link',
    generating: 'Gerando...',
    checkoutLink: 'Link de checkout',
    statusPage: 'Pagina de status',
    copyLink: 'Copiar link',
    copied: 'Copiado',
    openCheckout: 'Abrir checkout',
    openStatus: 'Abrir status',
    qrCode: 'Codigo QR',
    qrHint: 'Escaneie para abrir o checkout no celular.',
    linkReady: 'Link pronto',
    noLinkYet: 'Nenhum link gerado ainda. Use o botao acima para criar.',
    advancedSection: 'Avancado',
    advancedHint: 'Metadados opcionais + recursos Pro.',
    showAdvanced: 'Mostrar avancado',
    hideAdvanced: 'Ocultar avancado',
    metadata: 'Metadados (chave-valor)',
    metadataHint: 'Nesta versao, os metadados sao compactados em uma referencia.',
    metadataKey: 'Chave',
    metadataValue: 'Valor',
    metadataKeyPlaceholder: 'order_id',
    metadataValuePlaceholder: 'ord_12345',
    addMetadata: 'Adicionar metadado',
    removeMetadata: 'Remover metadado',
    proBadge: 'Pro',
    unlock: 'Desbloquear',
    proModalTitle: 'Este recurso e Pro',
    keepFree: 'Manter Free',
    upgrade: 'Fazer upgrade para Pro',
    proCustomExpiry: 'Expiracao customizada e Pro. Free usa 15 minutos fixos.',
    proInvoiceMode: 'Modo fatura e Pro. Free mantem fluxo simples de link.',
    proRedirectUrl: 'URL de redirecionamento customizada e Pro.',
    proReusable: 'Links reutilizaveis sao Pro. Free suporta apenas uso unico.',
    proVariable: 'Valor variavel e Pro. Free usa valor fixo.',
    proWebhooks: 'Webhooks e controles de retry/assinatura sao Pro.',
    networkMismatch:
      'Rede incorreta: Voce selecionou {selected} mas o Freighter esta em {freighter}. Troque o Freighter para {selected}, desconecte e conecte novamente.',
    createdToast: 'Link de pagamento criado',
  },
};

function buildReference(entries: MetadataEntry[]): string | undefined {
  const parts = entries
    .map((entry) => ({
      key: entry.key.trim(),
      value: entry.value.trim(),
    }))
    .filter((entry) => entry.key && entry.value)
    .map((entry) => `${entry.key}:${entry.value}`);

  if (!parts.length) return undefined;
  return parts.join('|').slice(0, MAX_REFERENCE_LENGTH);
}

function getProMessage(copy: CopyBlock, feature: ProFeature): string {
  switch (feature) {
    case 'customExpiry':
      return copy.proCustomExpiry;
    case 'invoiceMode':
      return copy.proInvoiceMode;
    case 'redirectUrl':
      return copy.proRedirectUrl;
    case 'reusable':
      return copy.proReusable;
    case 'variable':
      return copy.proVariable;
    case 'webhooks':
      return copy.proWebhooks;
    default:
      return copy.proCustomExpiry;
  }
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { connected, publicKey, getFreighterNetwork } = useWalletStore();
  const { networkPassphrase } = useNetworkStore();
  const actorWallet = useActorWallet();
  const { language } = useI18n();
  const copy = COPY[language];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('1.00');
  const [asset, setAsset] = useState<Currency>('XLM');
  const [paymentReason, setPaymentReason] = useState('');
  const [memo, setMemo] = useState('');
  const [recipientWallet, setRecipientWallet] = useState(actorWallet || '');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [metadataEntries, setMetadataEntries] = useState<MetadataEntry[]>([
    { id: 'meta-1', key: '', value: '' },
  ]);
  const [createdLink, setCreatedLink] = useState<PaymentLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [proFeature, setProFeature] = useState<ProFeature | null>(null);

  useEffect(() => {
    if (actorWallet) {
      setRecipientWallet(actorWallet);
    }
  }, [actorWallet]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const metadataReference = useMemo(
    () => buildReference(metadataEntries),
    [metadataEntries]
  );

  const statusUrl = useMemo(() => {
    if (!createdLink || typeof window === 'undefined') return null;
    return `${window.location.origin}/app/links/${createdLink.legacyInvoiceId || createdLink.id}`;
  }, [createdLink]);

  const qrUrl = useMemo(() => {
    if (!createdLink) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(createdLink.checkoutUrl)}`;
  }, [createdLink]);

  const addMetadataRow = () => {
    if (metadataEntries.length >= MAX_METADATA_ENTRIES) return;
    const id = `meta-${Date.now()}`;
    setMetadataEntries((prev) => [...prev, { id, key: '', value: '' }]);
  };

  const removeMetadataRow = (id: string) => {
    setMetadataEntries((prev) => {
      if (prev.length <= 1) {
        return [{ ...prev[0], key: '', value: '' }];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const updateMetadataRow = (
    id: string,
    field: keyof Omit<MetadataEntry, 'id'>,
    value: string
  ) => {
    setMetadataEntries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleCopyLink = async () => {
    if (!createdLink?.checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(createdLink.checkoutUrl);
      setCopied(true);
    } catch {
      // no-op
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientWallet) {
      setError(copy.walletRequired);
      toast.error(copy.walletRequired);
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(copy.invalidAmount);
      toast.error(copy.invalidAmount);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (connected && publicKey) {
        const freighterNetwork = await getFreighterNetwork();

        if (freighterNetwork && freighterNetwork !== networkPassphrase) {
          const selectedName = networkPassphrase.includes('Test') ? 'TESTNET' : 'MAINNET';
          const freighterName = freighterNetwork.includes('Test') ? 'TESTNET' : 'MAINNET';
          const errorMsg = copy.networkMismatch
            .replace('{selected}', selectedName)
            .replace('{freighter}', freighterName)
            .replace('{selected}', selectedName);

          setError(errorMsg);
          toast.error(errorMsg, { duration: 6000 });
          setIsSubmitting(false);
          return;
        }
      }

      const expiresAt = new Date(
        Date.now() + FREE_EXPIRY_MINUTES * 60 * 1000
      ).toISOString();

      const created = await createLink(
        {
          amount: Number(numericAmount.toFixed(2)),
          asset,
          recipientWallet,
          expiresAt,
          networkPassphrase,
          metadata: {
            title: paymentReason.trim() || 'Payment Link',
            description: memo.trim() || undefined,
            reference: metadataReference,
          },
        },
        recipientWallet
      );

      setCreatedLink(created);
      toast.success(copy.createdToast);
    } catch (err: any) {
      const msg = err?.message || copy.failedCreateLink;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 animate-in sm:space-y-8">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="card p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-0">
              {copy.paymentSection}
            </h3>
            <p className="mt-1 text-xs text-ink-3">{copy.paymentHint}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label" htmlFor="payment-amount">
                {copy.amount}
              </label>
              <input
                id="payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                className="input"
                placeholder={copy.amountPlaceholder}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="payment-asset">
                {copy.asset}
              </label>
              <select
                id="payment-asset"
                className="input"
                value={asset}
                onChange={(e) => setAsset(e.target.value as Currency)}
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
                <option value="EURC">EURC</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="payment-expiry">
                {copy.expiresIn}
              </label>
              <div
                id="payment-expiry"
                className="input flex items-center justify-between bg-surface-1 text-ink-1"
              >
                <span>{copy.expiresLocked}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink-1"
                  onClick={() => setProFeature('customExpiry')}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {copy.proBadge}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="payment-reason">
                {copy.paymentReason}
              </label>
              <input
                id="payment-reason"
                type="text"
                className="input"
                placeholder={copy.paymentReasonPlaceholder}
                value={paymentReason}
                onChange={(e) => setPaymentReason(e.target.value)}
                maxLength={300}
              />
            </div>
            <div>
              <label className="label" htmlFor="payment-memo">
                {copy.memo}
              </label>
              <input
                id="payment-memo"
                type="text"
                className="input"
                placeholder={copy.memoPlaceholder}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={240}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-2">
              {copy.receiverSection}
            </h4>
            <div className="mt-3">
              <label className="label" htmlFor="receiver-wallet">
                {copy.payoutWallet}
              </label>
              <input
                id="receiver-wallet"
                type="text"
                className="input font-mono text-xs"
                value={recipientWallet}
                onChange={(e) => setRecipientWallet(e.target.value.trim())}
                readOnly
              />
              <p className="mt-2 text-xs text-ink-3">{copy.payoutWalletHint}</p>
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-0">
                {copy.outputSection}
              </h3>
              <p className="mt-1 text-xs text-ink-3">{copy.outputHint}</p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto"
            >
              {isSubmitting ? copy.generating : copy.generateLink}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {createdLink ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">
                  {copy.checkoutLink}
                </div>
                <code className="block break-all text-xs text-ink-1">
                  {createdLink.checkoutUrl}
                </code>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn-secondary px-3 py-2 text-xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? copy.copied : copy.copyLink}
                  </button>
                  <a
                    href={createdLink.checkoutUrl}
                    className="btn-primary px-3 py-2 text-xs"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {copy.openCheckout}
                  </a>
                </div>
              </div>

              {statusUrl && (
                <div className="rounded-lg border border-border bg-surface-1 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">
                    {copy.statusPage}
                  </div>
                  <code className="block break-all text-xs text-ink-1">{statusUrl}</code>
                  <a
                    href={statusUrl}
                    className="btn-secondary mt-3 px-3 py-2 text-xs"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {copy.openStatus}
                  </a>
                </div>
              )}

              {qrUrl && (
                <div className="rounded-lg border border-border bg-surface-1 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
                    <QrCode className="h-3.5 w-3.5" />
                    {copy.qrCode}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                    <img
                      src={qrUrl}
                      alt={copy.qrCode}
                      className="h-32 w-32 rounded-md border border-border bg-card"
                      loading="lazy"
                    />
                    <p className="text-xs text-ink-3">{copy.qrHint}</p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-ink-1">
                {copy.linkReady}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-ink-3">
              {copy.noLinkYet}
            </div>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-0">
                {copy.advancedSection}
              </h3>
              <p className="mt-1 text-xs text-ink-3">{copy.advancedHint}</p>
            </div>
            <button
              type="button"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="btn-secondary w-full sm:w-auto"
            >
              {advancedOpen ? copy.hideAdvanced : copy.showAdvanced}
            </button>
          </div>

          {advancedOpen && (
            <div className="mt-5 space-y-6 border-t border-border pt-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                  {copy.metadata}
                </h4>
                <p className="mt-1 text-xs text-ink-3">{copy.metadataHint}</p>

                <div className="mt-3 space-y-2">
                  {metadataEntries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr,1fr,auto]">
                      <input
                        type="text"
                        className="input"
                        placeholder={copy.metadataKeyPlaceholder}
                        value={entry.key}
                        onChange={(e) =>
                          updateMetadataRow(entry.id, 'key', e.target.value)
                        }
                        maxLength={30}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder={copy.metadataValuePlaceholder}
                        value={entry.value}
                        onChange={(e) =>
                          updateMetadataRow(entry.id, 'value', e.target.value)
                        }
                        maxLength={60}
                      />
                      <button
                        type="button"
                        onClick={() => removeMetadataRow(entry.id)}
                        className="btn-ghost justify-center md:justify-start"
                        aria-label={copy.removeMetadata}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addMetadataRow}
                    disabled={metadataEntries.length >= MAX_METADATA_ENTRIES}
                    className="btn-secondary px-3 py-2 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {copy.addMetadata}
                  </button>
                  {metadataReference && (
                    <span className="text-xs text-ink-3">
                      {copy.metadataValue}: {metadataReference}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setProFeature('reusable')}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left hover:border-primary/40"
                >
                  <span className="text-sm text-ink-1">Reusable links</span>
                  <span className="inline-flex items-center gap-2 text-xs text-ink-3">
                    <Lock className="h-3.5 w-3.5" />
                    {copy.proBadge}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProFeature('variable')}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left hover:border-primary/40"
                >
                  <span className="text-sm text-ink-1">Variable amount</span>
                  <span className="inline-flex items-center gap-2 text-xs text-ink-3">
                    <Lock className="h-3.5 w-3.5" />
                    {copy.proBadge}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProFeature('invoiceMode')}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left hover:border-primary/40"
                >
                  <span className="text-sm text-ink-1">Invoice mode</span>
                  <span className="inline-flex items-center gap-2 text-xs text-ink-3">
                    <Lock className="h-3.5 w-3.5" />
                    {copy.proBadge}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProFeature('redirectUrl')}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left hover:border-primary/40"
                >
                  <span className="text-sm text-ink-1">Redirect URL after pay</span>
                  <span className="inline-flex items-center gap-2 text-xs text-ink-3">
                    <Lock className="h-3.5 w-3.5" />
                    {copy.proBadge}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProFeature('webhooks')}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left hover:border-primary/40"
                >
                  <span className="text-sm text-ink-1">Webhooks</span>
                  <span className="inline-flex items-center gap-2 text-xs text-ink-3">
                    <Lock className="h-3.5 w-3.5" />
                    {copy.proBadge}
                  </span>
                </button>
              </div>
            </div>
          )}
        </section>
      </form>

      {proFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-5 sm:p-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Lock className="h-3.5 w-3.5" />
              {copy.proModalTitle}
            </div>

            <p className="text-sm text-ink-1">{getProMessage(copy, proFeature)}</p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                onClick={() => setProFeature(null)}
              >
                {copy.keepFree}
              </button>
              <button
                type="button"
                className="btn-primary w-full sm:w-auto"
                onClick={() => {
                  setProFeature(null);
                  navigate('/plans');
                }}
              >
                {copy.upgrade}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
