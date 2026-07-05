import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Copy, FilePlus2, Landmark, QrCode } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useWalletStore } from '../store/walletStore';
import { getBusinessProfile } from '../services/api';
import { shortenAddress } from '../lib/format';
import { railByCountry, FIAT_RAILS } from '../config/rails';
import { config } from '../config';
import PageHeader from '../components/ui/PageHeader';
import ComingSoonWall from '../components/Offramp/ComingSoonWall';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    receiveUsdc: string;
    receiveUsdcDesc: string;
    walletAddress: string;
    copyAddress: string;
    copyLink: string;
    copied: string;
    receiveFiat: string;
    receiveCop: string;
    receiveCopDesc: string;
    noAlias: string;
    setupAlias: string;
    needItemized: string;
    createLink: string;
    notConnected: string;
    simulated: string;
  }
> = {
  en: {
    title: 'Get Paid',
    subtitle: 'Share your QR or a payment link to receive funds.',
    receiveUsdc: 'Receive USDC',
    receiveUsdcDesc: 'Scan with any Stellar wallet to pay your address.',
    walletAddress: 'Wallet address',
    copyAddress: 'Copy address',
    copyLink: 'Copy pay link',
    copied: 'Copied',
    receiveFiat: 'Receive in fiat',
    receiveCop: 'Receive in COP · Bre-B',
    receiveCopDesc: 'Share your Bre-B llave so payers can send pesos.',
    noAlias: 'No Bre-B alias saved yet.',
    setupAlias: 'Add one in your business profile',
    needItemized: 'Need an itemized request with line items and tax?',
    createLink: 'Create a payment link',
    notConnected: 'Connect your wallet to see your QR.',
    simulated: 'Simulated Bre-B (demo)',
  },
  es: {
    title: 'Cobrar',
    subtitle: 'Comparte tu QR o un link de pago para recibir fondos.',
    receiveUsdc: 'Recibir USDC',
    receiveUsdcDesc: 'Escanea con cualquier wallet Stellar para pagar a tu direccion.',
    walletAddress: 'Direccion de wallet',
    copyAddress: 'Copiar direccion',
    copyLink: 'Copiar link de pago',
    copied: 'Copiado',
    receiveFiat: 'Recibir en fiat',
    receiveCop: 'Recibir en COP · Bre-B',
    receiveCopDesc: 'Comparte tu llave Bre-B para que te envien pesos.',
    noAlias: 'Aun no guardaste una llave Bre-B.',
    setupAlias: 'Agrega una en tu perfil de negocio',
    needItemized: '¿Necesitas una solicitud con items e impuestos?',
    createLink: 'Crear un link de pago',
    notConnected: 'Conecta tu wallet para ver tu QR.',
    simulated: 'Bre-B simulado (demo)',
  },
  pt: {
    title: 'Receber',
    subtitle: 'Compartilhe seu QR ou um link de pagamento para receber fundos.',
    receiveUsdc: 'Receber USDC',
    receiveUsdcDesc: 'Escaneie com qualquer wallet Stellar para pagar seu endereco.',
    walletAddress: 'Endereco da wallet',
    copyAddress: 'Copiar endereco',
    copyLink: 'Copiar link de pagamento',
    copied: 'Copiado',
    receiveFiat: 'Receber em fiat',
    receiveCop: 'Receber em COP · Bre-B',
    receiveCopDesc: 'Compartilhe sua chave Bre-B para receber pesos.',
    noAlias: 'Nenhuma chave Bre-B salva ainda.',
    setupAlias: 'Adicione uma no seu perfil de negocio',
    needItemized: 'Precisa de uma solicitacao com itens e impostos?',
    createLink: 'Criar um link de pagamento',
    notConnected: 'Conecte sua wallet para ver seu QR.',
    simulated: 'Bre-B simulado (demo)',
  },
};

const shorten = (value: string) => shortenAddress(value, 10, 8);

