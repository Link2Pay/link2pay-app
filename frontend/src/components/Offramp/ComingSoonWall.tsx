import { useState, type FormEvent } from 'react';
import { Clock, Check, Sparkles } from 'lucide-react';
import { joinWaitlist } from '../../services/api';
import { useI18n } from '../../i18n/I18nProvider';
import type { FiatRail } from '../../config/rails';

type NotifyState = 'idle' | 'submitting' | 'done' | 'error';

/**
 * The "wall" shown when a merchant's country maps to a fiat rail that isn't
 * live yet (Pix, Transferência 3.0). Explains it's coming and captures an
 * email so we can notify them — while still nudging them toward crypto today.
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
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === 'error') setState('idle');
            }}
            placeholder={t('rail.notifyPlaceholder')}
            className="input flex-1 text-sm"
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
