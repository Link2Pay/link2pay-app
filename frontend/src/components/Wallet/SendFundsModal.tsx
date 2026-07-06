// Withdraw crypto from the connected wallet: pick an asset you hold, enter a
// destination and amount, sign with the connected wallet (extension or Privy
// embedded) and submit. Non-custodial — the transaction goes straight from
// the user's wallet through Horizon; we never hold the funds.
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { X, SendHorizonal, CheckCircle2, ExternalLink } from 'lucide-react';
import Select from '../ui/Select';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import { stellarExpertUrl } from '../../lib/stellarExplorer';
import type { WalletBalance } from '../../services/api';

interface Props {
  balances: WalletBalance[];
  onClose: () => void;
  onSent: () => void;
}

const COPY: Record<Language, {
  title: string;
  asset: string;
  destination: string;
  destinationPlaceholder: string;
  amount: string;
  max: string;
  available: string;
  memo: string;
  memoHint: string;
  send: string;
  sending: string;
  close: string;
  sentTitle: string;
  sentDesc: string;
  viewTx: string;
  invalidAddress: string;
  selfSend: string;
  invalidAmount: string;
  overMax: string;
  memoTooLong: string;
  destNotActivated: string;
  destNoTrustline: string;
  failed: string;
}> = {
  en: {
    title: 'Send funds',
    asset: 'Asset',
    destination: 'Destination address',
    destinationPlaceholder: 'G…',
    amount: 'Amount',
    max: 'Max',
    available: 'Available',
    memo: 'Memo (optional)',
    memoHint: 'Required by most exchanges — check the deposit instructions.',
    send: 'Send',
    sending: 'Sending…',
    close: 'Close',
    sentTitle: 'Sent!',
    sentDesc: 'The transaction was confirmed on Stellar.',
    viewTx: 'View on stellar.expert',
    invalidAddress: 'Enter a valid Stellar address (starts with G).',
    selfSend: 'That is this wallet’s own address.',
    invalidAmount: 'Enter a valid amount.',
    overMax: 'Amount exceeds the available balance.',
    memoTooLong: 'Memo must be 28 characters or fewer.',
    destNotActivated: 'That account isn’t activated yet. Send it at least 1 XLM first, or lower to XLM.',
    destNoTrustline: 'The destination can’t receive this asset (missing trustline).',
    failed: 'The transaction failed. Nothing left your wallet.',
  },
  es: {
    title: 'Enviar fondos',
    asset: 'Activo',
    destination: 'Dirección de destino',
    destinationPlaceholder: 'G…',
    amount: 'Monto',
    max: 'Máx',
    available: 'Disponible',
    memo: 'Memo (opcional)',
    memoHint: 'La mayoría de exchanges lo exigen — revisa las instrucciones de depósito.',
    send: 'Enviar',
    sending: 'Enviando…',
    close: 'Cerrar',
    sentTitle: '¡Enviado!',
    sentDesc: 'La transacción se confirmó en Stellar.',
    viewTx: 'Ver en stellar.expert',
    invalidAddress: 'Ingresa una dirección de Stellar válida (empieza con G).',
    selfSend: 'Esa es la dirección de esta misma wallet.',
    invalidAmount: 'Ingresa un monto válido.',
    overMax: 'El monto supera el saldo disponible.',
    memoTooLong: 'El memo debe tener 28 caracteres o menos.',
    destNotActivated: 'Esa cuenta aún no está activada. Envíale al menos 1 XLM primero, o cambia a XLM.',
    destNoTrustline: 'El destino no puede recibir este activo (le falta la trustline).',
    failed: 'La transacción falló. Nada salió de tu wallet.',
  },
  pt: {
    title: 'Enviar fundos',
    asset: 'Ativo',
    destination: 'Endereço de destino',
    destinationPlaceholder: 'G…',
    amount: 'Valor',
    max: 'Máx',
    available: 'Disponível',
    memo: 'Memo (opcional)',
    memoHint: 'A maioria das exchanges exige — confira as instruções de depósito.',
    send: 'Enviar',
    sending: 'Enviando…',
    close: 'Fechar',
    sentTitle: 'Enviado!',
    sentDesc: 'A transação foi confirmada na Stellar.',
    viewTx: 'Ver no stellar.expert',
    invalidAddress: 'Informe um endereço Stellar válido (começa com G).',
    selfSend: 'Esse é o endereço desta própria carteira.',
    invalidAmount: 'Informe um valor válido.',
    overMax: 'O valor excede o saldo disponível.',
    memoTooLong: 'O memo deve ter 28 caracteres ou menos.',
    destNotActivated: 'Essa conta ainda não está ativada. Envie ao menos 1 XLM primeiro, ou mude para XLM.',
    destNoTrustline: 'O destino não pode receber este ativo (falta a trustline).',
    failed: 'A transação falhou. Nada saiu da sua carteira.',
  },
};

