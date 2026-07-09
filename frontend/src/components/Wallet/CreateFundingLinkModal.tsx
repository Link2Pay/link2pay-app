// Create a funding link: escrow keypair is generated HERE in the browser and
// its secret goes only into the URL fragment shown once to the user — it is
// never sent to the backend, logged, or stored. See fundingLinkTx.ts for the
// on-chain mechanism.
import { useMemo, useState } from 'react';
import { Keypair, Horizon, TransactionBuilder } from '@stellar/stellar-sdk';
import { X, Gift, Copy, Check, Share2 } from 'lucide-react';
import Select from '../ui/Select';
import ShareLinkModal from '../Invoice/ShareLinkModal';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import { getKnownAssetIssuer, RESOLVED_NETWORK } from '../../config/network';
import { spendableXlm } from '../../lib/stellarReserves';
import {
  buildCreateEscrowTx,
  USDC_ESCROW_XLM,
  XLM_ESCROW_EXTRA,
  type FundingSpec,
} from '../../lib/fundingLinkTx';
import { activateFundingLink, createFundingLink } from '../../services/api';
import type { WalletBalance } from '../../services/api';

interface Props {
  balances: WalletBalance[];
  onClose: () => void;
  onCreated: () => void;
}

const COPY: Record<Language, {
  title: string;
  asset: string;
  amount: string;
  available: string;
  expiry: string;
  expiryHint: string;
  deposit: string;
  depositHint: string;
  create: string;
  creating: string;
  close: string;
  readyTitle: string;
  readyWarning: string;
  copyLink: string;
  copied: string;
  shareImage: string;
  invalidAmount: string;
  overBalance: string;
  needXlm: string;
  failed: string;
}> = {
  en: {
    title: 'Create funding link',
    asset: 'Asset',
    amount: 'Amount',
    available: 'Available',
    expiry: 'Expiry (optional)',
    expiryHint: 'After this date the link stops accepting claims; you can always reclaim.',
    deposit: 'Network deposit',
    depositHint: 'Goes to whoever claims (covers their account costs) — or back to you on reclaim.',
    create: 'Create link',
    creating: 'Creating…',
    close: 'Close',
    readyTitle: 'Link ready — save it now',
    readyWarning: 'Anyone with this link can claim the funds, and it cannot be shown again. You can cancel & reclaim from this page anytime.',
    copyLink: 'Copy link',
    copied: 'Copied!',
    shareImage: 'Share image',
    invalidAmount: 'Enter a valid amount.',
    overBalance: 'Amount exceeds the available balance.',
    needXlm: 'Not enough spendable XLM for the network deposit.',
    failed: 'Creating the link failed. Nothing left your wallet.',
  },
  es: {
    title: 'Crear link con fondos',
    asset: 'Activo',
    amount: 'Monto',
    available: 'Disponible',
    expiry: 'Vencimiento (opcional)',
    expiryHint: 'Después de esta fecha el link deja de aceptar reclamos; siempre puedes recuperar.',
    deposit: 'Depósito de red',
    depositHint: 'Va a quien reclame (cubre los costos de su cuenta) — o vuelve a ti al recuperar.',
    create: 'Crear link',
    creating: 'Creando…',
    close: 'Cerrar',
    readyTitle: 'Link listo — guárdalo ahora',
    readyWarning: 'Cualquiera con este link puede reclamar los fondos, y no se puede mostrar de nuevo. Puedes cancelar y recuperar desde esta página cuando quieras.',
    copyLink: 'Copiar link',
    copied: '¡Copiado!',
    shareImage: 'Compartir imagen',
    invalidAmount: 'Ingresa un monto válido.',
    overBalance: 'El monto supera el saldo disponible.',
    needXlm: 'No hay XLM suficiente para el depósito de red.',
    failed: 'La creación del link falló. Nada salió de tu wallet.',
  },
  pt: {
    title: 'Criar link com fundos',
    asset: 'Ativo',
    amount: 'Valor',
    available: 'Disponível',
    expiry: 'Validade (opcional)',
    expiryHint: 'Após esta data o link deixa de aceitar resgates; você sempre pode recuperar.',
    deposit: 'Depósito de rede',
    depositHint: 'Vai para quem resgatar (cobre os custos da conta) — ou volta para você ao recuperar.',
    create: 'Criar link',
    creating: 'Criando…',
    close: 'Fechar',
    readyTitle: 'Link pronto — salve agora',
    readyWarning: 'Qualquer pessoa com este link pode resgatar os fundos, e ele não pode ser mostrado de novo. Você pode cancelar e recuperar desta página quando quiser.',
    copyLink: 'Copiar link',
    copied: 'Copiado!',
    shareImage: 'Compartilhar imagem',
    invalidAmount: 'Informe um valor válido.',
    overBalance: 'O valor excede o saldo disponível.',
    needXlm: 'XLM insuficiente para o depósito de rede.',
    failed: 'A criação do link falhou. Nada saiu da sua carteira.',
  },
};

