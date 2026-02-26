import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { getPlanLabel, type PlanTier } from '../lib/plans';

interface PlanLockModalProps {
  open: boolean;
  requiredTier: PlanTier;
  title: string;
  description: string;
  onClose: () => void;
}

const COPY: Record<Language, { upgrade: string; keepCurrent: string }> = {
  en: { upgrade: 'View plans', keepCurrent: 'Keep current plan' },
  es: { upgrade: 'Ver planes', keepCurrent: 'Mantener plan actual' },
  pt: { upgrade: 'Ver planos', keepCurrent: 'Manter plano atual' },
};

export default function PlanLockModal({
  open,
  requiredTier,
  title,
  description,
  onClose,
}: PlanLockModalProps) {
  const navigate = useNavigate();
  const { language } = useI18n();
  const copy = COPY[language];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-5 sm:p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Lock className="h-3.5 w-3.5" />
          {getPlanLabel(requiredTier)}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
            onClick={onClose}
          >
            {copy.keepCurrent}
          </button>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto"
            onClick={() => {
              onClose();
              navigate('/plans');
            }}
          >
            {copy.upgrade}
          </button>
        </div>
      </div>
    </div>
  );
}
