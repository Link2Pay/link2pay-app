import { usePrivy, useLinkAccount } from '@privy-io/react-auth';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nProvider';

// LinkedIn/X rows return once their OAuth apps are configured in the Privy
// dashboard — linking uses the same oauth/init that 403s without credentials.
const PROVIDERS = [
  { type: 'google_oauth', label: 'Google' },
  { type: 'email', label: 'Email' },
] as const;

export default function LinkedAccounts() {
  const { ready, user } = usePrivy();
  const { t } = useI18n();
  const { linkEmail, linkGoogle, linkLinkedIn, linkTwitter } = useLinkAccount({
    onError: (error: string) => {
      if (error === 'linked_to_another_user') {
        toast.error(t('profile.linkConflict'));
      }
    },
  });

  if (!ready) {
    return (
      <div className="card p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-surface-2 rounded" />
          <div className="h-3 w-48 bg-surface-2 rounded" />
          <div className="h-8 w-full bg-surface-2 rounded" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const linkedTypes = new Set(user.linkedAccounts.map((a) => a.type));

  const linkHandlers: Record<string, () => void> = {
    google_oauth: linkGoogle,
    linkedin_oauth: linkLinkedIn,
    twitter_oauth: linkTwitter,
    email: linkEmail,
  };

  return (
    <div className="card p-5 space-y-3">
      <h3 className="text-sm font-semibold text-ink-0">{t('profile.linkedAccounts')}</h3>
      <p className="text-xs text-ink-3">{t('profile.linkedAccountsDesc')}</p>
      <div className="space-y-2">
        {PROVIDERS.map(({ type, label }) => {
          const linked = linkedTypes.has(type);
          return (
            <div
              key={type}
              className="flex items-center justify-between rounded-lg border border-surface-3 bg-surface-1 px-4 py-2.5"
            >
              <span className="text-sm font-medium text-ink-1">{label}</span>
              <span className="flex items-center gap-2">
                {linked ? (
                  <span className="inline-flex items-center rounded-full bg-success-subtle px-2.5 py-0.5 text-2xs font-medium text-success">
                    {t('profile.linked')}
                  </span>
                ) : (
                  <>
                    <span className="text-2xs text-ink-3">{t('profile.notLinked')}</span>
                    <button
                      onClick={() => linkHandlers[type]?.()}
                      className="text-2xs font-medium text-ink-2 hover:text-ink-0 underline underline-offset-2"
                    >
                      {t('profile.link')}
                    </button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
