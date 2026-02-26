import { useState } from 'react';
import { Image, Lock, Palette, PlusCircle } from 'lucide-react';
import PlanGate from '../components/PlanGate';
import PlanLockModal from '../components/PlanLockModal';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { tierAtLeast } from '../lib/plans';
import { usePlanStore } from '../store/planStore';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    gateTitle: string;
    gateDescription: string;
    logoCard: string;
    logoDesc: string;
    uploadLogo: string;
    colorCard: string;
    colorDesc: string;
    domainCard: string;
    domainDesc: string;
    lockTitle: string;
    lockDescription: string;
  }
> = {
  en: {
    title: 'Branding',
    subtitle: 'Customize checkout experience and customer-facing payment surfaces.',
    gateTitle: 'Branding is a Pro feature',
    gateDescription:
      'Upgrade to Pro to apply logo/colors on checkout. Business unlocks custom domain and white-label controls.',
    logoCard: 'Checkout identity',
    logoDesc: 'Upload logo and brand name for hosted checkout and receipt page.',
    uploadLogo: 'Upload logo',
    colorCard: 'Theme colors',
    colorDesc: 'Apply your primary and accent colors to checkout actions.',
    domainCard: 'Custom domain',
    domainDesc: 'Use pay.yourdomain.com and remove Link2Pay branding marks.',
    lockTitle: 'Custom domain is Business',
    lockDescription:
      'Upgrade to Business to map a custom checkout domain and enable full white-label mode.',
  },
  es: {
    title: 'Branding',
    subtitle: 'Personaliza la experiencia de checkout y superficies visibles para clientes.',
    gateTitle: 'Branding es una funcion Pro',
    gateDescription:
      'Mejora a Pro para aplicar logo/colores en checkout. Business habilita dominio personalizado y white-label.',
    logoCard: 'Identidad de checkout',
    logoDesc: 'Sube logo y nombre de marca para checkout y pagina de recibo.',
    uploadLogo: 'Subir logo',
    colorCard: 'Colores de tema',
    colorDesc: 'Aplica colores primario y acento en acciones de checkout.',
    domainCard: 'Dominio personalizado',
    domainDesc: 'Usa pay.tudominio.com y quita marcas de Link2Pay.',
    lockTitle: 'Dominio personalizado es Business',
    lockDescription:
      'Mejora a Business para mapear dominio propio y activar modo white-label completo.',
  },
  pt: {
    title: 'Branding',
    subtitle: 'Personalize o checkout e superficies visiveis para clientes.',
    gateTitle: 'Branding e um recurso Pro',
    gateDescription:
      'Faça upgrade para Pro para aplicar logo/cores no checkout. Business libera dominio customizado e white-label.',
    logoCard: 'Identidade do checkout',
    logoDesc: 'Envie logo e nome da marca para checkout e pagina de recibo.',
    uploadLogo: 'Enviar logo',
    colorCard: 'Cores do tema',
    colorDesc: 'Aplique cor primaria e de destaque nas acoes do checkout.',
    domainCard: 'Dominio customizado',
    domainDesc: 'Use pay.seudominio.com e remova marcas do Link2Pay.',
    lockTitle: 'Dominio customizado e Business',
    lockDescription:
      'Faça upgrade para Business para mapear dominio proprio e habilitar modo white-label completo.',
  },
};

export default function Branding() {
  const tier = usePlanStore((state) => state.tier);
  const { language } = useI18n();
  const copy = COPY[language];
  const [showBusinessLock, setShowBusinessLock] = useState(false);
  const canUseCustomDomain = tierAtLeast(tier, 'business');

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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
                <Image className="h-4 w-4 text-primary" />
                {copy.logoCard}
              </h3>
              <p className="text-sm text-ink-3">{copy.logoDesc}</p>
              <button type="button" className="btn-secondary mt-3 text-sm">
                <PlusCircle className="h-4 w-4" />
                {copy.uploadLogo}
              </button>
            </div>

            <div className="card p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
                <Palette className="h-4 w-4 text-primary" />
                {copy.colorCard}
              </h3>
              <p className="text-sm text-ink-3">{copy.colorDesc}</p>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-0">
                  <Lock className="h-4 w-4 text-primary" />
                  {copy.domainCard}
                </h3>
                <p className="text-sm text-ink-3">{copy.domainDesc}</p>
              </div>
              {!canUseCustomDomain && (
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