export default function GetPaid() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey } = useWalletStore();
  const [alias, setAlias] = useState<string | null>(null);
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getBusinessProfile(publicKey);
        if (cancelled || !profile) return;
        if (profile.defaultPayoutAlias) setAlias(profile.defaultPayoutAlias);
        setCountry(profile.country ?? '');
      } catch {
        // Alias is optional.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // The fiat card follows the merchant's country. Bre-B (Colombia) is live;
  // Pix / Transferência 3.0 render the coming-soon wall instead.
  const fiatRail = railByCountry(country) ?? FIAT_RAILS.BRE_B;
  // Usable only when rolled out AND this environment allows fiat (testnet walls it).
  const fiatLive = fiatRail.status === 'live' && config.fiatRailsEnabled;

  const payUri = publicKey ? `web+stellar:pay?destination=${publicKey}` : '';

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(copy.copied);
    } catch {
      // Ignore clipboard failures.
    }
  };

  return (
    <div className="space-y-6 animate-in sm:space-y-8">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      {!publicKey ? (
        <div className="card p-8 text-center text-sm text-ink-3">{copy.notConnected}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Receive USDC */}
            <div className="card p-5">
              <div className="mb-1 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-ink-3" />
                <h3 className="text-sm font-semibold text-ink-0">{copy.receiveUsdc}</h3>
              </div>
              <p className="mb-4 text-xs text-ink-3">{copy.receiveUsdcDesc}</p>

              <div className="flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={payUri} size={176} level="M" />
                </div>
              </div>

              <p className="mt-4 text-3xs uppercase tracking-label text-ink-3">{copy.walletAddress}</p>
              <p className="mt-1 break-all rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs text-ink-1">
                {shorten(publicKey)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => copyText(publicKey)} className="btn-secondary text-xs">
                  <Copy className="h-3.5 w-3.5" />
                  {copy.copyAddress}
                </button>
                <button type="button" onClick={() => copyText(payUri)} className="btn-ghost text-xs">
                  <Copy className="h-3.5 w-3.5" />
                  {copy.copyLink}
                </button>
              </div>
            </div>

            {/* Receive in local fiat — Bre-B live, Pix / Transferência 3.0 walled.
                Hidden entirely on fiat-disabled environments (testnet is crypto-only). */}
            {config.fiatRailsEnabled && (
            <div className="card p-5">
              <div className="mb-1 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-ink-3" />
                <h3 className="text-sm font-semibold text-ink-0">
                  {copy.receiveFiat} · {fiatRail.railName} ({fiatRail.currency})
                </h3>
              </div>

              {!fiatLive ? (
                <ComingSoonWall rail={fiatRail} wallet={publicKey} />
              ) : (
                <>
                  <p className="mb-4 text-xs text-ink-3">{copy.receiveCopDesc}</p>
                  {alias ? (
                    <>
                      <div className="flex justify-center">
                        <div className="rounded-xl bg-white p-3">
                          <QRCodeSVG value={alias} size={176} level="M" />
                        </div>
                      </div>
                      <p className="mt-4 break-all rounded-lg border border-border bg-muted px-3 py-2 text-center font-mono text-sm text-ink-1">
                        {alias}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <button type="button" onClick={() => copyText(alias)} className="btn-secondary text-xs">
                          <Copy className="h-3.5 w-3.5" />
                          {copy.copyAddress}
                        </button>
                        <span className="text-2xs text-warning">{copy.simulated}</span>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted p-6 text-center">
                      <p className="text-sm text-ink-2">{copy.noAlias}</p>
                      <Link to="/dashboard/profile-options" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                        {copy.setupAlias}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
            )}
          </div>

          {/* Itemized request CTA */}
          <div className="card flex flex-col items-center gap-3 p-5 text-center">
            <p className="text-sm text-ink-2">{copy.needItemized}</p>
            <Link to="/dashboard/create-link" className="btn-primary text-sm">
              <FilePlus2 className="h-4 w-4" />
              {copy.createLink}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
