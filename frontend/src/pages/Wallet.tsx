import { useState } from 'react';
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
  ArrowDownToLine,
  CheckCircle2,
  Copy,
  Plus,
  QrCode,
  RefreshCw,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import { useWalletBalances } from '../hooks/useWalletBalances';
import { getKnownAssetIssuer } from '../config/network';
import { CURRENCY_SYMBOLS } from '../config';
import { shortenAddress } from '../lib/format';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    balanceLabel: string;
    refresh: string;
    balanceError: string;
    noAssets: string;
    active: string;
    notActivatedTitle: string;
    notActivatedDesc: string;
    depositTitle: string;
    depositDesc: string;
    address: string;
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
    getPaidCta: string;
    notConnected: string;
  }
> = {
  en: {
    title: 'Wallet',
    subtitle: 'Your on-chain balance, deposits, and assets.',
    balanceLabel: 'Balance',
    refresh: 'Refresh',
    balanceError: 'Balance unavailable',
    noAssets: 'No assets yet',
    active: 'Active',
    notActivatedTitle: 'Wallet not activated',
    notActivatedDesc: 'Send at least 1 XLM to this address to activate it on Stellar.',
    depositTitle: 'Add funds',
    depositDesc: 'Send XLM, USDC, or EURC to this address to top up your wallet.',
    address: 'Wallet address',
    copyAddress: 'Copy address',
    copied: 'Copied',
    enableUsdcTitle: 'Enable USDC',
    enableUsdcDesc: 'Add a USDC trustline so your wallet can hold and receive USD Coin.',
    addTrustCta: 'Add USDC trustline',
    addingTrust: 'Adding trustline…',
    trustAdded: 'USDC trustline added',
    trustFailed: 'Could not add trustline',
    lowXlmHint: 'Needs ~0.5 XLM of free reserve to add a trustline — top up XLM first.',
    getPaidNote: 'Want to share a QR to get paid by customers?',
    getPaidCta: 'Go to Get Paid',
    notConnected: 'Connect your wallet to view your balance.',
  },
  es: {
    title: 'Wallet',
    subtitle: 'Tu saldo on-chain, depositos y activos.',
    balanceLabel: 'Saldo',
    refresh: 'Actualizar',
    balanceError: 'Saldo no disponible',
    noAssets: 'Aun sin activos',
    active: 'Activa',
    notActivatedTitle: 'Wallet no activada',
    notActivatedDesc: 'Envia al menos 1 XLM a esta direccion para activarla en Stellar.',
    depositTitle: 'Agregar fondos',
    depositDesc: 'Envia XLM, USDC o EURC a esta direccion para recargar tu wallet.',
    address: 'Direccion de wallet',
    copyAddress: 'Copiar direccion',
    copied: 'Copiado',
    enableUsdcTitle: 'Activar USDC',
    enableUsdcDesc: 'Agrega una linea de confianza USDC para que tu wallet pueda recibir USD Coin.',
    addTrustCta: 'Agregar linea USDC',
    addingTrust: 'Agregando linea…',
    trustAdded: 'Linea de confianza USDC agregada',
    trustFailed: 'No se pudo agregar la linea',
    lowXlmHint: 'Necesitas ~0.5 XLM de reserva libre para agregar la linea — recarga XLM primero.',
    getPaidNote: '¿Quieres compartir un QR para cobrar a tus clientes?',
    getPaidCta: 'Ir a Cobrar',
    notConnected: 'Conecta tu wallet para ver tu saldo.',
  },
  pt: {
    title: 'Wallet',
    subtitle: 'Seu saldo on-chain, depositos e ativos.',
    balanceLabel: 'Saldo',
    refresh: 'Atualizar',
    balanceError: 'Saldo indisponivel',
    noAssets: 'Ainda sem ativos',
    active: 'Ativa',
    notActivatedTitle: 'Wallet nao ativada',
    notActivatedDesc: 'Envie pelo menos 1 XLM para este endereco para ativa-la na Stellar.',
    depositTitle: 'Adicionar fundos',
    depositDesc: 'Envie XLM, USDC ou EURC para este endereco para recarregar sua wallet.',
    address: 'Endereco da wallet',
    copyAddress: 'Copiar endereco',
    copied: 'Copiado',
    enableUsdcTitle: 'Ativar USDC',
    enableUsdcDesc: 'Adicione uma linha de confianca USDC para sua wallet receber USD Coin.',
    addTrustCta: 'Adicionar linha USDC',
    addingTrust: 'Adicionando linha…',
    trustAdded: 'Linha de confianca USDC adicionada',
    trustFailed: 'Nao foi possivel adicionar a linha',
    lowXlmHint: 'Precisa de ~0.5 XLM de reserva livre para adicionar a linha — recarregue XLM antes.',
    getPaidNote: 'Quer compartilhar um QR para receber dos clientes?',
    getPaidCta: 'Ir para Receber',
    notConnected: 'Conecte sua wallet para ver seu saldo.',
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

const shorten = (value: string) => shortenAddress(value, 10, 8);

export default function Wallet() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey, signTransaction } = useWalletStore();
  const { horizonUrl, networkPassphrase, network } = useNetworkStore();
  const { balances, loading, error, refresh } = useWalletBalances();
  const [addingTrust, setAddingTrust] = useState(false);

  const activated = balances.length > 0;
  const hasUsdc = balances.some((b) => b.code === 'USDC');
  const xlmBalance = parseFloat(balances.find((b) => b.code === 'XLM')?.balance ?? '0');
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
    <div className="space-y-6 animate-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-0">
            <WalletIcon className="h-5 w-5 text-primary" />
            {copy.title}
          </h2>
          <p className="text-sm text-ink-3">{copy.subtitle}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold ${
            network === 'testnet'
              ? 'border-warning-border bg-warning-subtle text-warning'
              : 'border-success-border bg-success-subtle text-success'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${network === 'testnet' ? 'bg-warning' : 'bg-success'}`} />
          {network === 'testnet' ? 'Testnet' : 'Mainnet'}
        </span>
      </div>

      {!publicKey ? (
        <div className="card p-8 text-center text-sm text-ink-3">{copy.notConnected}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Balance */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-0">{copy.balanceLabel}</h3>
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

            {loading ? (
              <div className="space-y-2">
                <div className="h-9 animate-pulse rounded-lg bg-surface-2" />
                <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface-2" />
              </div>
            ) : error ? (
              <p className="text-sm text-ink-3">{copy.balanceError}</p>
            ) : !activated ? (
              <p className="text-sm text-ink-3">{copy.noAssets}</p>
            ) : (
              <ul className="space-y-1.5">
                {sortBalances(balances).map((b) => (
                  <li
                    key={b.asset}
                    className="flex items-center justify-between rounded-lg border border-surface-3 bg-surface-1 px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-ink-1">{b.code}</span>
                    <span className="font-mono text-sm text-ink-0">{formatBalance(b.balance, b.code)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Deposit / Activation */}
          <div className="card p-5">
            <div className="mb-1 flex items-center gap-2">
              {activated ? (
                <ArrowDownToLine className="h-4 w-4 text-primary" />
              ) : (
                <QrCode className="h-4 w-4 text-warning" />
              )}
              <h3 className="text-sm font-semibold text-ink-0">
                {activated ? copy.depositTitle : copy.notActivatedTitle}
              </h3>
              {activated && (
                <span className="ml-auto inline-flex items-center gap-1 text-2xs font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {copy.active}
                </span>
              )}
            </div>
            <p className="mb-4 text-xs text-ink-3">{activated ? copy.depositDesc : copy.notActivatedDesc}</p>

            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={publicKey} size={168} level="M" />
              </div>
            </div>

            <p className="mt-4 text-3xs uppercase tracking-wider text-ink-3">{copy.address}</p>
            <p className="mt-1 break-all rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 font-mono text-xs text-ink-1">
              {shorten(publicKey)}
            </p>
            <button type="button" onClick={() => copyText(publicKey)} className="btn-secondary mt-3 text-xs">
              <Copy className="h-3.5 w-3.5" />
              {copy.copyAddress}
            </button>
          </div>

          {/* Enable USDC (only when activated and no trustline yet) */}
          {activated && !hasUsdc && (
            <div className="card p-5 lg:col-span-2">
              <div className="mb-1 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink-0">{copy.enableUsdcTitle}</h3>
              </div>
              <p className="mb-4 text-xs text-ink-3">{copy.enableUsdcDesc}</p>

              {!canAffordTrustline && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-warning-border bg-warning-subtle px-3 py-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>{copy.lowXlmHint}</span>
                </div>
              )}

              <button
                type="button"
                onClick={addUsdcTrustline}
                disabled={addingTrust || !canAffordTrustline}
                className={`text-sm ${addingTrust || !canAffordTrustline ? 'btn-disabled cursor-not-allowed' : 'btn-primary'}`}
              >
                <Plus className="h-4 w-4" />
                {addingTrust ? copy.addingTrust : copy.addTrustCta}
              </button>
            </div>
          )}

          {/* Cross-link to Get Paid */}
          <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
            <p className="text-sm text-ink-2">{copy.getPaidNote}</p>
            <Link to="/dashboard/get-paid" className="btn-secondary text-sm">
              <QrCode className="h-4 w-4" />
              {copy.getPaidCta}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
