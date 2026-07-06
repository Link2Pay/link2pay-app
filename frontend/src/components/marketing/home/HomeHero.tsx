import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import HeroPaymentMockup from '../HeroPaymentMockup';
import { MARKETING_CONTAINER } from '../layout';

type CopyBlock = {
  badge: string;
  titleLine1: string;
  titleHighlight: string;
  titleRemainder: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  honestyLine: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    badge: 'Global payments powered by Stellar',
    titleLine1: 'Your customer pays in crypto.',
    titleHighlight: 'You get paid',
    titleRemainder: 'in your local currency.',
    description:
      'Link2Pay turns a QR code or a link into a bridge between crypto and your bank account. Your customer pays in digital dollars from anywhere in the world and you receive locally, without learning crypto first.',
    primaryCta: 'Create your first link',
    secondaryCta: 'See how it works',
    honestyLine: 'Free sandbox · non-custodial from day one',
  },
  es: {
    badge: 'Pagos globales sobre Stellar',
    titleLine1: 'Tu cliente paga en crypto.',
    titleHighlight: 'Vos recibís',
    titleRemainder: 'en tu moneda local.',
    description:
      'Link2Pay convierte un QR o un link en un puente entre crypto y tu cuenta bancaria. Tu cliente paga con dólares digitales desde cualquier parte del mundo y vos recibís local, sin tener que aprender crypto primero.',
    primaryCta: 'Crear mi primer link',
    secondaryCta: 'Ver cómo funciona',
    honestyLine: 'Sandbox gratis · sin custodia de fondos',
  },
  pt: {
    badge: 'Pagamentos globais sobre Stellar',
    titleLine1: 'Seu cliente paga em cripto.',
    titleHighlight: 'Você recebe',
    titleRemainder: 'na sua moeda local.',
    description:
      'A Link2Pay transforma um QR ou um link em uma ponte entre as cripto e a sua conta bancária. Seu cliente paga com dólares digitais de qualquer parte do mundo e você recebe localmente, sem precisar dominar cripto antes.',
    primaryCta: 'Criar meu primeiro link',
    secondaryCta: 'Ver como funciona',
    honestyLine: 'Sandbox grátis · sem custódia dos fundos',
  },
};

export default function HomeHero() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="aurora-field aurora-veil border-b border-border">
      <div className={`relative ${MARKETING_CONTAINER} py-16 lg:flex lg:min-h-[calc(100dvh-4rem)] lg:items-center lg:py-20`}>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <span className="inline-flex items-center rounded-full border border-border bg-card/70 px-4 py-2 text-2xs font-medium uppercase tracking-label text-foreground">
              {copy.badge}
            </span>

            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl [text-wrap:balance]">
              <span className="block">{copy.titleLine1}</span>
              <span className="mt-1 block">
                <span className="text-success">{copy.titleHighlight}</span> {copy.titleRemainder}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground [text-wrap:pretty]">
              {copy.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link to="/app" className="btn-primary px-6 text-sm">
                {copy.primaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="#solucion" className="btn-secondary px-6 text-sm">
                {copy.secondaryCta}
              </a>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">{copy.honestyLine}</p>
          </div>

          <div className="relative">
            <div className="glass-panel relative overflow-hidden p-5 sm:p-7">
              <div className="pointer-events-none absolute inset-0 pipeline-microtexture-light opacity-60" aria-hidden="true" />
              <div className="relative">
                <HeroPaymentMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
