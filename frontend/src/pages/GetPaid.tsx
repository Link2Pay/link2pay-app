import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Copy, FilePlus2, Landmark, QrCode } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useWalletStore } from '../store/walletStore';
import { getBusinessProfile } from '../services/api';

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
    receiveCop: 'Receive in COP · Bre-B',
    receiveCopDesc: 'Share your Bre-B llave so payers can send pesos.',
    noAlias: 'No Bre-B alias saved yet.',
    setupAlias: 'Add one in your business profile',
    needItemized: 'Need an itemized request with line items and tax?',
    createLink: 'Create a payment link',
    notConnected: 'Connect your wallet to see your QR.',
    simulated: 'Simulated Bre-B (testnet demo)',
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
    receiveCop: 'Recibir en COP · Bre-B',
    receiveCopDesc: 'Comparte tu llave Bre-B para que te envien pesos.',
    noAlias: 'Aun no guardaste una llave Bre-B.',
    setupAlias: 'Agrega una en tu perfil de negocio',
    needItemized: '¿Necesitas una solicitud con items e impuestos?',
    createLink: 'Crear un link de pago',
    notConnected: 'Conecta tu wallet para ver tu QR.',
    simulated: 'Bre-B simulado (demo testnet)',
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
    receiveCop: 'Receber em COP · Bre-B',
    receiveCopDesc: 'Compartilhe sua chave Bre-B para receber pesos.',
    noAlias: 'Nenhuma chave Bre-B salva ainda.',
    setupAlias: 'Adicione uma no seu perfil de negocio',
    needItemized: 'Precisa de uma solicitacao com itens e impostos?',
    createLink: 'Criar um link de pagamento',
    notConnected: 'Conecte sua wallet para ver seu QR.',
    simulated: 'Bre-B simulado (demo testnet)',
  },
};

const shorten = (value: string) => `${value.slice(0, 10)}...${value.slice(-8)}`;

export default function GetPaid() {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey } = useWalletStore();
  const [alias, setAlias] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getBusinessProfile(publicKey);
        if (!cancelled && profile?.defaultPayoutAlias) setAlias(profile.defaultPayoutAlias);
      } catch {
        // Alias is optional.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

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
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>

      {!publicKey ? (
        <div className="card p-8 text-center text-sm text-ink-3">{copy.notConnected}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Receive USDC */}
            <div className="card p-5">
              <div className="mb-1 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink-0">{copy.receiveUsdc}</h3>
              </div>
              <p className="mb-4 text-xs text-ink-3">{copy.receiveUsdcDesc}</p>

              <div className="flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={payUri} size={176} level="M" />
                </div>
              </div>

              <p className="mt-4 text-[10px] uppercase tracking-wider text-ink-3">{copy.walletAddress}</p>
              <p className="mt-1 break-all rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 font-mono text-xs text-ink-1">
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

            {/* Receive in COP via Bre-B */}
            <div className="card p-5">
              <div className="mb-1 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-ink-0">{copy.receiveCop}</h3>
              </div>
              <p className="mb-4 text-xs text-ink-3">{copy.receiveCopDesc}</p>

              {alias ? (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-xl bg-white p-3">
                      <QRCodeSVG value={alias} size={176} level="M" />
                    </div>
                  </div>
                  <p className="mt-4 break-all rounded-lg border border-surface-3 bg-surface-1 px-3 py-2 text-center font-mono text-sm text-ink-1">
                    {alias}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" onClick={() => copyText(alias)} className="btn-secondary text-xs">
                      <Copy className="h-3.5 w-3.5" />
                      {copy.copyAddress}
                    </button>
                    <span className="text-[11px] text-amber-600">{copy.simulated}</span>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-surface-3 bg-surface-1 p-6 text-center">
                  <p className="text-sm text-ink-2">{copy.noAlias}</p>
                  <Link to="/dashboard/profile-options" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                    {copy.setupAlias}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Itemized request CTA */}
          <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
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
