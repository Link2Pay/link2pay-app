import type { ReactNode } from 'react';
import { MARKETING_CONTAINER } from './layout';

type MarketingHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  /** Optional informational pill rendered under the subtitle (e.g. "SDK free" line). */
  note?: ReactNode;
  /** Optional CTA row. */
  actions?: ReactNode;
  /** `aurora` uses the animated marketing field (like the landing hero); `plain` is a flat card surface. */
  tone?: 'aurora' | 'plain';
  className?: string;
};

/**
 * Canonical centered hero for the public marketing pages.
 *
 * Unifies the three ad-hoc heroes (Features/Pricing/About) into one token-driven
 * component: single title scale, homogeneous responsive padding, and the shared
 * `aurora-field` background instead of a hardcoded radial gradient.
 */
export default function MarketingHero({
  eyebrow,
  title,
  subtitle,
  note,
  actions,
  tone = 'aurora',
  className = '',
}: MarketingHeroProps) {
  const surface =
    tone === 'aurora' ? 'aurora-field aurora-veil' : 'bg-card';

  return (
    <section className={`relative overflow-hidden border-b border-border ${surface} ${className}`.trim()}>
      <div className={`relative ${MARKETING_CONTAINER} pb-16 pt-20 sm:pb-20 sm:pt-24`}>
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <p className="text-2xs font-medium uppercase tracking-label text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl [text-wrap:balance]">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground [text-wrap:pretty] md:text-lg">
              {subtitle}
            </p>
          )}
          {note && <div className="mt-6 flex justify-center">{note}</div>}
          {actions && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
