import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  Asset,
  BASE_FEE,
  Horizon,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Plus,
  QrCode,
  RefreshCw,
  Wallet as WalletIcon,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import { useWalletBalances } from '../hooks/useWalletBalances';
import { getKnownAssetIssuer } from '../config/network';
import { CURRENCY_SYMBOLS } from '../config';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    balanceLabel: string;
    balanceHint: string;
    refresh: string;
    balanceError: string;
    networkLabel: string;
    testnet: string;
    mainnet: string;
    pending: string;
    assetsTrackedCount: string;
    receiveEyebrow: string;
    receiveTitle: string;
    receiveHint: string;
    receivePendingTitle: string;
    receivePendingHint: string;
    assetsEyebrow: string;
    assetsTitle: string;
    assetsHint: string;
    noAssetsDesc: string;
    assetPrimary: string;
    assetAvailable: string;
    setupEyebrow: string;
    setupTitle: string;
    setupPendingTitle: string;
    setupPendingDesc: string;
    setupReadyTitle: string;
    setupReadyDesc: string;
    getPaidEyebrow: string;
    getPaidTitle: string;
    noAssets: string;
    active: string;
    copyAddress: string;
    copied: string;
    enableUsdcTitle: string;
    enableUsdcDesc: string;
    addTrustCta: string;
    addingTrust: string;
    trustAdded: string;
    trustFailed: string;
    lowXlmHint: string;
    getPaidNote: string;
    getPaidPendingNote: string;
    getPaidCta: string;
    notConnected: string;
  }
