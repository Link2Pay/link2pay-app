import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import SectionHeading from './SectionHeading';
import SourceLink from './SourceLink';
import StatFigure from './StatFigure';

type StatItem = {
  value: string;
  label: string;
  source: string;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  authorityLine: string;
  sourceLabel: string;
  authoritySource: string;
  stats: [StatItem, StatItem, StatItem];
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Infrastructure',
    title: 'The bridge runs on Stellar.',
    description:
      'Settlement in seconds, near-zero transaction cost, and a network already trusted by large payment players. The landing can talk about speed because the underlying rail already delivers it.',
    authorityLine:
      'PayPal (PYUSD) and Visa already operate stablecoin payment flows on Stellar in 2025.',
    sourceLabel: 'Source',
    authoritySource:
      'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    stats: [
      {
        value: '2.6B ops · $32B',
        label: 'Operations and payment volume processed by the Stellar network in 2024.',
        source: 'https://stellar.org/faq',
      },
      {
        value: '3-5s',
        label: 'Irreversible finality on each confirmed payment.',
        source: 'https://stellar.org/faq',
      },
      {
        value: '99.99%',
        label: 'Recorded uptime since the network launched in 2014.',
        source: 'https://stellar.org/faq',
      },
    ],
  },
  es: {
    eyebrow: 'Infraestructura',
    title: 'El puente corre sobre Stellar.',
    description:
      'Liquidación en segundos, costo por transacción casi nulo y una red en la que ya confían actores grandes de pagos. El landing puede hablar de velocidad porque el riel de fondo ya la entrega.',
    authorityLine:
      'PayPal (PYUSD) y Visa ya operan flujos de pagos con stablecoins sobre Stellar en 2025.',
    sourceLabel: 'Fuente',
    authoritySource:
      'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    stats: [
      {
        value: '2.600 M ops · USD 32.000 M',
        label: 'Operaciones y volumen de pagos procesados por Stellar en 2024.',
        source: 'https://stellar.org/faq',
      },
      {
        value: '3-5s',
        label: 'Finalidad irreversible en cada pago confirmado.',
        source: 'https://stellar.org/faq',
      },
      {
        value: '99,99%',
        label: 'Uptime registrado desde el lanzamiento de la red en 2014.',
        source: 'https://stellar.org/faq',
      },
    ],
  },
  pt: {
    eyebrow: 'Infraestrutura',
    title: 'A ponte roda sobre a Stellar.',
    description:
      'Liquidação em segundos, custo por transação quase zero e uma rede em que grandes nomes de pagamentos já confiam. A landing pode falar de velocidade porque o trilho por baixo já a entrega.',
    authorityLine:
      'PayPal (PYUSD) e Visa já operam fluxos de pagamentos com stablecoins sobre a Stellar em 2025.',
    sourceLabel: 'Fonte',
    authoritySource:
      'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    stats: [
      {
        value: '2,6 bi ops · USD 32 bi',
        label: 'Operações e volume de pagamentos processados pela Stellar em 2024.',
        source: 'https://stellar.org/faq',
      },
      {
        value: '3-5s',
        label: 'Finalidade irreversível em cada pagamento confirmado.',
        source: 'https://stellar.org/faq',
      },
      {
        value: '99,99%',
        label: 'Uptime registrado desde o lançamento da rede em 2014.',
        source: 'https://stellar.org/faq',
      },
    ],
  },
};

export default function HomeStellarProof() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
            className="max-w-xl"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            {copy.stats.map((stat, index) => (
              <StatFigure
                key={stat.label}
                value={stat.value}
                label={stat.label}
                source={stat.source}
                sourceLabel={copy.sourceLabel}
                tone={index === 0 ? 'primary' : 'default'}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            <span className="font-semibold text-foreground">{copy.authorityLine}</span>
          </p>
          <SourceLink href={copy.authoritySource} label={copy.sourceLabel} className="mt-3" />
        </div>
      </div>
    </section>
  );
}
