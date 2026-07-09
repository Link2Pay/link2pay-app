// Public claim page for funding links: /claim/:id#s=SECRET
//
// SECURITY INVARIANT: the fragment secret must never leave this page — no
// requests, no logging, no storage. It is parsed once into a Keypair held in
// component state.
//
// The chain is the source of truth: the DB status is used for friendly
// messaging, but the claim itself is built from live Horizon state and a
// mid-flight race simply fails atomically and re-checks.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Horizon, Keypair, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { Ban, CheckCircle2, ExternalLink, Gift } from 'lucide-react';
import WalletRoller from '../components/Payment/WalletRoller';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { kitSignWith } from '../services/walletsKit';
import { NETWORK_CONFIGS } from '../config/network';
import {
  buildClaimTx,
  detectClaimBranch,
  needsRecipientSignature,
  type FundingSpec,
} from '../lib/fundingLinkTx';
import { stellarExpertUrl } from '../lib/stellarExplorer';
import { getFundingLink, reportFundingLinkClaimed } from '../services/api';
import type { FundingLinkView } from '../services/api';

type PageState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'claimable'; link: FundingLinkView }
  | { kind: 'claiming'; link: FundingLinkView }
  | { kind: 'success'; link: FundingLinkView; txHash: string }
  | { kind: 'gone'; link: FundingLinkView }
  | { kind: 'expired'; link: FundingLinkView };

const COPY: Record<Language, {
  heading: string;
  subheading: string;
  invalidTitle: string;
  invalidDesc: string;
  goneTitle: string;
  goneDesc: string;
  expiredTitle: string;
  expiredDesc: string;
  claiming: string;
  signPrompt: string;
  successTitle: string;
  successDesc: string;
  successXlmNote: string;
  viewTx: string;
  loading: string;
  claimError: string;
  lineFull: string;
  devClaimTo: string;
}> = {
  en: {
    heading: 'You received funds',
    subheading: 'Connect your Stellar wallet to claim them — new, empty wallets work too.',
    invalidTitle: 'Invalid link',
    invalidDesc: 'This funding link is malformed or incomplete. Ask the sender to share it again.',
    goneTitle: 'Already claimed',
    goneDesc: 'The funds in this link were already claimed or taken back by the sender.',
    expiredTitle: 'Link expired',
    expiredDesc: 'This funding link has expired and no longer accepts claims.',
    claiming: 'Claiming…',
    signPrompt: 'Your wallet will ask you to approve receiving the asset.',
    successTitle: 'Funds claimed!',
    successDesc: 'They are now in your wallet.',
    successXlmNote: 'The link\u2019s XLM deposit also arrived to cover your account costs.',
    viewTx: 'View on stellar.expert',
    loading: 'Loading…',
    claimError: 'Claiming failed. The funds have not moved — try again.',
    lineFull: 'Your wallet\u2019s USDC trustline can\u2019t receive this amount.',
    devClaimTo: 'DEV: claim straight to address',
  },
  es: {
    heading: 'Recibiste fondos',
    subheading: 'Conecta tu wallet de Stellar para reclamarlos — también funcionan wallets nuevas y vacías.',
    invalidTitle: 'Link inválido',
    invalidDesc: 'Este link está malformado o incompleto. Pide al remitente que lo comparta de nuevo.',
    goneTitle: 'Ya fue reclamado',
    goneDesc: 'Los fondos de este link ya fueron reclamados o recuperados por el remitente.',
    expiredTitle: 'Link vencido',
    expiredDesc: 'Este link venció y ya no acepta reclamos.',
    claiming: 'Reclamando…',
    signPrompt: 'Tu wallet pedirá aprobar la recepción del activo.',
    successTitle: '¡Fondos reclamados!',
    successDesc: 'Ya están en tu wallet.',
    successXlmNote: 'También llegó el depósito de XLM del link para cubrir los costos de tu cuenta.',
    viewTx: 'Ver en stellar.expert',
    loading: 'Cargando…',
    claimError: 'El reclamo falló. Los fondos no se movieron — intenta de nuevo.',
    lineFull: 'La trustline de USDC de tu wallet no puede recibir este monto.',
    devClaimTo: 'DEV: reclamar directo a dirección',
  },
  pt: {
    heading: 'Você recebeu fundos',
    subheading: 'Conecte sua carteira Stellar para resgatá-los — carteiras novas e vazias também funcionam.',
    invalidTitle: 'Link inválido',
    invalidDesc: 'Este link está malformado ou incompleto. Peça ao remetente para compartilhar de novo.',
    goneTitle: 'Já resgatado',
    goneDesc: 'Os fundos deste link já foram resgatados ou recuperados pelo remetente.',
    expiredTitle: 'Link vencido',
    expiredDesc: 'Este link venceu e não aceita mais resgates.',
    claiming: 'Resgatando…',
    signPrompt: 'Sua carteira pedirá para aprovar o recebimento do ativo.',
    successTitle: 'Fundos resgatados!',
    successDesc: 'Eles já estão na sua carteira.',
    successXlmNote: 'O depósito de XLM do link também chegou para cobrir os custos da sua conta.',
    viewTx: 'Ver no stellar.expert',
    loading: 'Carregando…',
    claimError: 'O resgate falhou. Os fundos não se moveram — tente novamente.',
    lineFull: 'A trustline de USDC da sua carteira não pode receber este valor.',
    devClaimTo: 'DEV: resgatar direto para endereço',
  },
};

