import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe2,
  Heart,
  Lightbulb,
  Lock,
  Rocket,
  Shield,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const VALUE_ICONS = [Shield, Lightbulb, Globe2, Lock] as const;
const MILESTONE_ICONS = [Lightbulb, Rocket, Users, Target] as const;

type Item = { title: string; description: string };
type Milestone = { label: string; detail: string };

type AboutCopy = {
  heroTitleStart: string;
  heroTitleHighlight: string;
  heroDescription: string;
  storyTitle: string;
  storySubtitle: string;
  valuesTitle: string;
  valuesSubtitle: string;
  journeyTitle: string;
  journeySubtitle: string;
  poweredTitle: string;
  poweredDescription: string;
  finalTitle: string;
  finalDescription: string;
  finalCta: string;
};

const COPY: Record<Language, AboutCopy> = {
  en: {
    heroTitleStart: "We're making it easier for",
    heroTitleHighlight: 'freelancers to get paid',
    heroDescription:
      'Link2Pay was born from a simple frustration: why does it take so long and cost so much to get paid for work already done?',
    storyTitle: 'Our Story',
    storySubtitle: 'From frustration to solution, this is why we built Link2Pay.',
    valuesTitle: 'What we believe in',
    valuesSubtitle: 'The principles that guide everything we build.',
    journeyTitle: 'Our journey',
    journeySubtitle: "We're just getting started, and every step gets us closer to our mission.",
    poweredTitle: 'Powered by the Stellar Network',
    poweredDescription:
      'We chose Stellar because it was built for payments. Transactions settle in seconds, cost fractions of a penny, and work across borders.',
    finalTitle: 'Join us on this journey',
    finalDescription: 'We are building the future of freelance payments. Try Link2Pay today.',
    finalCta: 'Get Started Free',
  },
  es: {
    heroTitleStart: 'Estamos haciendo mas facil que',
    heroTitleHighlight: 'freelancers cobren',
    heroDescription:
      'Link2Pay nacio de una frustracion simple: por que tardan tanto y cuestan tanto los pagos por trabajo ya entregado?',
    storyTitle: 'Nuestra historia',
    storySubtitle: 'De la frustracion a la solucion, por eso construimos Link2Pay.',
    valuesTitle: 'En que creemos',
    valuesSubtitle: 'Los principios que guian todo lo que construimos.',
    journeyTitle: 'Nuestro camino',
    journeySubtitle: 'Estamos empezando, y cada paso nos acerca a nuestra mision.',
    poweredTitle: 'Impulsado por la red Stellar',
    poweredDescription:
      'Elegimos Stellar porque fue creada para pagos. Las transacciones se confirman en segundos, cuestan casi nada y funcionan sin fronteras.',
    finalTitle: 'Unete a este camino',
    finalDescription: 'Estamos construyendo el futuro de pagos freelance. Prueba Link2Pay hoy.',
    finalCta: 'Comenzar gratis',
  },
  pt: {
    heroTitleStart: 'Estamos tornando mais facil para',
    heroTitleHighlight: 'freelancers receberem',
    heroDescription:
      'Link2Pay nasceu de uma frustracao simples: por que receber por um trabalho entregue leva tanto tempo e custa tanto?',
    storyTitle: 'Nossa historia',
    storySubtitle: 'Da frustracao para a solucao, foi por isso que criamos Link2Pay.',
    valuesTitle: 'No que acreditamos',
    valuesSubtitle: 'Os principios que orientam tudo o que construimos.',
    journeyTitle: 'Nossa jornada',
    journeySubtitle: 'Estamos apenas comecando, e cada passo nos aproxima da nossa missao.',
    poweredTitle: 'Movido pela rede Stellar',
    poweredDescription:
      'Escolhemos Stellar porque foi feita para pagamentos. Transacoes confirmam em segundos, custam quase nada e funcionam sem fronteiras.',
    finalTitle: 'Junte-se a essa jornada',
    finalDescription: 'Estamos construindo o futuro dos pagamentos freelancer. Teste Link2Pay hoje.',
    finalCta: 'Comecar gratis',
  },
};

