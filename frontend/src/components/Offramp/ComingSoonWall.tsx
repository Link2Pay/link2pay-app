import { useState, type FormEvent } from 'react';
import { Clock, Check, Sparkles, ExternalLink } from 'lucide-react';
import { joinWaitlist } from '../../services/api';
import { useI18n } from '../../i18n/I18nProvider';
import type { FiatRail } from '../../config/rails';

type NotifyState = 'idle' | 'submitting' | 'done' | 'error';

/**
 * The "wall" shown when the fiat rail can't be used here. Two flavors:
 *  - coming soon (rail not rolled out — Pix, Transferência 3.0): explains it's
 *    on the way and captures an email for the waitlist.
 *  - mainnet only (rail is live, but this is the testnet environment, where
 *    the anchor only simulates settlement): points at the production app.
 */
export default function ComingSoonWall({
  rail,
  wallet,
}: {
  rail: FiatRail;
  wallet?: string | null;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<NotifyState>('idle');

  const vars = { rail: rail.railName, fiat: rail.currency, country: rail.countryName };

  // This component only renders when the rail is walled — so a *live* rail
  // here means the environment (testnet) is the wall, not the rollout.
  if (rail.status === 'live') {
    return (
      <div className="mt-2 rounded-lg border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold">{t('rail.mainnetOnlyTitle', vars)}</span>
        </div>
        <p className="mt-1.5 text-xs text-ink-2">{t('rail.mainnetOnlyBody', vars)}</p>
        <a
          href="https://link2pay.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-3 inline-flex items-center gap-1.5 text-sm"
        >
          {t('rail.mainnetOnlyCta')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === 'submitting' || !email.includes('@')) return;
    setState('submitting');
    try {
      await joinWaitlist({
        email: email.trim(),
        // Only walled rails reach this component.
        rail: rail.id as 'PIX' | 'TRANSFERENCIA_30',
        country: rail.country,
        wallet: wallet || undefined,
      });
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold">{t('rail.comingSoonTitle', vars)}</span>
      </div>
      <p className="mt-1.5 text-xs text-ink-2">{t('rail.comingSoonBody', vars)}</p>

      {state === 'done' ? (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-success-subtle px-3 py-2 text-xs font-medium text-success">
          <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {t('rail.notifySuccess')}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === 'error') setState('idle');
            }}
            placeholder={t('rail.notifyPlaceholder')}
            className="input flex-1"
            aria-label={t('rail.notifyPlaceholder')}
          />
          <button
            type="submit"
            disabled={state === 'submitting' || !email.includes('@')}
            className="btn-primary inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {state === 'submitting' ? t('rail.notifySubmitting') : t('rail.notifyButton')}
          </button>
        </form>
      )}

      {state === 'error' && <p className="mt-1.5 text-xs text-danger">{t('rail.notifyError')}</p>}
      <p className="mt-2 text-2xs text-ink-3">{t('rail.useCryptoInstead')}</p>
    </div>
  );
}
