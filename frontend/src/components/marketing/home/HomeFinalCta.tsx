import { ArrowRight, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import { MARKETING_CONTAINER } from '../layout';

type AudiencePill = {
  title: string;
  fit: string;
};

type CopyBlock = {
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  footnote: string;
  audiences: [AudiencePill, AudiencePill, AudiencePill];
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    title: 'Connect your business to the world.',
    description:
      'Create your first link in minutes, share it anywhere, and move from crypto checkout to local settlement without changing how your team works.',
    primaryCta: 'Create your first link',
    secondaryCta: 'Compare plans',
    footnote: 'Free sandbox · ready to test today',
    audiences: [
      { title: 'Businesses and shops', fit: 'Ideal for local sales' },
      { title: 'Freelancers and individuals', fit: 'Ideal for international payments' },
      { title: 'Digital businesses and platforms', fit: 'Ideal for high volume' },
    ],
  },
  es: {
    title: 'Conectá tu negocio con el mundo.',
    description:
      'Generá tu primer link en minutos, compartilo donde quieras y pasá del checkout en crypto a la liquidación local sin cambiar cómo trabaja tu equipo.',
    primaryCta: 'Crear mi primer link',
    secondaryCta: 'Comparar planes',
    footnote: 'Sandbox gratis · listo para probar hoy',
    audiences: [
      { title: 'Negocios y comercios', fit: 'Ideal para venta local' },
      { title: 'Freelancers y personas', fit: 'Ideal para pagos internacionales' },
      { title: 'Negocios digitales y plataformas', fit: 'Ideal para alto volumen' },
    ],
  },
  pt: {
    title: 'Conecte o seu negócio com o mundo.',
    description:
      'Crie o seu primeiro link em minutos, compartilhe onde quiser e passe do checkout em cripto para a liquidação local sem mudar como o seu time trabalha.',
    primaryCta: 'Criar meu primeiro link',
    secondaryCta: 'Comparar planos',
    footnote: 'Sandbox grátis · pronto para testar hoje',
    audiences: [
      { title: 'Negócios e comércios', fit: 'Ideal para venda local' },
      { title: 'Freelancers e pessoas', fit: 'Ideal para pagamentos internacionais' },
      { title: 'Negócios digitais e plataformas', fit: 'Ideal para alto volume' },
    ],
  },
};

export default function HomeFinalCta() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="aurora-field aurora-field--cta aurora-veil border-t border-border">
      <div className={`relative ${MARKETING_CONTAINER} py-20`}>
        <div className="flex flex-wrap justify-center gap-3">
          {copy.audiences.map((audience) => (
            <div
              key={audience.title}
              className="rounded-full border border-border bg-card/80 px-4 py-3 text-center"
            >
              <p className="text-xs font-semibold text-foreground">{audience.title}</p>
              <p className="mt-1 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                {audience.fit}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          <div className="glass-panel px-6 py-10 text-center sm:px-10 sm:py-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl [text-wrap:balance]">
              {copy.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground [text-wrap:pretty]">
              {copy.description}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/app" className="btn-primary px-6 text-sm">
                {copy.primaryCta}
                <Rocket className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/plans" className="btn-secondary px-6 text-sm">
                {copy.secondaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">{copy.footnote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
