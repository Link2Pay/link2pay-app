import { Landmark, ShieldCheck, Zap } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import { MARKETING_CONTAINER } from '../layout';
import SectionHeading from './SectionHeading';

type ProofItem = {
  value: string;
  title: string;
  description: string;
  note?: string;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  panelEyebrow: string;
  authorityLine: string;
  proofs: [ProofItem, ProofItem, ProofItem, ProofItem];
  panelSummary: string;
  tags: [string, string, string];
};

const TAG_ICONS = [Landmark, Zap, ShieldCheck] as const;

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Infrastructure',
    title: 'The bridge runs on Stellar.',
    description:
      'Settlement in seconds, base fees near zero, and an infrastructure already used for cross-border value movement. The product can promise simpler global payments because the rail underneath already behaves that way.',
    panelEyebrow: 'Network signals',
    authorityLine:
      'PayPal (PYUSD) and Visa already operate stablecoin payment flows on Stellar in 2025.',
    proofs: [
      {
        value: '3-5s',
        title: 'Settlement finality',
        description: 'Confirmed payments become final in seconds, so the checkout promise matches the underlying rail.',
      },
      {
        value: '0.00001 XLM',
        title: 'Per transaction',
        description: 'The base fee per operation stays near zero, keeping small-ticket payments and repeated payment flows viable.',
      },
      {
        value: '99.99%',
        title: 'Uptime since 2014',
        description: 'The network has recorded a 99.99% uptime rate since launch, which is the reliability claim users need here.',
      },
      {
        value: '150+',
        title: 'Countries reached',
        description: 'Global reach works better as a breadth signal here: cross-border by design, not limited to one payout corridor.',
        note: 'Global reach',
      },
    ],
    panelSummary: 'Speed, cost, continuity, and reach are not decorative claims here. They are operating characteristics of the rail Link2Pay is built on.',
    tags: ['Paid in your currency', 'Settles in 3-5s', 'No crypto know-how'],
  },
  es: {
    eyebrow: 'Infraestructura',
    title: 'El puente corre sobre Stellar.',
    description:
      'Liquidación en segundos, fee base casi nula y una infraestructura ya usada para mover valor entre países. Link2Pay puede prometer pagos globales más simples porque el riel de fondo ya se comporta así.',
    panelEyebrow: 'Señales de la red',
    authorityLine:
      'PayPal (PYUSD) y Visa ya operan flujos de pagos con stablecoins sobre Stellar en 2025.',
    proofs: [
      {
        value: '3-5s',
        title: 'Liquidación',
        description: 'La finalidad llega en segundos, así que la promesa del checkout coincide con el riel que liquida el pago.',
      },
      {
        value: '0,00001 XLM',
        title: 'Por transacción',
        description: 'La fee base por operación se mantiene casi en cero, algo clave para que los montos chicos y los flujos recurrentes sigan cerrando.',
      },
      {
        value: '99,99%',
        title: 'Uptime desde 2014',
        description: 'La red registra 99,99% de uptime desde su lanzamiento, que es la señal de confiabilidad que esta parte de la página necesita.',
      },
      {
        value: '150+',
        title: 'Países alcanzados',
        description: 'Acá conviene leerlo como señal de alcance: un riel pensado para cobrar afuera sin depender de un solo corredor.',
        note: 'Alcance global',
      },
    ],
    panelSummary: 'Velocidad, costo, continuidad y alcance no aparecen como claims decorativos. Son propiedades operativas del riel sobre el que corre Link2Pay.',
    tags: ['Recibís en tu moneda', 'Liquidación en 3-5s', 'Sin saber de crypto'],
  },
  pt: {
    eyebrow: 'Infraestrutura',
    title: 'A ponte roda sobre a Stellar.',
    description:
      'Liquidação em segundos, taxa-base quase nula e uma infraestrutura já usada para mover valor entre países. A Link2Pay pode prometer pagamentos globais mais simples porque o trilho por baixo já se comporta assim.',
    panelEyebrow: 'Sinais da rede',
    authorityLine:
      'PayPal (PYUSD) e Visa já operam fluxos de pagamentos com stablecoins sobre a Stellar em 2025.',
    proofs: [
      {
        value: '3-5s',
        title: 'Liquidação',
        description: 'A finalidade chega em segundos, então a promessa do checkout combina com o trilho que realmente liquida o pagamento.',
      },
      {
        value: '0,00001 XLM',
        title: 'Por transação',
        description: 'A taxa-base por operação permanece quase zero, o que ajuda a manter viáveis até pagamentos de ticket menor e fluxos repetidos.',
      },
      {
        value: '99,99%',
        title: 'Uptime desde 2014',
        description: 'A rede registra 99,99% de uptime desde o lançamento, exatamente o tipo de sinal de confiabilidade que esta parte da página precisa.',
      },
      {
        value: '150+',
        title: 'Países alcançados',
        description: 'Aqui isso funciona melhor como sinal de alcance: um trilho pensado para receber de fora sem depender de um único corredor.',
        note: 'Alcance global',
      },
    ],
    panelSummary: 'Velocidade, custo, continuidade e alcance não aparecem como claims decorativos. São características operacionais do trilho sobre o qual a Link2Pay roda.',
    tags: ['Recebe na sua moeda', 'Liquida em 3-5s', 'Sem saber de cripto'],
  },
};

export default function HomeStellarProof() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="border-b border-border bg-background">
      <div className={`${MARKETING_CONTAINER} py-20`}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          {/* Left column — prose + authority signal (sticky on desktop) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeading
              eyebrow={copy.eyebrow}
              title={copy.title}
              description={copy.description}
            />

            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
              {copy.panelSummary}
            </p>

            <div className="mt-8 border-l-2 border-border pl-4">
              <p className="text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                <span className="font-semibold text-foreground">{copy.authorityLine}</span>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {copy.tags.map((tag, index) => {
                const Icon = TAG_ICONS[index];
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-medium text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-accent-ink" aria-hidden="true" />
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right column — "Señales de la red" panel */}
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
                  className={`px-5 py-5 sm:px-6 ${index !== 0 ? 'border-t border-border' : ''}`}
                >
                  <div className="font-display text-2xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-3xl">
                    {proof.value}
                  </div>
                  <p className="mt-1 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                    {proof.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                    {proof.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
