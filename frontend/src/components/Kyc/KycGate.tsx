import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import {
  getKycStatus,
  startKyc,
  completeMockKyc,
  type KycStatusValue,
} from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

interface Props {
  /** Fiat (Bre-B) is selected — render the gate and enforce verification. */
  active: boolean;
  /** Reports whether the merchant is cleared to receive fiat (verified OR gate disabled). */
  onVerifiedChange?: (verified: boolean) => void;
  className?: string;
}

const COPY: Record<Language, {
  required: string;
  explainer: string;
  verify: string;
  verifying: string;
  verified: string;
  pending: string;
  pendingHint: string;
  refresh: string;
  rejected: string;
  retry: string;
  connectFirst: string;
  mockTitle: string;
  mockHint: string;
  approve: string;
  decline: string;
  approved: string;
  declined: string;
}> = {
  en: {
    required: 'Identity verification required',
    explainer: 'Fiat (Bre-B) payouts require a verified identity.',
    verify: 'Verify identity',
    verifying: 'Starting…',
    verified: 'Identity verified',
    pending: 'Verification in progress',
    pendingHint: 'Complete it in the window that opened, then refresh.',
    refresh: 'Refresh status',
    rejected: 'Verification was declined.',
    retry: 'Try again',
    connectFirst: 'Connect your wallet to verify your identity.',
    mockTitle: 'Simulated identity check (demo)',
    mockHint: 'This is a mock KYC step. Approve to simulate a verified merchant.',
    approve: 'Approve',
    decline: 'Decline',
    approved: 'Identity verified',
    declined: 'Verification declined',
  },
  es: {
    required: 'Verificación de identidad requerida',
    explainer: 'Los pagos en fiat (Bre-B) requieren identidad verificada.',
    verify: 'Verificar identidad',
    verifying: 'Iniciando…',
    verified: 'Identidad verificada',
    pending: 'Verificación en progreso',
    pendingHint: 'Complétala en la ventana que se abrió y luego actualiza.',
    refresh: 'Actualizar estado',
    rejected: 'La verificación fue rechazada.',
    retry: 'Intentar de nuevo',
    connectFirst: 'Conecta tu wallet para verificar tu identidad.',
    mockTitle: 'Verificación de identidad simulada (demo)',
    mockHint: 'Este es un paso KYC simulado. Aprueba para simular un comercio verificado.',
    approve: 'Aprobar',
    decline: 'Rechazar',
    approved: 'Identidad verificada',
    declined: 'Verificación rechazada',
  },
  pt: {
    required: 'Verificação de identidade necessária',
    explainer: 'Pagamentos em fiat (Bre-B) exigem identidade verificada.',
    verify: 'Verificar identidade',
    verifying: 'Iniciando…',
    verified: 'Identidade verificada',
    pending: 'Verificação em andamento',
    pendingHint: 'Conclua na janela que abriu e depois atualize.',
    refresh: 'Atualizar status',
    rejected: 'A verificação foi recusada.',
    retry: 'Tentar novamente',
    connectFirst: 'Conecte sua wallet para verificar sua identidade.',
    mockTitle: 'Verificação de identidade simulada (demo)',
    mockHint: 'Esta é uma etapa de KYC simulada. Aprove para simular um comerciante verificado.',
    approve: 'Aprovar',
    decline: 'Recusar',
    approved: 'Identidade verificada',
    declined: 'Verificação recusada',
  },
};

export default function KycGate({ active, onVerifiedChange, className }: Props) {
  const { publicKey } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [status, setStatus] = useState<KycStatusValue | null>(null);
  const [enforced, setEnforced] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showMock, setShowMock] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleared to receive fiat when the gate is off, or when verified.
  const report = useCallback(
    (s: KycStatusValue | null, isEnforced: boolean) => {
      onVerifiedChange?.(!isEnforced || s === 'VERIFIED');
    },
    [onVerifiedChange]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    try {
      const view = await getKycStatus(publicKey);
      setStatus(view.status);
      setEnforced(view.enforced);
      report(view.status, view.enforced);
      if (view.status === 'VERIFIED' || view.status === 'REJECTED') stopPolling();
    } catch {
      /* non-fatal — leave prior state */
    }
  }, [publicKey, report, stopPolling]);

  // Fetch once we have a wallet; re-report when the wallet changes.
  useEffect(() => {
    if (!publicKey) {
      setStatus(null);
      onVerifiedChange?.(false);
      return;
    }
    refresh();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const handleVerify = async () => {
    if (!publicKey) return;
    setStarting(true);
    try {
      const result = await startKyc(publicKey);
      if (result.status === 'VERIFIED') {
        setStatus('VERIFIED');
        report('VERIFIED', enforced);
        return;
      }
      setStatus('PENDING');
      if (result.verificationUrl && result.verificationUrl !== 'mock:inline') {
        window.open(result.verificationUrl, '_blank', 'noopener,noreferrer');
        // Poll so the gate clears without a webhook (localhost-friendly).
        stopPolling();
        pollRef.current = setInterval(refresh, 4000);
      } else {
        // Mock provider — show the inline simulated approval.
        setShowMock(true);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start verification');
    } finally {
      setStarting(false);
    }
  };

  const handleMock = async (approve: boolean) => {
    if (!publicKey) return;
    try {
      const view = await completeMockKyc(publicKey, approve);
      setStatus(view.status);
      setEnforced(view.enforced);
      report(view.status, view.enforced);
      setShowMock(false);
      toast.success(approve ? copy.approved : copy.declined);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete verification');
    }
  };

  // Gate disabled globally, or not fiat → render nothing.
  if (!active || !enforced) return null;

  if (!publicKey) {
    return (
      <p className={`text-2xs text-ink-3 ${className ?? ''}`}>{copy.connectFirst}</p>
    );
  }

  if (status === 'VERIFIED') {
    return (
      <div className={`flex items-center gap-1.5 rounded-xl border border-success-border bg-success-subtle px-3 py-2 text-xs font-medium text-success ${className ?? ''}`}>
        <ShieldCheck className="h-4 w-4 flex-shrink-0" />
        {copy.verified}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className ?? ''}`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-warning-border bg-warning-subtle text-warning">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{copy.required}</p>
          <p className="mt-0.5 text-xs leading-5 text-ink-3">{copy.explainer}</p>
        </div>
      </div>

      {showMock ? (
        <div className="mt-4 pl-11">
          <p className="text-xs font-semibold text-foreground">{copy.mockTitle}</p>
          <p className="mt-0.5 text-2xs text-ink-3">{copy.mockHint}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => handleMock(true)} className="btn-primary text-xs px-3 py-1.5">
              {copy.approve}
            </button>
            <button type="button" onClick={() => handleMock(false)} className="btn-ghost text-xs px-3 py-1.5">
              {copy.decline}
            </button>
          </div>
        </div>
      ) : status === 'PENDING' ? (
        <div className="mt-4 pl-11">
          <p className="text-xs font-semibold text-foreground">{copy.pending}</p>
          <p className="mt-0.5 text-2xs text-ink-3">{copy.pendingHint}</p>
          <button type="button" onClick={refresh} className="btn-ghost mt-2 text-xs px-3 py-1.5">
            {copy.refresh}
          </button>
        </div>
      ) : (
        <div className="mt-4 pl-11">
          {status === 'REJECTED' && <p className="text-2xs text-destructive">{copy.rejected}</p>}
          <button
            type="button"
            onClick={handleVerify}
            disabled={starting}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            {starting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {starting ? copy.verifying : status === 'REJECTED' ? copy.retry : copy.verify}
          </button>
        </div>
      )}
    </div>
  );
}