const STORY_BLOCKS: Record<Language, Item[]> = {
  en: [
    {
      title: 'The problem we saw',
      description:
        'Freelancers in LATAM and around the world wait days or weeks for international payments. Wires are expensive and slow.',
    },
    {
      title: 'The solution we built',
      description:
        'Link2Pay removes middlemen. You create an invoice, share a link, and get paid directly through Stellar in seconds.',
    },
    {
      title: 'Our vision',
      description:
        'Getting paid for work should be as easy as sending a text. That is the future we are building.',
    },
  ],
  es: [
    {
      title: 'El problema que vimos',
      description:
        'Freelancers en LATAM y el mundo esperan dias o semanas para pagos internacionales. Las transferencias son caras y lentas.',
    },
    {
      title: 'La solucion que construimos',
      description:
        'Link2Pay elimina intermediarios. Creas una factura, compartes un link y cobras directo por Stellar en segundos.',
    },
    {
      title: 'Nuestra vision',
      description:
        'Cobrar por tu trabajo deberia ser tan facil como enviar un mensaje. Ese es el futuro que construimos.',
    },
  ],
  pt: [
    {
      title: 'O problema que vimos',
      description:
        'Freelancers na LATAM e no mundo esperam dias ou semanas para pagamentos internacionais. Transferencias sao caras e lentas.',
    },
    {
      title: 'A solucao que criamos',
      description:
        'Link2Pay remove intermediarios. Voce cria uma fatura, compartilha um link e recebe direto pela Stellar em segundos.',
    },
    {
      title: 'Nossa visao',
      description:
        'Receber por um trabalho deveria ser tao facil quanto enviar uma mensagem. Esse e o futuro que estamos criando.',
    },
  ],
};

const VALUES: Record<Language, Item[]> = {
  en: [
    {
      title: 'Your money stays yours',
      description: 'We are non-custodial. We never hold funds, and every payment goes directly to your wallet.',
    },
    {
      title: 'Simple by design',
      description: 'You should not need deep technical knowledge to invoice clients and get paid.',
    },
    {
      title: 'Built for global work',
      description: 'Freelancers have no borders, so payments should work globally with low fees.',
    },
    {
      title: 'Transparent and trustworthy',
      description: 'Every payment is verifiable on-chain. No black boxes and no guesswork.',
    },
  ],
  es: [
    {
      title: 'Tu dinero sigue siendo tuyo',
      description: 'Somos no custodial. Nunca retenemos fondos y cada pago va directo a tu wallet.',
    },
    {
      title: 'Simple por diseno',
      description: 'No deberias necesitar conocimientos tecnicos profundos para facturar y cobrar.',
    },
    {
      title: 'Creado para trabajo global',
      description: 'Los freelancers no tienen fronteras, y los pagos tampoco deberian tenerlas.',
    },
    {
      title: 'Transparente y confiable',
      description: 'Cada pago se verifica on-chain. Sin cajas negras ni dudas.',
    },
  ],
  pt: [
    {
      title: 'Seu dinheiro continua seu',
      description: 'Somos non-custodial. Nunca seguramos fundos e cada pagamento vai direto para sua wallet.',
    },
    {
      title: 'Simples por design',
      description: 'Voce nao deveria precisar de conhecimento tecnico profundo para faturar e receber.',
    },
    {
      title: 'Feito para trabalho global',
      description: 'Freelancers nao tem fronteiras, e pagamentos tambem nao deveriam ter.',
    },
    {
      title: 'Transparente e confiavel',
      description: 'Cada pagamento pode ser verificado on-chain. Sem caixa-preta e sem duvidas.',
    },
  ],
};

