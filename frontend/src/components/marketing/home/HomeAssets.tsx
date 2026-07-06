import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';
import eurcLogo from '../../../assets/logos/eurc.png';
import usdcLogo from '../../../assets/logos/usdc.png';
import xlmLogo from '../../../assets/logos/xlm.png';
import SectionHeading from './SectionHeading';
import { MARKETING_CONTAINER } from '../layout';

type AssetCard = {
  code: 'USDC' | 'XLM' | 'EURC';
  name: string;
  description: string;
  meta: string;
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
        meta: 'Issued by Circle · Stellar',
        featured: true,
      },
      {
        code: 'XLM',
        name: 'Stellar Lumens',
        description: 'Native Stellar asset for fast settlement and near-zero network cost.',
        meta: 'Native Stellar asset',
      },
      {
        code: 'EURC',
        name: 'Euro Coin',
        description: 'Euro-denominated stablecoin for collections that start in EUR and still need the same payment flow.',
        meta: 'Issued by Circle · Stellar',
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
        meta: 'Emitido por Circle · Stellar',
        featured: true,
      },
      {
        code: 'XLM',
        name: 'Stellar Lumens',
        description: 'Activo nativo de Stellar para liquidación rápida y costo de red casi nulo.',
        meta: 'Activo nativo de Stellar',
      },
      {
        code: 'EURC',
        name: 'Euro Coin',
        description: 'Stablecoin denominada en euros para cobros que empiezan en EUR pero siguen el mismo flujo.',
        meta: 'Emitido por Circle · Stellar',
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
        meta: 'Emitido pela Circle · Stellar',
        featured: true,
      },
      {
        code: 'XLM',
        name: 'Stellar Lumens',
        description: 'Ativo nativo da Stellar para liquidação rápida e custo de rede quase zero.',
        meta: 'Ativo nativo da Stellar',
      },
      {
        code: 'EURC',
        name: 'Euro Coin',
        description: 'Stablecoin denominada em euros para cobranças que começam em EUR mas usam o mesmo fluxo.',
        meta: 'Emitido pela Circle · Stellar',
      },
    ],
  },
};

export default function HomeAssets() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <section className="relative overflow-hidden border-y border-border bg-[hsl(var(--assets-band))] text-card-invert-foreground">
      <div className="pointer-events-none absolute inset-0 pipeline-microtexture" aria-hidden="true" />
      <div className={`relative ${MARKETING_CONTAINER} py-20`}>
        <SectionHeading
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          align="center"
          tone="inverse"
          className="mx-auto max-w-2xl"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {copy.assets.map((asset) => (
            <article
              key={asset.code}
              className={`relative flex flex-col rounded-2xl border p-6 transition-colors ${
                asset.featured
                  ? 'border-primary/30 bg-card/70 hover:border-primary/50 dark:bg-background'
                  : 'border-border bg-card/70 hover:border-foreground/20 dark:bg-background'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 p-2">
                  <img
                    src={ASSET_LOGOS[asset.code]}
                    alt={asset.code}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    width={48}
                    height={48}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-lg font-semibold text-foreground">{asset.code}</span>
                  <p className="text-2xs font-medium uppercase tracking-label text-secondary-foreground dark:text-muted-foreground">
                    {asset.name}
                  </p>
                </div>
              </div>

              {asset.featured ? (
                <span className="absolute right-6 top-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-2xs font-semibold uppercase tracking-label text-accent-ink">
                  {copy.featuredLabel}
                </span>
              ) : null}

              <p className="mt-6 pb-6 text-sm leading-6 text-secondary-foreground dark:text-muted-foreground [text-wrap:pretty]">
                {asset.description}
              </p>

              <p className="mt-auto border-t border-border pt-6 text-2xs text-secondary-foreground dark:text-muted-foreground">
                {asset.meta}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
