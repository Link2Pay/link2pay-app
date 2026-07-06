import type { CSSProperties, ElementType, ReactNode } from 'react';

type MarketingCardProps = {
  /** Highlight the card with the primary accent border (e.g. featured plan/asset). */
  featured?: boolean;
  /** Render as a different element (e.g. `article`, `li`). Defaults to `article`. */
  as?: ElementType;
  /** Padding preset. `default` = p-6, `roomy` = p-8. */
  padding?: 'default' | 'roomy';
  className?: string;
  /** Inline styles (e.g. staggered `animationDelay`). */
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Equal-height base card for the marketing pages.
 *
 * Wraps the `.card` utility with the shared border/padding/flex-column pattern and
 * hover treatment (border-color only — the design system has no resting card shadow).
 * Pair a footer with `mt-auto` for equal-height rows.
 */
export default function MarketingCard({
  featured = false,
  as: Component = 'article',
  padding = 'default',
  className = '',
  style,
  children,
}: MarketingCardProps) {
  const pad = padding === 'roomy' ? 'p-8' : 'p-6';
  const border = featured
    ? 'border-primary/30 hover:border-primary/50'
    : 'border-border hover:border-foreground/20';

  return (
    <Component
      className={`card relative flex h-full flex-col border ${border} ${pad} transition-colors ${className}`.trim()}
      style={style}
    >
      {children}
    </Component>
  );
}
