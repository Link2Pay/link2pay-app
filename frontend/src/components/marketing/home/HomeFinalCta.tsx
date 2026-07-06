import { ArrowRight, Boxes, Rocket, ShieldCheck, Store, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import { MARKETING_CONTAINER } from '../layout';

type AudiencePill = {
  title: string;
  fit: string;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  footnote: string;
  audienceLabel: string;
  audiences: [AudiencePill, AudiencePill, AudiencePill];
};

const AUDIENCE_ICONS: [LucideIcon, LucideIcon, LucideIcon] = [Store, User, Boxes];

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Get started',
    title: 'Connect your business to the world.',
    description:
      'Create your first link in minutes, share it anywhere, and move from crypto checkout to local settlement without changing how your team works.',
    primaryCta: 'Create your first link',
    secondaryCta: 'Compare plans',
    footnote: 'Free sandbox · ready to test today',
    audienceLabel: 'Works for',
    audiences: [
      { title: 'Businesses and shops', fit: 'Ideal for local sales' },
      { title: 'Freelancers and individuals', fit: 'Ideal for international payments' },
      { title: 'Digital businesses and platforms', fit: 'Ideal for high volume' },
    ],
  },
  es: {
    eyebrow: 'Empezá hoy',
    title: 'Conectá tu negocio con el mundo.',
    description:
      'Generá tu primer link en minutos, compartilo donde quieras y pasá del checkout en crypto a la liquidación local sin cambiar cómo trabaja tu equipo.',
    primaryCta: 'Crear mi primer link',
    secondaryCta: 'Comparar planes',
    footnote: 'Sandbox gratis · listo para probar hoy',
    audienceLabel: 'Funciona para',
    audiences: [
      { title: 'Negocios y comercios', fit: 'Ideal para venta local' },
      { title: 'Freelancers y personas', fit: 'Ideal para pagos internacionales' },
      { title: 'Negocios digitales y plataformas', fit: 'Ideal para alto volumen' },
    ],
  },
  pt: {
    eyebrow: 'Comece hoje',
    title: 'Conecte o seu negócio com o mundo.',
    description:
      'Crie o seu primeiro link em minutos, compartilhe onde quiser e passe do checkout em cripto para a liquidação local sem mudar como o seu time trabalha.',
    primaryCta: 'Criar meu primeiro link',
    secondaryCta: 'Comparar planos',
    footnote: 'Sandbox grátis · pronto para testar hoje',
    audienceLabel: 'Funciona para',
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
        {/* CTA panel — single focus */}
        <div className="glass-panel mx-auto max-w-3xl px-6 py-12 text-center sm:px-10 sm:py-14">
          <span className="inline-flex rounded-full border border-border bg-card/70 px-3 py-1 text-2xs font-medium uppercase tracking-label text-muted-foreground">
            {copy.eyebrow}
          </span>

          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl [text-wrap:balance]">
            {copy.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground [text-wrap:pretty]">
            {copy.description}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/app" className="btn-primary w-full px-7 text-sm sm:w-auto">
              {copy.primaryCta}
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/plans" className="btn-secondary w-full px-6 text-sm sm:w-auto">
              {copy.secondaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-6 inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            {copy.footnote}
          </p>
        </div>

        {/* Audience relevance — "works for" support row */}
        <div className="mx-auto mt-10 max-w-5xl">
          <p className="text-center text-2xs font-medium uppercase tracking-label text-muted-foreground">
            {copy.audienceLabel}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {copy.audiences.map((audience, index) => {
              const Icon = AUDIENCE_ICONS[index];
              return (
                <div
                  key={audience.title}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-4 text-left transition-colors hover:border-foreground/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{audience.title}</p>
                    <p className="mt-0.5 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                      {audience.fit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