> = {
  en: {
    title: 'Wallet',
    subtitle: 'Funding, balances, and wallet setup on Stellar.',
    balanceLabel: 'Balance',
    balanceHint: 'Current funds detected for this wallet on Stellar.',
    refresh: 'Refresh',
    balanceError: "We couldn't refresh wallet balances right now.",
    networkLabel: 'Network',
    testnet: 'Testnet',
    mainnet: 'Mainnet',
    pending: 'Pending',
    assetsTrackedCount: 'assets',
    receiveEyebrow: 'Receive',
    receiveTitle: 'Receive funds',
    receiveHint: 'Share this address or scan the QR to fund the wallet with XLM, USDC, or EURC.',
    receivePendingTitle: 'Activate wallet',
    receivePendingHint: 'Send at least 1 XLM to this address to activate the account on Stellar.',
    assetsEyebrow: 'Assets',
    assetsTitle: 'On-chain balances',
    assetsHint: 'Current holdings detected for this wallet.',
    noAssetsDesc: 'Once the wallet is funded, balances will appear here.',
    assetPrimary: 'Primary asset',
    assetAvailable: 'Available on Stellar',
    setupEyebrow: 'Setup',
    setupTitle: 'Wallet setup',
    setupPendingTitle: 'Activation required first',
    setupPendingDesc: 'Activate the wallet before enabling additional assets like USDC.',
    setupReadyTitle: 'USDC is ready',
    setupReadyDesc: 'This wallet already has the trustline needed to receive USDC.',
    getPaidEyebrow: 'Next step',
    getPaidTitle: 'Collect with a QR or payment link',
    noAssets: 'No assets yet',
    active: 'Active',
    copyAddress: 'Copy address',
    copied: 'Copied',
    enableUsdcTitle: 'Enable USDC',
    enableUsdcDesc: 'Add a USDC trustline so your wallet can hold and receive USD Coin.',
    addTrustCta: 'Add USDC trustline',
    addingTrust: 'Adding trustline…',
    trustAdded: 'USDC trustline added',
    trustFailed: 'Could not add trustline',
    lowXlmHint: 'Needs ~0.5 XLM of free reserve to add a trustline. Top up XLM first.',
    getPaidNote:
      'Move from wallet setup to a customer-facing payment request without redefining the destination.',
    getPaidPendingNote:
      'After activation, generate a QR or payment link for customers from this same wallet.',
    getPaidCta: 'Open Get Paid',
    notConnected: 'Connect your wallet to manage balances and funding.',
  },
  es: {
    title: 'Wallet',
    subtitle: 'Fondos, saldos y configuracion de wallet en Stellar.',
    balanceLabel: 'Saldo',
    balanceHint: 'Fondos detectados actualmente para esta wallet en Stellar.',
    refresh: 'Actualizar',
    balanceError: 'No pudimos actualizar los saldos de la wallet en este momento.',
    networkLabel: 'Red',
    testnet: 'Testnet',
    mainnet: 'Mainnet',
    pending: 'Pendiente',
    assetsTrackedCount: 'activos',
    receiveEyebrow: 'Recibir',
    receiveTitle: 'Recibir fondos',
    receiveHint: 'Comparte esta direccion o escanea el QR para fondear la wallet con XLM, USDC o EURC.',
    receivePendingTitle: 'Activar wallet',
    receivePendingHint: 'Envia al menos 1 XLM a esta direccion para activar la cuenta en Stellar.',
    assetsEyebrow: 'Activos',
    assetsTitle: 'Saldos on-chain',
    assetsHint: 'Activos detectados actualmente en esta wallet.',
    noAssetsDesc: 'Cuando la wallet tenga fondos, los saldos apareceran aqui.',
    assetPrimary: 'Activo principal',
    assetAvailable: 'Disponible en Stellar',
    setupEyebrow: 'Configuracion',
    setupTitle: 'Configuracion de wallet',
    setupPendingTitle: 'Primero activa la wallet',
    setupPendingDesc: 'Activa la wallet antes de habilitar activos adicionales como USDC.',
    setupReadyTitle: 'USDC listo',
    setupReadyDesc: 'Esta wallet ya tiene la trustline necesaria para recibir USDC.',
    getPaidEyebrow: 'Siguiente paso',
    getPaidTitle: 'Cobra con QR o link de pago',
    noAssets: 'Aun sin activos',
    active: 'Activa',
    copyAddress: 'Copiar direccion',
    copied: 'Copiado',
    enableUsdcTitle: 'Activar USDC',
    enableUsdcDesc: 'Agrega una trustline de USDC para que esta wallet pueda recibir y mantener USD Coin.',
    addTrustCta: 'Agregar trustline de USDC',
    addingTrust: 'Agregando trustline…',
    trustAdded: 'Trustline de USDC agregada',
    trustFailed: 'No se pudo agregar la trustline',
    lowXlmHint: 'Necesitas ~0.5 XLM de reserva libre para agregar la trustline. Recarga XLM primero.',
    getPaidNote:
      'Pasa de la configuracion de wallet a una solicitud de pago para clientes sin redefinir el destino.',
    getPaidPendingNote:
      'Despues de activar la wallet, genera un QR o un link de pago para clientes desde esta misma cuenta.',
    getPaidCta: 'Abrir Cobrar',
    notConnected: 'Conecta tu wallet para gestionar saldos y fondos.',
  },
  pt: {
    title: 'Wallet',
    subtitle: 'Fundos, saldos e configuracao da wallet na Stellar.',
    balanceLabel: 'Saldo',
    balanceHint: 'Fundos detectados atualmente para esta wallet na Stellar.',
    refresh: 'Atualizar',
    balanceError: 'Nao foi possivel atualizar os saldos da wallet neste momento.',
    networkLabel: 'Rede',
    testnet: 'Testnet',
    mainnet: 'Mainnet',
    pending: 'Pendente',
    assetsTrackedCount: 'ativos',
    receiveEyebrow: 'Receber',
    receiveTitle: 'Receber fundos',
    receiveHint: 'Compartilhe este endereco ou escaneie o QR para fundear a wallet com XLM, USDC ou EURC.',
    receivePendingTitle: 'Ativar wallet',
    receivePendingHint: 'Envie pelo menos 1 XLM para este endereco para ativar a conta na Stellar.',
    assetsEyebrow: 'Ativos',
    assetsTitle: 'Saldos on-chain',
    assetsHint: 'Ativos detectados atualmente nesta wallet.',
    noAssetsDesc: 'Quando a wallet tiver fundos, os saldos aparecerao aqui.',
    assetPrimary: 'Ativo principal',
    assetAvailable: 'Disponivel na Stellar',
    setupEyebrow: 'Configuracao',
    setupTitle: 'Configuracao da wallet',
    setupPendingTitle: 'Ative a wallet primeiro',
    setupPendingDesc: 'Ative a wallet antes de habilitar ativos adicionais como USDC.',
    setupReadyTitle: 'USDC pronto',
    setupReadyDesc: 'Esta wallet ja possui a trustline necessaria para receber USDC.',
    getPaidEyebrow: 'Proximo passo',
    getPaidTitle: 'Receba com QR ou link de pagamento',
    noAssets: 'Ainda sem ativos',
    active: 'Ativa',
    copyAddress: 'Copiar endereco',
    copied: 'Copiado',
    enableUsdcTitle: 'Ativar USDC',
    enableUsdcDesc: 'Adicione uma trustline de USDC para que esta wallet possa receber e manter USD Coin.',
    addTrustCta: 'Adicionar trustline de USDC',
    addingTrust: 'Adicionando trustline…',
    trustAdded: 'Trustline de USDC adicionada',
    trustFailed: 'Nao foi possivel adicionar a trustline',
    lowXlmHint: 'Voce precisa de ~0.5 XLM de reserva livre para adicionar a trustline. Recarregue XLM primeiro.',
    getPaidNote:
      'Passe da configuracao da wallet para uma cobranca voltada ao cliente sem redefinir o destino.',
    getPaidPendingNote:
      'Depois da ativacao, gere um QR ou um link de pagamento para clientes a partir desta mesma wallet.',
    getPaidCta: 'Abrir Receber',
    notConnected: 'Conecte sua wallet para gerenciar saldos e fundos.',
  },
};

