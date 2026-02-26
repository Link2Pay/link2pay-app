import { useMemo, useState } from 'react';
import { FolderKanban, Lock, Plus, ShieldCheck } from 'lucide-react';
import PlanGate from '../components/PlanGate';
import PlanLockModal from '../components/PlanLockModal';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import {
  PLAN_PROJECT_LIMIT,
  getPlanLabel,
  tierAtLeast,
} from '../lib/plans';
import { usePlanStore } from '../store/planStore';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    gateTitle: string;
    gateDescription: string;
    currentPlan: string;
    projectLimit: string;
    createProject: string;
    inProject: string;
    policyCard: string;
    policyDesc: string;
    lockTitle: string;
    lockDescription: string;
  }
> = {
  en: {
    title: 'Projects & Environments',
    subtitle:
      'Manage project boundaries, network defaults, and operational policy by tier.',
    gateTitle: 'Projects are a Pro feature',
    gateDescription:
      'Free supports your default workspace only. Upgrade to Pro to create and manage multiple projects.',
    currentPlan: 'Current plan',
    projectLimit: 'Project limit',
    createProject: 'Create new project',
    inProject: 'Project controls',
    policyCard: 'Advanced policies',
    policyDesc:
      'Rate-limit tiers, role permissions, and policy templates are Business features.',
    lockTitle: 'Advanced policies are Business',
    lockDescription:
      'Upgrade to Business to configure per-project roles and advanced rate-limit policies.',
  },
  es: {
    title: 'Proyectos y entornos',
    subtitle:
      'Gestiona limites por proyecto, defaults de red y politicas operativas por plan.',
    gateTitle: 'Proyectos es una funcion Pro',
    gateDescription:
      'Free mantiene tu workspace por defecto. Sube a Pro para crear y gestionar multiples proyectos.',
    currentPlan: 'Plan actual',
    projectLimit: 'Limite de proyectos',
    createProject: 'Crear nuevo proyecto',
    inProject: 'Controles del proyecto',
    policyCard: 'Politicas avanzadas',
    policyDesc:
      'Tiers de rate-limit, roles y plantillas de politica son funciones Business.',
    lockTitle: 'Politicas avanzadas son Business',
    lockDescription:
      'Mejora a Business para configurar roles por proyecto y politicas avanzadas de rate-limit.',
  },
  pt: {
    title: 'Projetos e ambientes',
    subtitle:
      'Gerencie limites por projeto, defaults de rede e politicas operacionais por plano.',
    gateTitle: 'Projetos e um recurso Pro',
    gateDescription:
      'Free mantem apenas o workspace padrao. Faça upgrade para Pro e crie multiplos projetos.',
    currentPlan: 'Plano atual',
    projectLimit: 'Limite de projetos',
    createProject: 'Criar novo projeto',
    inProject: 'Controles do projeto',
    policyCard: 'Politicas avancadas',
    policyDesc:
      'Tiers de rate-limit, papeis e templates de politica sao recursos Business.',
    lockTitle: 'Politicas avancadas sao Business',
    lockDescription:
      'Faça upgrade para Business para configurar papeis por projeto e politicas avancadas de rate-limit.',
  },
};

export default function Projects() {
  const tier = usePlanStore((state) => state.tier);
  const { language } = useI18n();
  const copy = COPY[language];
  const [showBusinessLock, setShowBusinessLock] = useState(false);

  const projectLimit = useMemo(() => PLAN_PROJECT_LIMIT[tier], [tier]);
  const canUseBusinessPolicies = tierAtLeast(tier, 'business');

  return (
    <>
      <PlanGate
        requiredTier="pro"
        title={copy.gateTitle}
        description={copy.gateDescription}
      >
        <div className="space-y-6 animate-in">
          <div>
            <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
            <p className="text-sm text-ink-3">{copy.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs text-ink-3">{copy.currentPlan}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {getPlanLabel(tier)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-ink-3">{copy.projectLimit}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{projectLimit}</p>
            </div>
            <div className="card p-5">
              <button type="button" className="btn-primary w-full">
                <Plus className="h-4 w-4" />
                {copy.createProject}
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
              <FolderKanban className="h-4 w-4 text-primary" />
              {copy.inProject}
            </h3>
            <p className="text-sm text-ink-3">
              Default asset settings, allowed asset lists, and expiry presets should be set per
              project in this section.
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {copy.policyCard}
                </h3>
                <p className="text-sm text-ink-3">{copy.policyDesc}</p>
              </div>
              {!canUseBusinessPolicies && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-2 text-xs"
                  onClick={() => setShowBusinessLock(true)}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Business
                </button>
              )}
            </div>
          </div>
        </div>
      </PlanGate>

      <PlanLockModal
        open={showBusinessLock}
        requiredTier="business"
        title={copy.lockTitle}
        description={copy.lockDescription}
        onClose={() => setShowBusinessLock(false)}
      />
    </>
  );
}
