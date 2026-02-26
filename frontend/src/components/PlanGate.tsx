import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { getPlanLabel, tierAtLeast, type PlanTier } from '../lib/plans';
import { usePlanStore } from '../store/planStore';

interface PlanGateProps {
  requiredTier: PlanTier;
  title: string;
  description: string;
  children: ReactNode;
}

const COPY: Record<Language, { locked: string; cta: string }> = {
  en: { locked: 'Upgrade required', cta: 'Compare plans' },
  es: { locked: 'Se requiere upgrade', cta: 'Comparar planes' },
  pt: { locked: 'Upgrade necessario', cta: 'Comparar planos' },
};

export default function PlanGate({
  requiredTier,
  title,
  description,
  children,
}: PlanGateProps) {
  const tier = usePlanStore((state) => state.tier);
  const { language } = useI18n();
  const copy = COPY[language];

  if (tierAtLeast(tier, requiredTier)) {
    return <>{children}</>;
  }

  return (
    <div className="card p-6 text-center sm:p-8">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {copy.locked} - {getPlanLabel(requiredTier)}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      <Link to="/plans" className="btn-primary mt-5">
        {copy.cta}
      </Link>
    </div>
  );
}
