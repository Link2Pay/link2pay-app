import { Shield, UserPlus, Users } from 'lucide-react';
import PlanGate from '../components/PlanGate';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    gateTitle: string;
    gateDescription: string;
    rolesCard: string;
    rolesDesc: string;
    invite: string;
    auditCard: string;
    auditDesc: string;
  }
> = {
  en: {
    title: 'Team & Permissions',
    subtitle: 'Multi-user controls for operational and finance workflows.',
    gateTitle: 'Team management is a Business feature',
    gateDescription:
      'Upgrade to Business to invite teammates, assign roles, and maintain action-level audit logs.',
    rolesCard: 'Role-based access',
    rolesDesc: 'Admin, Developer, Finance, and Read-only role templates.',
    invite: 'Invite member',
    auditCard: 'Team audit trail',
    auditDesc: 'Track member invites, key actions, and permission updates over time.',
  },
  es: {
    title: 'Equipo y permisos',
    subtitle: 'Controles multiusuario para operacion y finanzas.',
    gateTitle: 'Gestion de equipo es una funcion Business',
    gateDescription:
      'Mejora a Business para invitar miembros, asignar roles y mantener auditoria de acciones.',
    rolesCard: 'Acceso por roles',
    rolesDesc: 'Plantillas de rol: Admin, Developer, Finance y Read-only.',
    invite: 'Invitar miembro',
    auditCard: 'Auditoria de equipo',
    auditDesc: 'Rastrea invitaciones, acciones de llaves y cambios de permisos.',
  },
  pt: {
    title: 'Equipe e permissoes',
    subtitle: 'Controles multiusuario para operacoes e financeiro.',
    gateTitle: 'Gestao de equipe e recurso Business',
    gateDescription:
      'Faça upgrade para Business para convidar membros, definir papeis e manter trilha de auditoria.',
    rolesCard: 'Acesso por papeis',
    rolesDesc: 'Templates: Admin, Developer, Finance e Read-only.',
    invite: 'Convidar membro',
    auditCard: 'Auditoria de equipe',
    auditDesc: 'Rastreie convites, acoes em chaves e alteracoes de permissao.',
  },
};

export default function Team() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <PlanGate
      requiredTier="business"
      title={copy.gateTitle}
      description={copy.gateDescription}
    >
      <div className="space-y-6 animate-in">
        <div>
          <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
          <p className="text-sm text-ink-3">{copy.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
              <Users className="h-4 w-4 text-primary" />
              {copy.rolesCard}
            </h3>
            <p className="text-sm text-ink-3">{copy.rolesDesc}</p>
            <button type="button" className="btn-primary mt-3 text-sm">
              <UserPlus className="h-4 w-4" />
              {copy.invite}
            </button>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
              <Shield className="h-4 w-4 text-primary" />
              {copy.auditCard}
            </h3>
            <p className="text-sm text-ink-3">{copy.auditDesc}</p>
          </div>
        </div>
      </div>
    </PlanGate>
  );
}
