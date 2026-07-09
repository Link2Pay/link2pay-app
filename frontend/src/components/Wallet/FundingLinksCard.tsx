// The creator's funding links: status, expiry, and Cancel & reclaim. The
// dashboard can never re-show a claim URL (the secret was never stored) —
// reclaim works because the creator is co-signer on every escrow.
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Horizon, TransactionBuilder } from '@stellar/stellar-sdk';
import { Clock, ExternalLink, Undo2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import { getKnownAssetIssuer, RESOLVED_NETWORK } from '../../config/network';
import { buildReclaimTx } from '../../lib/fundingLinkTx';
import { stellarExpertUrl } from '../../lib/stellarExplorer';
import { shortenAddress } from '../../lib/format';
import { listFundingLinks, reportFundingLinkReclaimed } from '../../services/api';
import type { FundingLinkView } from '../../services/api';

const COPY: Record<Language, {
  title: string;
  hint: string;
  empty: string;
  reclaim: string;
  reclaiming: string;
  reclaimed: string;
  viewTx: string;
  expired: string;
  expires: string;
  statusActive: string;
  statusPending: string;
  statusClaimed: string;
  statusReclaimed: string;
  failed: string;
}> = {
  en: {
    title: 'Funding links',
    hint: 'Links you loaded with funds. The claim URL is only shown at creation — but you can always cancel & reclaim here.',
    empty: 'No funding links yet.',
    reclaim: 'Cancel & reclaim',
    reclaiming: 'Reclaiming…',
    reclaimed: 'Funds reclaimed',
    viewTx: 'View on stellar.expert',
    expired: 'Expired',
    expires: 'Expires',
    statusActive: 'Active',
    statusPending: 'Pending',
    statusClaimed: 'Claimed',
    statusReclaimed: 'Reclaimed',
    failed: 'Reclaim failed. The funds are still in the escrow.',
  },
  es: {
    title: 'Links con fondos',
    hint: 'Links que cargaste con fondos. La URL solo se muestra al crearlos — pero aquí siempre puedes cancelar y recuperar.',
    empty: 'Aún no hay links con fondos.',
    reclaim: 'Cancelar y recuperar',
    reclaiming: 'Recuperando…',
    reclaimed: 'Fondos recuperados',
    viewTx: 'Ver en stellar.expert',
    expired: 'Vencido',
    expires: 'Vence',
    statusActive: 'Activo',
    statusPending: 'Pendiente',
    statusClaimed: 'Reclamado',
    statusReclaimed: 'Recuperado',
    failed: 'La recuperación falló. Los fondos siguen en el escrow.',
  },
  pt: {
    title: 'Links com fundos',
    hint: 'Links que você carregou com fundos. A URL só aparece na criação — mas aqui você sempre pode cancelar e recuperar.',
    empty: 'Ainda não há links com fundos.',
    reclaim: 'Cancelar e recuperar',
    reclaiming: 'Recuperando…',
    reclaimed: 'Fundos recuperados',
    viewTx: 'Ver no stellar.expert',
    expired: 'Vencido',
    expires: 'Vence',
    statusActive: 'Ativo',
    statusPending: 'Pendente',
    statusClaimed: 'Resgatado',
    statusReclaimed: 'Recuperado',
    failed: 'A recuperação falhou. Os fundos continuam no escrow.',
  },
};

export default function FundingLinksCard({ refreshKey }: { refreshKey: number }) {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey, signTransaction } = useWalletStore();
  const { horizonUrl, networkPassphrase } = useNetworkStore();
  const [links, setLinks] = useState<FundingLinkView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reclaimingId, setReclaimingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!publicKey) return;
    try {
      setLinks(await listFundingLinks(publicKey));
    } catch {
      // list is non-critical; the card just stays as-is
    } finally {
      setLoaded(true);
    }
  }, [publicKey]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleReclaim = async (link: FundingLinkView) => {
    if (!publicKey || reclaimingId) return;
    setReclaimingId(link.id);
    try {
      const server = new Horizon.Server(horizonUrl);
      const escrow = await server.loadAccount(link.escrowAccount);
      const tx = buildReclaimTx(escrow, publicKey, {
        asset: link.asset,
        amount: link.amount,
        usdcIssuer: getKnownAssetIssuer('USDC', RESOLVED_NETWORK) ?? '',
        networkPassphrase,
      });
      const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);
      const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const result = await server.submitTransaction(signed);
      await reportFundingLinkReclaimed(link.id, result.hash, publicKey);
      toast.success(copy.reclaimed);
      await load();
    } catch {
      toast.error(copy.failed);
    } finally {
      setReclaimingId(null);
    }
  };

  if (!loaded || links.length === 0) return null;

  const statusLabel: Record<FundingLinkView['status'], string> = {
    ACTIVE: copy.statusActive,
    PENDING: copy.statusPending,
    CLAIMED: copy.statusClaimed,
    RECLAIMED: copy.statusReclaimed,
  };
  const statusTone: Record<FundingLinkView['status'], string> = {
    ACTIVE: 'bg-success/10 text-success',
    PENDING: 'bg-warning/10 text-warning',
    CLAIMED: 'bg-accent-ink/10 text-accent-ink',
    RECLAIMED: 'bg-surface-2 text-ink-3',
  };

  return (
    <div className="rounded-2xl border border-surface-3 bg-card p-4">
      <p className="text-sm font-semibold text-ink-0">{copy.title}</p>
      <p className="mt-0.5 text-xs text-ink-3">{copy.hint}</p>
      <ul className="mt-3 divide-y divide-surface-3">
        {links.map((link) => {
          const isExpired = !!link.expiresAt && new Date(link.expiresAt).getTime() < Date.now();
          return (
            <li key={link.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="font-mono text-sm text-ink-0 [font-variant-numeric:tabular-nums]">
                {link.amount} {link.asset}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${statusTone[link.status]}`}>
                {statusLabel[link.status]}
              </span>
              {link.expiresAt && link.status === 'ACTIVE' && (
                <span className={`flex items-center gap-1 text-2xs ${isExpired ? 'text-danger' : 'text-ink-3'}`}>
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {isExpired ? copy.expired : `${copy.expires} ${new Date(link.expiresAt).toLocaleDateString()}`}
                </span>
              )}
              <span className="ml-auto flex items-center gap-2">
                {link.status === 'CLAIMED' && link.claimedBy && (
                  <span className="font-mono text-2xs text-ink-3">{shortenAddress(link.claimedBy, 6, 4)}</span>
                )}
                {link.claimTxHash && (
                  <a
                    href={stellarExpertUrl('tx', link.claimTxHash, link.networkPassphrase)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-ink hover:underline"
                    aria-label={copy.viewTx}
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                {link.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleReclaim(link)}
                    disabled={reclaimingId !== null}
                    className="btn-ghost text-xs"
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {reclaimingId === link.id ? copy.reclaiming : copy.reclaim}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