const MILESTONES: Record<Language, Milestone[]> = {
  en: [
    { label: 'Idea born', detail: 'Identified payment pain points for LATAM freelancers' },
    { label: 'MVP launched', detail: 'First working prototype on Stellar Testnet' },
    { label: 'Early users', detail: 'Freelancers and agencies started testing the platform' },
    { label: "What's next", detail: 'Mobile app, recurring invoices, and more currencies' },
  ],
  es: [
    { label: 'Nace la idea', detail: 'Identificamos dolor de pagos para freelancers LATAM' },
    { label: 'MVP lanzado', detail: 'Primer prototipo funcional en Stellar Testnet' },
    { label: 'Usuarios iniciales', detail: 'Freelancers y agencias empezaron pruebas' },
    { label: 'Lo que sigue', detail: 'App movil, facturas recurrentes y mas monedas' },
  ],
  pt: [
    { label: 'Ideia nasceu', detail: 'Identificamos dor de pagamentos para freelancers LATAM' },
    { label: 'MVP lancado', detail: 'Primeiro prototipo funcional na Stellar Testnet' },
    { label: 'Usuarios iniciais', detail: 'Freelancers e agencias iniciaram testes' },
    { label: 'Proximo passo', detail: 'App mobile, faturas recorrentes e mais moedas' },
  ],
};

const POWERED_TAGS: Record<Language, string[]> = {
  en: ['5-second settlement', 'Fees under $0.01', '150+ countries', 'Multi-currency native', 'Energy efficient'],
  es: ['Liquidacion en 5 segundos', 'Comisiones menores a $0.01', '150+ paises', 'Soporte multi-moneda', 'Eficiente en energia'],
  pt: ['Liquidacao em 5 segundos', 'Taxas abaixo de $0.01', '150+ paises', 'Suporte multi-moeda', 'Energeticamente eficiente'],
};

export default function About() {
  const { language } = useI18n();

  const copy = COPY[language];
  const storyBlocks = STORY_BLOCKS[language];
  const values = VALUES[language];
  const milestones = MILESTONES[language];
  const poweredTags = POWERED_TAGS[language];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_hsl(175_75%_45%_/_0.10),transparent_68%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {copy.heroTitleStart}{' '}
              <span className="text-gradient">{copy.heroTitleHighlight}</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{copy.heroDescription}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.storyTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.storySubtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {storyBlocks.map((item, index) => (
            <article key={item.title} className="card hover-glow p-8 animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.1}s` }}>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground">{copy.valuesTitle}</h2>
            <p className="mt-3 text-base text-muted-foreground">{copy.valuesSubtitle}</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {values.map((value, index) => {
              const Icon = VALUE_ICONS[index];
              return (
                <article
                  key={value.title}
                  className="group rounded-xl border border-border bg-background p-8 transition-all hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${0.05 + index * 0.08}s` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-foreground">{copy.journeyTitle}</h2>
          <p className="mt-3 text-base text-muted-foreground">{copy.journeySubtitle}</p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {milestones.map((milestone, index) => {
            const Icon = MILESTONE_ICONS[index];
            return (
              <div key={milestone.label} className="card p-6 text-center animate-fade-in" style={{ animationDelay: `${0.05 + index * 0.08}s` }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{milestone.label}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{milestone.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-foreground">{copy.poweredTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.poweredDescription}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {poweredTags.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                  <Zap className="h-3 w-3" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="bg-[linear-gradient(135deg,_hsl(175_75%_45%),_hsl(175_75%_35%))] p-10 sm:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <Heart className="mx-auto mb-4 h-8 w-8 text-primary-foreground/80" />
              <h3 className="text-3xl font-semibold text-primary-foreground">{copy.finalTitle}</h3>
              <p className="mt-4 text-base text-primary-foreground/80">{copy.finalDescription}</p>
              <div className="mt-8">
                <Link to="/get-started" className="btn bg-background text-primary hover:bg-muted font-semibold px-6 py-3">
                  {copy.finalCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
