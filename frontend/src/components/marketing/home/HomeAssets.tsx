import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import eurcLogo from '../../../assets/logos/eurc.png';
import usdcLogo from '../../../assets/logos/usdc.png';
import xlmLogo from '../../../assets/logos/xlm.png';
import SectionHeading from './SectionHeading';

type AssetCard = {
  code: 'USDC' | 'XLM' | 'EURC';
  name: string;
  description: string;
  featured?: boolean;
};

type CopyBlock = {
  eyebrow: string;
  title: string;
  description: string;
  featuredLabel: string;
  assets: [AssetCard, AssetCard, AssetCard];
};

const ASSET_LOGOS = {
  USDC: usdcLogo,
  XLM: xlmLogo,
  EURC: eurcLogo,
} as const;

const COPY: Record<Language, CopyBlock> = {
  en: {
    eyebrow: 'Assets',
    title: 'Accept the assets your customers already use.',
    description:
      'Collect USDC first, then XLM and EURC from the same checkout pattern. The settlement rail stays one product surface even when the asset mix changes.',
    featuredLabel: 'Most used',
    assets: [
      {
        code: 'USDC',
        name: 'USD Coin',
        description: 'The digital dollar by Circle. Stable value for checkout, with the shortest path into local settlement.',
        featured: true,
      },
      {
        code: 'XLM',
        name: 'Stellar Lumens',
        description: 'Native Stellar asset for fast settlement and near-zero network cost.',
      },
      {
        code: 'EURC',
        name: 'Euro Coin',
        description: 'Euro-denominated stablecoin for collections that start in EUR and still need the same payment flow.',
      },
    ],
  },
  es: {
    eyebrow: 'Activos',
    title: 'Aceptá los activos que tus clientes ya usan.',
    description:
      'Cobrá primero en USDC y también en XLM o EURC desde el mismo patrón de checkout. El riel de liquidación sigue siendo una sola superficie de producto aunque cambie el activo.',
    featuredLabel: 'El más usado',
    assets: [
      {
        code: 'USDC',
        name: 'USD Coin',
        description: 'El dólar digital de Circle. Valor estable para cobrar y el camino más corto hacia la liquidación local.',
        featured: true,
      },
      {
        code: 'XLM',
        name: 'Stellar Lumens',
        description: 'Activo nativo de Stellar para liquidación rápida y costo de red casi nulo.',
      },
      {
        code: 'EURC',
        name: 'Euro Coin',
        description: 'Stablecoin denominada en euros para cobros que empiezan en EUR pero siguen el mismo flujo.',
      },
    ],
  },
  pt: {
    eyebrow: 'Ativos',
    title: 'Aceite os ativos que seus clientes já usam.',
    description:
      'Receba primeiro em USDC e também em XLM ou EURC usando o mesmo padrão de checkout. O trilho de liquidação continua sendo uma única superfície de produto mesmo quando o ativo muda.',
    featuredLabel: 'O mais usado',
    assets: [
      {
        code: 'USDC',
        name: 'USD Coin',
        description: 'O dólar digital da Circle. Valor estável para cobrar e o caminho mais curto até a liquidação local.',
        featured: true,
      },
      {
        code: 'XLM',
        name: 'Stellar Lumens',
        description: 'Ativo nativo da Stellar para liquidação rápida e custo de rede quase zero.',
      },
      {
        code: 'EURC',
        name: 'Euro Coin',
        description: 'Stablecoin denominada em euros para cobranças que começam em EUR mas usam o mesmo fluxo.',
      },
    ],
  },
};

export default function HomeAssets() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
            className="max-w-xl"
          />

          <div className="space-y-4">
            {copy.assets.map((asset) => (
              <article
                key={asset.code}
                className={`rounded-2xl border p-6 ${
                  asset.featured ? 'border-primary/30 bg-muted/50' : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-2">
                    <img
                      src={ASSET_LOGOS[asset.code]}
                      alt=""
                      className="h-full w-full object-contain"
                      loading="lazy"
                      width={48}
                      height={48}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{asset.name}</h3>
                      {asset.featured ? (
                        <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-2xs font-semibold uppercase tracking-label text-accent-ink">
                          {copy.featuredLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                      {asset.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
