import { Landmark, Search, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import SectionHeading from './SectionHeading';

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  custodyTitle: string;
  custodyDescription: string;
  auditTitle: string;
  auditDescription: string;
  roadmapTitle: string;
  roadmapDescription: string;
  demoLabel: string;
  soonLabel: string;
  mainnetOnly: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Trust',
    title: 'Your money never passes through us.',
    description:
      'The strongest claim on the page is also the easiest one to verify in the product: signatures happen client-side and each payment can be inspected later on-chain.',
    custodyTitle: 'Real non-custodial flow',
    custodyDescription:
      'The payer signs from the device in use and the funds move directly from the payer wallet to the receiver account.',
    auditTitle: 'Everything stays auditable',
    auditDescription:
      'Each payment can be reviewed from the public checkout, the dashboard, and the explorer trail on stellar.expert.',
    roadmapTitle: 'Honest roadmap',
    roadmapDescription:
      'Bre-B (COP) is available in demo mode today. Pix (BRL) and Transferencias 3.0 (ARS) are next and already visible as upcoming rails.',
    demoLabel: 'Bre-B demo today',
    soonLabel: 'Pix and ARS next',
    mainnetOnly: 'Fiat settlement only goes live on mainnet.',
  },
  es: {
    eyebrow: 'Confianza',
    title: 'Tu plata nunca pasa por nosotros.',
    description:
      'La afirmación más fuerte de la página también es la más fácil de verificar en el producto: las firmas suceden del lado del cliente y cada pago se puede revisar después on-chain.',
    custodyTitle: 'Flujo no custodial real',
    custodyDescription:
      'El pagador firma desde su dispositivo y los fondos viajan directo desde la wallet pagadora hasta la cuenta receptora.',
    auditTitle: 'Todo queda auditable',
    auditDescription:
      'Cada pago se puede revisar desde el checkout público, el dashboard y la traza en stellar.expert.',
    roadmapTitle: 'Roadmap honesto',
    roadmapDescription:
      'Bre-B (COP) está disponible hoy en modo demo. Pix (BRL) y Transferencias 3.0 (ARS) siguen después y ya aparecen como rieles próximos.',
    demoLabel: 'Bre-B demo hoy',
    soonLabel: 'Pix y ARS después',
    mainnetOnly: 'La liquidación fiat solo vive en mainnet.',
  },
  pt: {
    eyebrow: 'Confiança',
    title: 'O seu dinheiro nunca passa por nós.',
    description:
      'A afirmação mais forte da página também é a mais fácil de verificar no produto: as assinaturas acontecem do lado do cliente e cada pagamento pode ser auditado depois on-chain.',
    custodyTitle: 'Fluxo não custodial de verdade',
    custodyDescription:
      'Quem paga assina do próprio dispositivo e os fundos seguem direto da wallet pagadora para a conta recebedora.',
    auditTitle: 'Tudo fica auditável',
    auditDescription:
      'Cada pagamento pode ser revisado no checkout público, no dashboard e na trilha do stellar.expert.',
    roadmapTitle: 'Roadmap honesto',
    roadmapDescription:
      'Bre-B (COP) está disponível hoje em modo demo. Pix (BRL) e Transferencias 3.0 (ARS) vêm a seguir e já aparecem como trilhos futuros.',
    demoLabel: 'Bre-B demo hoje',
    soonLabel: 'Pix e ARS depois',
    mainnetOnly: 'A liquidação fiat só entra em produção na mainnet.',
  },
};

export default function HomeTrust() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10">
      <SectionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        className="max-w-3xl"
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <article className="card border border-success-border bg-success-subtle p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-success">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.custodyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.custodyDescription}
          </p>
        </article>

        <article className="card border border-border p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.auditTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.auditDescription}
          </p>
        </article>

        <article className="card border border-border p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{copy.roadmapTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {copy.roadmapDescription}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="badge-processing">{copy.demoLabel}</span>
            <span className="badge-draft">{copy.soonLabel}</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{copy.mainnetOnly}</p>
        </article>
      </div>
    </section>
  );
}
