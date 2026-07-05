import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import { MARKETING_CONTAINER } from '../layout';
import SectionHeading from './SectionHeading';
import StatFigure from './StatFigure';

type ProblemStat = {
  value: string;
  label: string;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  bridgeLine: string;
  stats: [ProblemStat, ProblemStat, ProblemStat, ProblemStat];
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'The problem',
    title: 'Getting paid from abroad still costs too much.',
    description:
      'Cross-border payments still eat margin, slow down cash flow, and force merchants to explain banking friction to their customers. Latin America already uses stablecoins. The missing piece is the bridge into the account you already operate with.',
    bridgeLine: 'Stablecoins already move the money. What is missing is the bridge into your account.',
    stats: [
      {
        value: '6.36%',
        label: 'Average global remittance cost, still more than double the UN target.',
      },
      {
        value: '14.99%',
        label: 'Average remittance cost when the payment goes through banks.',
      },
      {
        value: 'USD 11.848B',
        label: 'Remittances received by Colombia in 2024, equivalent to 2.3% of GDP.',
      },
      {
        value: '48%',
        label: 'Of crypto purchases in Colombia in 2024 were already made with stablecoins.',
      },
    ],
  },
  es: {
    eyebrow: 'El problema',
    title: 'Cobrar desde el exterior sigue costando demasiado.',
    description:
      'Los pagos internacionales siguen comiéndose margen, demorando el flujo de caja y obligando a explicar fricción bancaria. Latinoamérica ya usa stablecoins. La pieza que falta es el puente hacia la cuenta que ya usás todos los días.',
    bridgeLine: 'La plata ya se mueve en stablecoins. Lo que falta es el puente a tu cuenta.',
    stats: [
      {
        value: '6,36%',
        label: 'Costo promedio global de una remesa, todavía más del doble de la meta de la ONU.',
      },
      {
        value: '14,99%',
        label: 'Costo promedio cuando la remesa viaja por bancos.',
      },
      {
        value: 'USD 11.848 M',
        label: 'Remesas que recibió Colombia en 2024, equivalentes al 2,3% del PIB.',
      },
      {
        value: '48%',
        label: 'De las compras cripto en Colombia en 2024 ya fueron stablecoins.',
      },
    ],
  },
  pt: {
    eyebrow: 'O problema',
    title: 'Receber do exterior ainda custa caro demais.',
    description:
      'Pagamentos internacionais ainda consomem margem, atrasam o caixa e obrigam o negócio a explicar a fricção bancária ao cliente. A América Latina já usa stablecoins. O que falta é a ponte para a conta que você já usa.',
    bridgeLine: 'O dinheiro já se move em stablecoins. O que falta é a ponte até a sua conta.',
    stats: [
      {
        value: '6,36%',
        label: 'Custo médio global de uma remessa, ainda mais que o dobro da meta da ONU.',
      },
      {
        value: '14,99%',
        label: 'Custo médio quando a remessa passa pelos bancos.',
      },
      {
        value: 'USD 11,848 bi',
        label: 'Remessas recebidas pela Colômbia em 2024, equivalentes a 2,3% do PIB.',
      },
      {
        value: '48%',
        label: 'Das compras cripto na Colômbia em 2024 já foram feitas com stablecoins.',
      },
    ],
  },
};

export default function HomeProblem() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="relative overflow-hidden border-b border-border bg-card-invert text-card-invert-foreground">
      <div className="pointer-events-none absolute inset-0 pipeline-microtexture" aria-hidden="true" />
      <div className={`relative ${MARKETING_CONTAINER} py-20`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="max-w-xl">
            <SectionHeading
              eyebrow={copy.eyebrow}
              title={copy.title}
              description={copy.description}
              tone="inverse"
            />
            <p className="mt-8 border-t border-card-invert-foreground/10 pt-6 text-sm font-medium leading-6 text-card-invert-foreground/80 [text-wrap:pretty]">
              {copy.bridgeLine}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {copy.stats.map((stat) => (
              <StatFigure
                key={stat.label}
                value={stat.value}
                label={stat.label}
                tone="inverse"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