export default function SendFundsModal({ balances, onClose, onSent }: Props) {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey, signTransaction } = useWalletStore();
  const { horizonUrl, networkPassphrase } = useNetworkStore();

  const [assetCode, setAssetCode] = useState(balances[0]?.code ?? 'XLM');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const selected = balances.find((b) => b.code === assetCode) ?? balances[0];

  // XLM keeps the base reserve locked: 1 XLM base + 0.5 per subentry (each
  // non-XLM balance is a trustline) + headroom for fees. Other assets are
  // fully spendable.
  const maxAmount = useMemo(() => {
    if (!selected) return 0;
    const bal = parseFloat(selected.balance);
    if (selected.code !== 'XLM') return bal;
    const trustlines = balances.filter((b) => b.code !== 'XLM').length;
    return Math.max(0, bal - (1 + 0.5 * trustlines) - 0.1);
  }, [selected, balances]);

  const validate = (): string | null => {
    const dest = destination.trim();
    if (!StrKey.isValidEd25519PublicKey(dest)) return copy.invalidAddress;
    if (dest === publicKey) return copy.selfSend;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) return copy.invalidAmount;
    if (value > maxAmount) return copy.overMax;
    if (new TextEncoder().encode(memo.trim()).length > 28) return copy.memoTooLong;
    return null;
  };

  const handleSend = async () => {
    if (!publicKey || !selected || sending) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSending(true);
    try {
      const server = new Horizon.Server(horizonUrl);
      const dest = destination.trim();
      const value = parseFloat(amount).toFixed(7).replace(/\.?0+$/, '');
      const isNative = selected.code === 'XLM';
      const asset = isNative ? Asset.native() : new Asset(selected.code, selected.issuer!);

      // Destination checks up front so failures are human-readable instead of
      // Horizon op codes: unfunded accounts can only be created with XLM, and
      // asset payments need the receiving trustline.
      let destExists = true;
      try {
        const destAccount = await server.loadAccount(dest);
        if (!isNative) {
          const hasTrustline = destAccount.balances.some(
            (b) => 'asset_code' in b && b.asset_code === selected.code && 'asset_issuer' in b && b.asset_issuer === selected.issuer
          );
          if (!hasTrustline) {
            setError(copy.destNoTrustline);
            return;
          }
        }
      } catch {
        destExists = false;
        if (!isNative || parseFloat(value) < 1) {
          setError(copy.destNotActivated);
          return;
        }
      }

      const account = await server.loadAccount(publicKey);
      const builder = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase }).addOperation(
        destExists
          ? Operation.payment({ destination: dest, asset, amount: value })
          : Operation.createAccount({ destination: dest, startingBalance: value })
      );
      const memoText = memo.trim();
      if (memoText) builder.addMemo(Memo.text(memoText));
      const tx = builder.setTimeout(180).build();

      const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);
      const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const result = await server.submitTransaction(signed);

      setTxHash(result.hash);
      toast.success(copy.sentTitle);
      onSent();
    } catch (err: any) {
      setError(err?.message && typeof err.message === 'string' ? `${copy.failed} (${err.message.slice(0, 120)})` : copy.failed);
    } finally {
      setSending(false);
    }
  };

  const assetOptions = balances.map((b) => ({ label: b.code, value: b.code }));

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

        {txHash ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
            <p className="mt-3 text-base font-semibold text-ink-0">{copy.sentTitle}</p>
            <p className="mt-1 text-sm text-ink-3">{copy.sentDesc}</p>
            <a
              href={stellarExpertUrl('tx', txHash, networkPassphrase)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-4 inline-flex text-sm"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {copy.viewTx}
            </a>
            <button type="button" onClick={onClose} className="btn-ghost mt-2 w-full text-sm">
              {copy.close}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="send-asset">{copy.asset}</label>
              <Select id="send-asset" value={assetCode} options={assetOptions} onChange={setAssetCode} />
              {selected && (
                <p className="mt-1 text-xs text-ink-3 [font-variant-numeric:tabular-nums]">
                  {copy.available}: {maxAmount.toFixed(selected.code === 'XLM' ? 2 : 2)} {selected.code}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="send-destination">{copy.destination}</label>
              <input
                id="send-destination"
                type="text"
                className="input font-mono text-sm"
                placeholder={copy.destinationPlaceholder}
                value={destination}
                onChange={(e) => { setDestination(e.target.value); setError(null); }}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="label" htmlFor="send-amount">{copy.amount}</label>
              <div className="flex gap-2">
                <input
                  id="send-amount"
                  type="text"
                  inputMode="decimal"
                  className="input flex-1 font-mono text-sm [font-variant-numeric:tabular-nums]"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value.replace(',', '.')); setError(null); }}
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(maxAmount > 0 ? Number(maxAmount.toFixed(7)) : 0))}
                  className="btn-secondary shrink-0 text-xs"
                >
                  {copy.max}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="send-memo">{copy.memo}</label>
              <input
                id="send-memo"
                type="text"
                className="input text-sm"
                value={memo}
                maxLength={28}
                onChange={(e) => { setMemo(e.target.value); setError(null); }}
              />
              <p className="mt-1 text-xs text-ink-3">{copy.memoHint}</p>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !destination || !amount}
              className="btn-primary w-full text-sm"
            >
              <SendHorizonal className="h-4 w-4" aria-hidden="true" />
              {sending ? copy.sending : copy.send}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