export default function CreateFundingLinkModal({ balances, onClose, onCreated }: Props) {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey, signTransaction } = useWalletStore();
  const { horizonUrl, networkPassphrase } = useNetworkStore();

  const hasUsdc = balances.some((b) => b.code === 'USDC');
  const [asset, setAsset] = useState<'XLM' | 'USDC'>(hasUsdc ? 'USDC' : 'XLM');
  const [amount, setAmount] = useState('');
  const [expiry, setExpiry] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const xlmBalance = parseFloat(balances.find((b) => b.code === 'XLM')?.balance ?? '0');
  const trustlines = balances.filter((b) => b.code !== 'XLM').length;
  const xlmSpendable = spendableXlm(xlmBalance, trustlines);
  const usdcBalance = parseFloat(balances.find((b) => b.code === 'USDC')?.balance ?? '0');

  const spec = useMemo<FundingSpec | null>(() => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) return null;
    return {
      asset,
      amount: value.toFixed(7).replace(/\.?0+$/, ''),
      usdcIssuer: getKnownAssetIssuer('USDC', RESOLVED_NETWORK) ?? '',
      networkPassphrase,
    };
  }, [asset, amount, networkPassphrase]);

  const depositLabel = asset === 'USDC' ? `${USDC_ESCROW_XLM} XLM` : `${XLM_ESCROW_EXTRA} XLM`;
  const maxAmount = asset === 'USDC' ? usdcBalance : Math.max(0, xlmSpendable - XLM_ESCROW_EXTRA);

  const validate = (): string | null => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) return copy.invalidAmount;
    if (value > maxAmount) return copy.overBalance;
    if (asset === 'USDC' && xlmSpendable < parseFloat(USDC_ESCROW_XLM)) return copy.needXlm;
    return null;
  };

  const handleCreate = async () => {
    if (!publicKey || !spec || creating) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const escrow = Keypair.random();
      const { id } = await createFundingLink(
        {
          asset,
          amount: parseFloat(spec.amount),
          escrowAccount: escrow.publicKey(),
          networkPassphrase,
          ...(expiry ? { expiresAt: new Date(`${expiry}T23:59:59`).toISOString() } : {}),
        },
        publicKey
      );
      const server = new Horizon.Server(horizonUrl);
      const sender = await server.loadAccount(publicKey);
      const tx = buildCreateEscrowTx(sender, publicKey, escrow.publicKey(), spec);
      const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);
      const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      signed.sign(escrow);
      const result = await server.submitTransaction(signed);
      await activateFundingLink(id, result.hash, publicKey);
      setClaimUrl(`${window.location.origin}/claim/${id}#s=${escrow.secret()}`);
      onCreated();
    } catch (err: any) {
      setError(
        err?.message && typeof err.message === 'string'
          ? `${copy.failed} (${err.message.slice(0, 120)})`
          : copy.failed
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!claimUrl) return;
    await navigator.clipboard.writeText(claimUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const assetOptions = [
    ...(hasUsdc ? [{ label: 'USDC', value: 'USDC' }] : []),
    { label: 'XLM', value: 'XLM' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-popover p-4 shadow-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-0">{copy.title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {claimUrl ? (
          <div className="space-y-3">
            <p className="text-base font-semibold text-ink-0">{copy.readyTitle}</p>
            <p className="text-xs text-warning">{copy.readyWarning}</p>
            <input
              type="text"
              readOnly
              value={claimUrl}
              className="input w-full font-mono text-xs"
              onFocus={(e) => e.target.select()}
            />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={handleCopy} className="btn-primary text-sm">
                {copiedLink ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copiedLink ? copy.copied : copy.copyLink}
              </button>
              <button type="button" onClick={() => setShareOpen(true)} className="btn-secondary text-sm">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {copy.shareImage}
              </button>
            </div>
            <button type="button" onClick={onClose} className="btn-ghost w-full text-sm">
              {copy.close}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="funding-asset">{copy.asset}</label>
              <Select
                id="funding-asset"
                value={asset}
                options={assetOptions}
                onChange={(value) => setAsset(value as 'XLM' | 'USDC')}
              />
              <p className="mt-1 text-xs text-ink-3 [font-variant-numeric:tabular-nums]">
                {copy.available}: {maxAmount.toFixed(2)} {asset}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="funding-amount">{copy.amount}</label>
              <input
                id="funding-amount"
                type="text"
                inputMode="decimal"
                className="input w-full font-mono text-sm [font-variant-numeric:tabular-nums]"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value.replace(',', '.')); setError(null); }}
              />
            </div>

            <div>
              <label className="label" htmlFor="funding-expiry">{copy.expiry}</label>
              <input
                id="funding-expiry"
                type="date"
                className="input w-full text-sm"
                value={expiry}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                onChange={(e) => setExpiry(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-3">{copy.expiryHint}</p>
            </div>

            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs font-semibold text-ink-1 [font-variant-numeric:tabular-nums]">
                {copy.deposit}: {depositLabel}
              </p>
              <p className="mt-0.5 text-xs text-ink-3">{copy.depositHint}</p>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !amount}
              className="btn-primary w-full text-sm"
            >
              <Gift className="h-4 w-4" aria-hidden="true" />
              {creating ? copy.creating : copy.create}
            </button>
          </div>
        )}
      </div>

      {shareOpen && claimUrl && spec && (
        <ShareLinkModal
          paymentLink={claimUrl}
          amountLabel={`${spec.amount} ${asset}`}
          name={null}
          invoiceNumber="funding-link"
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