const KNOWN_ASSET_ORDER = ['XLM', 'USDC', 'EURC'];

function sortBalances<T extends { code: string }>(balances: T[]): T[] {
  return [...balances].sort((a, b) => {
    const ai = KNOWN_ASSET_ORDER.indexOf(a.code);
    const bi = KNOWN_ASSET_ORDER.indexOf(b.code);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? KNOWN_ASSET_ORDER.length : ai) - (bi === -1 ? KNOWN_ASSET_ORDER.length : bi);
    }
    return a.code.localeCompare(b.code);
  });
}

function formatBalance(raw: string, code: string): string {
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return raw;
  const formatted = value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const symbol = CURRENCY_SYMBOLS[code] || code;
  return code === 'XLM' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

type StatusTone = 'neutral' | 'success' | 'warning';

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const toneClass =
    tone === 'success'
      ? 'border-success-border bg-success-subtle text-success'
      : tone === 'warning'
        ? 'border-warning-border bg-warning-subtle text-warning'
        : 'border-border bg-muted text-ink-2';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold ${toneClass}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export default function Wallet() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey, signTransaction } = useWalletStore();
  const { horizonUrl, networkPassphrase, network } = useNetworkStore();
  const { balances, loading, error, refresh } = useWalletBalances();
  const [addingTrust, setAddingTrust] = useState(false);

  const sortedBalances = useMemo(() => sortBalances(balances), [balances]);
  const activated = sortedBalances.length > 0;
  const primaryBalance = sortedBalances.find((balance) => balance.code === 'XLM') ?? sortedBalances[0] ?? null;
  const hasUsdc = sortedBalances.some((balance) => balance.code === 'USDC');
  const xlmBalance = parseFloat(sortedBalances.find((balance) => balance.code === 'XLM')?.balance ?? '0');
  const networkLabel = network === 'testnet' ? copy.testnet : copy.mainnet;
  const getPaidNote = activated ? copy.getPaidNote : copy.getPaidPendingNote;
  const showInitialLoading = Boolean(publicKey) && loading && sortedBalances.length === 0 && !error;
  // A trustline adds a 0.5 XLM base reserve; leave headroom for that + the fee.
  const canAffordTrustline = xlmBalance >= 1.6;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(copy.copied);
    } catch {
      /* ignore clipboard failures */
    }
  };

  const addUsdcTrustline = async () => {
    if (!publicKey || addingTrust) return;
    const issuer = getKnownAssetIssuer('USDC', network);
    if (!issuer) return;

    setAddingTrust(true);
    try {
      const server = new Horizon.Server(horizonUrl);
      const account = await server.loadAccount(publicKey);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(Operation.changeTrust({ asset: new Asset('USDC', issuer) }))
        .setTimeout(180)
        .build();

      const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);
      const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      await server.submitTransaction(signed);

      toast.success(copy.trustAdded);
      refresh();
    } catch (err: any) {
      toast.error(err?.message || copy.trustFailed);
    } finally {
      setAddingTrust(false);
    }
  };

  return (
    <div className="space-y-6 animate-in sm:space-y-8">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        icon={WalletIcon}
        actions={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold ${
              network === 'testnet'
                ? 'border-warning-border bg-warning-subtle text-warning'
                : 'border-success-border bg-success-subtle text-success'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${network === 'testnet' ? 'bg-warning' : 'bg-success'}`} />
            {networkLabel}
          </span>
        }
      />

      {!publicKey ? (
        <div className="card p-8 text-center text-sm text-ink-3">{copy.notConnected}</div>
      ) : showInitialLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
            <div className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-16 rounded bg-surface-2" />
                <div className="h-8 w-24 rounded-xl bg-surface-2" />
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-2xl bg-surface-2" />
                <div className="h-12 rounded-2xl bg-surface-2" />
                <div className="h-12 rounded-2xl bg-surface-2" />
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-surface-2" />
                  <div className="h-5 w-32 rounded bg-surface-2" />
                  <div className="h-4 w-48 rounded bg-surface-2" />
                </div>
                <div className="h-6 w-20 rounded-full bg-surface-2" />
              </div>
              <div className="flex justify-center">
                <div className="h-[200px] w-[200px] rounded-2xl bg-surface-2" />
              </div>
              <div className="mt-5 flex justify-center">
                <div className="h-11 w-full rounded-xl bg-surface-2 sm:w-40" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
            <div className="card p-5 sm:p-6">
              <div className="h-3 w-16 rounded bg-surface-2" />
              <div className="mt-3 h-6 w-40 rounded bg-surface-2" />
              <div className="mt-2 h-4 w-56 rounded bg-surface-2" />
              <div className="mt-5 space-y-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-16 rounded-2xl bg-surface-2" />
                ))}
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <div className="h-3 w-20 rounded bg-surface-2" />
              <div className="mt-3 h-6 w-36 rounded bg-surface-2" />
              <div className="mt-5 h-24 rounded-2xl bg-surface-2" />
              <div className="mt-4 h-11 w-full rounded-xl bg-surface-2 sm:w-48" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
            <SectionCard
              title={copy.balanceLabel}
              eyebrow={copy.title}
              hint={copy.balanceHint}
              action={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {activated && (
                    <StatusPill
                      label={`${sortedBalances.length} ${copy.assetsTrackedCount}`}
                      tone="neutral"
                    />
                  )}
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={loading}
                    className="btn-ghost text-xs"
                    aria-label={copy.refresh}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    {copy.refresh}
                  </button>
                </div>
              }
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="h-28 rounded-2xl bg-surface-2" />
                  <div className="h-14 rounded-2xl bg-surface-2" />
                  <div className="h-14 rounded-2xl bg-surface-2" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-border bg-muted px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-3" />
                    <p className="text-sm leading-6 text-ink-2">{copy.balanceError}</p>
                  </div>
                </div>
              ) : !activated || !primaryBalance ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted px-5 py-6">
                  <p className="text-sm font-semibold text-ink-0">{copy.noAssets}</p>
                  <p className="mt-1 text-sm text-ink-3">{copy.noAssetsDesc}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-card-invert p-5 text-card-invert-foreground">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-2xs font-medium uppercase tracking-label text-card-invert-foreground/70">
                          {copy.assetPrimary}
                        </p>
                        <p className="mt-2 font-display text-3xl font-bold tracking-tight text-card-invert-foreground [font-variant-numeric:tabular-nums]">
                          {formatBalance(primaryBalance.balance, primaryBalance.code)}
                        </p>
                        <p className="mt-1 text-sm text-card-invert-foreground/70">{primaryBalance.code}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:min-w-[180px]">
                        <div className="rounded-xl border border-card-invert-foreground/10 bg-card-invert-foreground/5 px-3 py-3">
                          <p className="text-2xs font-medium uppercase tracking-label text-card-invert-foreground/60">
                            {copy.assetsTrackedCount}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-card-invert-foreground [font-variant-numeric:tabular-nums]">
                            {sortedBalances.length}
                          </p>
                        </div>
                        <div className="rounded-xl border border-card-invert-foreground/10 bg-card-invert-foreground/5 px-3 py-3">
                          <p className="text-2xs font-medium uppercase tracking-label text-card-invert-foreground/60">
                            {copy.networkLabel}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-card-invert-foreground">
                            {networkLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {sortedBalances.map((balance) => {
                      const isPrimary = primaryBalance.asset === balance.asset;

                      return (
                        <li
                          key={balance.asset}
                          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                            isPrimary ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-ink-0">{balance.code}</span>
                              {isPrimary && (
                                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-3xs font-bold uppercase tracking-label text-primary">
                                  {copy.assetPrimary}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-mono text-sm font-semibold text-ink-0 [font-variant-numeric:tabular-nums]">
                            {formatBalance(balance.balance, balance.code)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={activated ? copy.receiveTitle : copy.receivePendingTitle}
              eyebrow={copy.receiveEyebrow}
              hint={activated ? copy.receiveHint : copy.receivePendingHint}
              action={
                <StatusPill
                  label={activated ? copy.active : copy.pending}
                  tone={activated ? 'success' : 'warning'}
                />
              }
            >
              <div className="flex justify-center">
                <div className="rounded-2xl bg-white p-3">
                  <QRCodeSVG value={publicKey} size={176} level="M" />
                </div>
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => copyText(publicKey)}
                  className="btn-secondary w-full text-sm sm:w-auto"
                  aria-label={copy.copyAddress}
                >
                  <Copy className="h-4 w-4" />
                  {copy.copyAddress}
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
            <SectionCard
              title={copy.setupTitle}
              eyebrow={copy.setupEyebrow}
              action={activated && hasUsdc ? <StatusPill label={copy.active} tone="success" /> : undefined}
            >
              {!activated ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted px-4 py-4">
                  <p className="text-sm font-semibold text-ink-0">{copy.setupPendingTitle}</p>
                  <p className="mt-1 text-sm text-ink-3">{copy.setupPendingDesc}</p>
                </div>
              ) : hasUsdc ? (
                <div className="rounded-2xl border border-success-border bg-success-subtle px-4 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                    <div>
                      <p className="text-sm font-semibold text-success">{copy.setupReadyTitle}</p>
                      <p className="mt-1 text-sm text-ink-2">{copy.setupReadyDesc}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted px-4 py-4">
                    <p className="text-sm font-semibold text-ink-0">{copy.enableUsdcTitle}</p>
                    <p className="mt-1 text-sm text-ink-3">{copy.enableUsdcDesc}</p>
                  </div>

                  {!canAffordTrustline && (
                    <div className="flex items-start gap-2 rounded-xl border border-warning-border bg-warning-subtle px-3 py-3 text-sm text-warning">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{copy.lowXlmHint}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addUsdcTrustline}
                    disabled={addingTrust || !canAffordTrustline}
                    className="btn-primary w-full text-sm sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    {addingTrust ? copy.addingTrust : copy.addTrustCta}
                  </button>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={copy.getPaidTitle}
              eyebrow={copy.getPaidEyebrow}
              action={
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-ink-2">
                  <QrCode className="h-5 w-5" aria-hidden="true" />
                </span>
              }
            >
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted p-5">
                <p className="text-sm leading-6 text-ink-2">{getPaidNote}</p>
                <Link to="/dashboard/get-paid" className="btn-secondary w-full text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  {copy.getPaidCta}
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
