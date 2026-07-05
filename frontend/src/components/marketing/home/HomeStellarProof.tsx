import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import SectionHeading from './SectionHeading';
import SourceLink from './SourceLink';

type ProofItem = {
  value: string;
  title: string;
  description: string;
  source?: string;
  sourceLabel?: string;
  note?: string;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  panelEyebrow: string;
  authorityLine: string;
  sourceLabel: string;
  authoritySource: string;
  proofs: [ProofItem, ProofItem, ProofItem, ProofItem];
  panelSummary: string;
};

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Infrastructure',
    title: 'The bridge runs on Stellar.',
    description:
      'Settlement in seconds, base fees near zero, and an infrastructure already used for cross-border value movement. The product can promise simpler global payments because the rail underneath already behaves that way.',
    panelEyebrow: 'Network signals',
    authorityLine:
      'PayPal (PYUSD) and Visa already operate stablecoin payment flows on Stellar in 2025.',
    sourceLabel: 'Source',
    authoritySource:
      'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    proofs: [
      {
        value: '3-5s',
        title: 'Settlement finality',
        description: 'Confirmed payments become final in seconds, so the checkout promise matches the underlying rail.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '0.00001 XLM',
        title: 'Per transaction',
        description: 'The base fee per operation stays near zero, keeping small-ticket payments and repeated payment flows viable.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '99.99%',
        title: 'Uptime since 2014',
        description: 'The network has recorded a 99.99% uptime rate since launch, which is the reliability claim users need here.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '150+',
        title: 'Countries reached',
        description: 'Global reach works better as a breadth signal here: cross-border by design, not limited to one payout corridor.',
        note: 'Global reach',
      },
    ],
    panelSummary: 'Speed, cost, continuity, and reach are not decorative claims here. They are operating characteristics of the rail Link2Pay is built on.',
  },
  es: {
    eyebrow: 'Infraestructura',
    title: 'El puente corre sobre Stellar.',
    description:
      'Liquidación en segundos, fee base casi nula y una infraestructura ya usada para mover valor entre países. Link2Pay puede prometer pagos globales más simples porque el riel de fondo ya se comporta así.',
    panelEyebrow: 'Señales de la red',
    authorityLine:
      'PayPal (PYUSD) y Visa ya operan flujos de pagos con stablecoins sobre Stellar en 2025.',
    sourceLabel: 'Fuente',
    authoritySource:
      'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    proofs: [
      {
        value: '3-5s',
        title: 'Liquidación',
        description: 'La finalidad llega en segundos, así que la promesa del checkout coincide con el riel que liquida el pago.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '0,00001 XLM',
        title: 'Por transacción',
        description: 'La fee base por operación se mantiene casi en cero, algo clave para que los montos chicos y los flujos recurrentes sigan cerrando.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '99,99%',
        title: 'Uptime desde 2014',
        description: 'La red registra 99,99% de uptime desde su lanzamiento, que es la señal de confiabilidad que esta parte de la página necesita.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '150+',
        title: 'Países alcanzados',
        description: 'Acá conviene leerlo como señal de alcance: un riel pensado para cobrar afuera sin depender de un solo corredor.',
        note: 'Alcance global',
      },
    ],
    panelSummary: 'Velocidad, costo, continuidad y alcance no aparecen como claims decorativos. Son propiedades operativas del riel sobre el que corre Link2Pay.',
  },
  pt: {
    eyebrow: 'Infraestrutura',
    title: 'A ponte roda sobre a Stellar.',
    description:
      'Liquidação em segundos, taxa-base quase nula e uma infraestrutura já usada para mover valor entre países. A Link2Pay pode prometer pagamentos globais mais simples porque o trilho por baixo já se comporta assim.',
    panelEyebrow: 'Sinais da rede',
    authorityLine:
      'PayPal (PYUSD) e Visa já operam fluxos de pagamentos com stablecoins sobre a Stellar em 2025.',
    sourceLabel: 'Fonte',
    authoritySource:
      'https://www.coindesk.com/sponsored-content/stellar-and-the-stablecoin-moment-infrastructure-for-enterprise-grade-payments',
    proofs: [
      {
        value: '3-5s',
        title: 'Liquidação',
        description: 'A finalidade chega em segundos, então a promessa do checkout combina com o trilho que realmente liquida o pagamento.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '0,00001 XLM',
        title: 'Por transação',
        description: 'A taxa-base por operação permanece quase zero, o que ajuda a manter viáveis até pagamentos de ticket menor e fluxos repetidos.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '99,99%',
        title: 'Uptime desde 2014',
        description: 'A rede registra 99,99% de uptime desde o lançamento, exatamente o tipo de sinal de confiabilidade que esta parte da página precisa.',
        source: 'https://stellar.org/faq',
        sourceLabel: 'FAQ',
      },
      {
        value: '150+',
        title: 'Países alcançados',
        description: 'Aqui isso funciona melhor como sinal de alcance: um trilho pensado para receber de fora sem depender de um único corredor.',
        note: 'Alcance global',
      },
    ],
    panelSummary: 'Velocidade, custo, continuidade e alcance não aparecem como claims decorativos. São características operacionais do trilho sobre o qual a Link2Pay roda.',
  },
};

export default function HomeStellarProof() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
            className="max-w-xl"
          />

          <div className="card overflow-hidden border border-border">
            <div className="border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
              <p className="text-2xs font-medium uppercase tracking-label text-muted-foreground">
                {copy.panelEyebrow}
              </p>
            </div>

            <div>
              {copy.proofs.map((proof, index) => (
                <article
                  key={proof.title}
                  className={`grid gap-4 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] lg:gap-6 ${index !== 0 ? 'border-t border-border' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="font-display text-3xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-4xl">
                      {proof.value}
                    </div>
                    <p className="mt-2 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                      {proof.title}
                    </p>
                  </div>

                  <p className="max-w-xl text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                    {proof.description}
                  </p>

                  {proof.source && proof.sourceLabel ? (
                    <SourceLink
                      href={proof.source}
                      label={proof.sourceLabel}
                      className="lg:justify-self-end"
                    />
                  ) : (
                    <p className="text-2xs font-medium uppercase tracking-label text-muted-foreground lg:justify-self-end">
                      {proof.note}
                    </p>
                  )}
                </article>
              ))}
            </div>

            <div className="border-t border-border bg-card px-5 py-4 sm:px-6">
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                {copy.panelSummary}
              </p>
            </div>
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