export default function ClaimLink() {
  const { id } = useParams<{ id: string }>();
  const { language } = useI18n();
  const copy = COPY[language];
  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [connected, setConnected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devAddress, setDevAddress] = useState('');

  // Parsed once; never leaves the page. `null` = missing or malformed.
  const escrowKeypair = useMemo(() => {
    try {
      const secret = new URLSearchParams(window.location.hash.slice(1)).get('s');
      return secret ? Keypair.fromSecret(secret) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id || !escrowKeypair) {
        setState({ kind: 'invalid' });
        return;
      }
      try {
        const link = await getFundingLink(id);
        if (cancelled) return;
        if (escrowKeypair.publicKey() !== link.escrowAccount) {
          setState({ kind: 'invalid' });
        } else if (link.status === 'CLAIMED' || link.status === 'RECLAIMED') {
          setState({ kind: 'gone', link });
        } else if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
          setState({ kind: 'expired', link });
        } else {
          setState({ kind: 'claimable', link });
        }
      } catch {
        if (!cancelled) setState({ kind: 'invalid' });
      }
    })();
    return () => { cancelled = true; };
  }, [id, escrowKeypair]);

  const handleClaim = useCallback(
    async (recipient: string) => {
      if (state.kind !== 'claimable' || !escrowKeypair || !id) return;
      const link = state.link;
      setError(null);
      setState({ kind: 'claiming', link });
      const network = link.networkPassphrase.includes('Test')
        ? NETWORK_CONFIGS.testnet
        : NETWORK_CONFIGS.mainnet;
      const spec: FundingSpec = {
        asset: link.asset,
        amount: link.amount,
        usdcIssuer: network.usdcIssuer,
        networkPassphrase: link.networkPassphrase,
      };
      const server = new Horizon.Server(network.horizonUrl);
      try {
        let escrowAccount: Horizon.AccountResponse;
        try {
          escrowAccount = await server.loadAccount(link.escrowAccount);
        } catch {
          // escrow gone: someone else claimed (or the sender reclaimed) —
          // let the backend reconcile from Horizon, then show the state
          const updated = await reportFundingLinkClaimed(id, '0'.repeat(64)).catch(() => link);
          setState({ kind: 'gone', link: updated });
          return;
        }
        const coSigner =
          escrowAccount.signers.find((s) => s.key !== link.escrowAccount)?.key ?? link.escrowAccount;
        const branch = await detectClaimBranch(server, recipient, spec);
        let tx: Transaction = buildClaimTx(escrowAccount, coSigner, recipient, branch, spec);
        if (needsRecipientSignature(spec, branch)) {
          const signedXdr = await kitSignWith(recipient, tx.toXDR(), link.networkPassphrase);
          tx = TransactionBuilder.fromXDR(signedXdr, link.networkPassphrase) as Transaction;
        }
        tx.sign(escrowKeypair);
        const result = await server.submitTransaction(tx);
        reportFundingLinkClaimed(id, result.hash).catch(() => {
          // chain already settled; the backend self-heals on its next read
        });
        setState({ kind: 'success', link, txHash: result.hash });
      } catch (err: any) {
        setError(err?.message === 'LINE_FULL' ? copy.lineFull : copy.claimError);
        setState({ kind: 'claimable', link });
      }
    },
    [state, escrowKeypair, id, copy]
  );

  const card = (children: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-3 bg-card p-6">{children}</div>
    </div>
  );

  if (state.kind === 'loading') {
    return card(<p className="py-8 text-center text-sm text-ink-3">{copy.loading}</p>);
  }

  if (state.kind === 'invalid') {
    return card(
      <div className="py-6 text-center">
        <Ban className="mx-auto h-10 w-10 text-danger" aria-hidden="true" />
        <p className="mt-3 text-base font-semibold text-ink-0">{copy.invalidTitle}</p>
        <p className="mt-1 text-sm text-ink-3">{copy.invalidDesc}</p>
      </div>
    );
  }

  if (state.kind === 'gone' || state.kind === 'expired') {
    const title = state.kind === 'gone' ? copy.goneTitle : copy.expiredTitle;
    const desc = state.kind === 'gone' ? copy.goneDesc : copy.expiredDesc;
    return card(
      <div className="py-6 text-center">
        <Ban className="mx-auto h-10 w-10 text-ink-3" aria-hidden="true" />
        <p className="mt-3 text-base font-semibold text-ink-0">{title}</p>
        <p className="mt-1 text-sm text-ink-3">{desc}</p>
        {state.link.claimTxHash && (
          <a
            href={stellarExpertUrl('tx', state.link.claimTxHash, state.link.networkPassphrase)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-4 inline-flex text-sm"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {copy.viewTx}
          </a>
        )}
      </div>
    );
  }

  if (state.kind === 'success') {
    return card(
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
        <p className="mt-3 text-base font-semibold text-ink-0">{copy.successTitle}</p>
        <p className="mt-1 text-2xl font-bold text-ink-0 [font-variant-numeric:tabular-nums]">
          {state.link.amount} {state.link.asset}
        </p>
        <p className="mt-1 text-sm text-ink-3">{copy.successDesc}</p>
        {state.link.asset === 'USDC' && (
          <p className="mt-1 text-xs text-ink-3">{copy.successXlmNote}</p>
        )}
        <a
          href={stellarExpertUrl('tx', state.txHash, state.link.networkPassphrase)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-4 inline-flex text-sm"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {copy.viewTx}
        </a>
      </div>
    );
  }

  // claimable | claiming
  const link = state.link;
  const busy = state.kind === 'claiming';
  return card(
    <div className="space-y-4">
      <div className="text-center">
        <Gift className="mx-auto h-10 w-10 text-accent-ink" aria-hidden="true" />
        <p className="mt-3 text-base font-semibold text-ink-0">{copy.heading}</p>
        <p className="mt-1 text-3xl font-bold text-ink-0 [font-variant-numeric:tabular-nums]">
          {link.amount} {link.asset}
        </p>
        <p className="mt-2 text-sm text-ink-3">{busy ? copy.signPrompt : copy.subheading}</p>
      </div>

      {busy ? (
        <p className="py-4 text-center text-sm font-semibold text-ink-1 animate-pulse">{copy.claiming}</p>
      ) : (
        <WalletRoller
          networkPassphrase={link.networkPassphrase}
          onConnect={(address) => { setConnected(address); handleClaim(address); }}
          connectedAddress={connected}
        />
      )}

      {import.meta.env.DEV && !busy && (
        <div className="flex gap-2 border-t border-surface-3 pt-3">
          <input
            type="text"
            data-testid="dev-claim-address"
            className="input flex-1 font-mono text-xs"
            placeholder={copy.devClaimTo}
            value={devAddress}
            onChange={(e) => setDevAddress(e.target.value)}
          />
          <button
            type="button"
            data-testid="dev-claim-submit"
            onClick={() => devAddress && handleClaim(devAddress.trim())}
            className="btn-secondary text-xs"
          >
            →
          </button>
        </div>
      )}

      {error && <p className="text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
