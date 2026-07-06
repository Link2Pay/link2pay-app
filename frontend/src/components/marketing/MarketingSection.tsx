import type { ReactNode } from 'react';
import { MARKETING_CONTAINER } from './layout';

/** Inverse "band" tokens shared with the landing sections for visual rhythm. */
export type BandToken = 'problem-band' | 'infra-band' | 'assets-band';

type MarketingSectionProps = {
  /**
   * Surface tone:
   * - `default`  → page background
   * - `card`     → subtle raised surface (`bg-card`)
   * - `inverse`  → dark band with microtexture (uses `band` token)
   */
  tone?: 'default' | 'card' | 'inverse';
  /** Band color token when `tone="inverse"`. Defaults to the indigo `assets-band`. */
  band?: BandToken;
  id?: string;
  /** Vertical padding. Standard rhythm is `py-20`. */
  className?: string;
  /** Extra classes for the inner container. */
  innerClassName?: string;
  children: ReactNode;
};

/**
 * Canonical section wrapper for the marketing pages.
 *
 * Encapsulates the hairline separation, shared container, standard vertical
 * rhythm (`py-20`), and the inverse-band pattern (dark surface + `pipeline-microtexture`)
 * lifted from `HomeAssets`. Keeps light/dark handled purely by tokens.
 */
export default function MarketingSection({
  tone = 'default',
  band = 'assets-band',
  id,
  className = 'py-20',
  innerClassName = '',
  children,
}: MarketingSectionProps) {
  if (tone === 'inverse') {
    return (
      <section
        id={id}
        className={`relative overflow-hidden border-y border-border bg-[hsl(var(--${band}))] text-card-invert-foreground`}
      >
        <div className="pointer-events-none absolute inset-0 pipeline-microtexture" aria-hidden="true" />
        <div className={`relative ${MARKETING_CONTAINER} ${className} ${innerClassName}`.trim()}>
          {children}
        </div>
      </section>
    );
  }

  const surface = tone === 'card' ? 'bg-card' : '';

  return (
    <section id={id} className={`border-b border-border ${surface}`.trim()}>
      <div className={`${MARKETING_CONTAINER} ${className} ${innerClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}
