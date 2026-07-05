//
// Public, no-login phone side of the Bre-B scan handoff. The URL token is the
// only credential; this page can do exactly one thing — attach a scanned
// llave to its session. Saving still happens on the (authenticated) desktop.
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import QrScanner from '../components/Profile/QrScanner';
import { extractLlave } from '../lib/brebQr';
import { config } from '../config';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  title: string;
  confirmHint: string;
  send: string;
  sending: string;
  rescan: string;
  sent: string;
  sentHint: string;
  gone: string;
  goneHint: string;
  already: string;
}> = {
  en: {
    title: 'Scan your Bre-B QR',
    confirmHint: 'Check the llave and send it to your computer.',
    send: 'Send to your computer',
    sending: 'Sending…',
    rescan: 'Scan again',
    sent: 'Sent!',
    sentHint: 'Continue on your computer.',
    gone: 'This code expired.',
    goneHint: 'Reopen the scanner from your computer to get a new one.',
    already: 'This llave was already sent.',
  },
  es: {
    title: 'Escanea tu QR de Bre-B',
    confirmHint: 'Revisa la llave y envíala a tu computador.',
    send: 'Enviar a tu computador',
    sending: 'Enviando…',
    rescan: 'Escanear de nuevo',
    sent: '¡Enviada!',
    sentHint: 'Continúa en tu computador.',
    gone: 'Este código expiró.',
    goneHint: 'Vuelve a abrir el escáner desde tu computador para generar uno nuevo.',
    already: 'Esta llave ya fue enviada.',
  },
  pt: {
    title: 'Escaneie seu QR do Bre-B',
    confirmHint: 'Confira a chave e envie para o seu computador.',
    send: 'Enviar para o computador',
    sending: 'Enviando…',
    rescan: 'Escanear novamente',
    sent: 'Enviada!',
    sentHint: 'Continue no seu computador.',
    gone: 'Este código expirou.',
    goneHint: 'Abra o leitor novamente no seu computador para gerar um novo.',
    already: 'Esta chave já foi enviada.',
  },
};

type Phase = 'scanning' | 'confirm' | 'sending' | 'sent' | 'gone' | 'already';

export default function ScanHandoff() {
  const { token } = useParams<{ token: string }>();
  const { language } = useI18n();
  const copy = COPY[language];
  const [phase, setPhase] = useState<Phase>('scanning');
  const [llave, setLlave] = useState('');

  const submit = async () => {
    if (!token || !llave.trim()) return;
    setPhase('sending');
    try {
      const res = await fetch(`${config.apiUrl}/api/profile/scan-session/${token}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llave: llave.trim() }),
      });
      if (res.status === 204) setPhase('sent');
      else if (res.status === 409) setPhase('already');
      else setPhase('gone');
    } catch {
      setPhase('gone');
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="mx-auto w-full max-w-md pt-8">
        <h1 className="mb-4 text-center font-display text-xl font-bold text-foreground">{copy.title}</h1>

        {phase === 'scanning' && (
          <QrScanner
            onResult={(text) => {
              setLlave(extractLlave(text));
              setPhase('confirm');
            }}
            onClose={() => setPhase('confirm')}
          />
        )}

        {(phase === 'confirm' || phase === 'sending') && (
          <div className="card p-5">
            <p className="mb-3 text-xs text-ink-3">{copy.confirmHint}</p>
            <input
              className="input font-mono"
              value={llave}
              onChange={(e) => setLlave(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="btn-primary mt-4 w-full py-3"
              onClick={submit}
              disabled={phase === 'sending' || !llave.trim()}
            >
              {phase === 'sending' ? copy.sending : copy.send}
            </button>
            <button
              type="button"
              className="btn-ghost mt-2 w-full text-sm"
              onClick={() => { setLlave(''); setPhase('scanning'); }}
            >
              {copy.rescan}
            </button>
          </div>
        )}

        {phase === 'sent' && (
          <div className="card p-8 text-center">
            <p className="font-display text-lg font-bold text-ink-0">{copy.sent}</p>
            <p className="mt-1 text-sm text-ink-3">{copy.sentHint}</p>
          </div>
        )}

        {(phase === 'gone' || phase === 'already') && (
          <div className="card p-8 text-center">
            <p className="font-display text-lg font-bold text-ink-0">
              {phase === 'already' ? copy.already : copy.gone}
            </p>
            {phase === 'gone' && <p className="mt-1 text-sm text-ink-3">{copy.goneHint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
