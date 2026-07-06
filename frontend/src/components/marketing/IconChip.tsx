import type { LucideIcon } from 'lucide-react';

type IconChipProps = {
  icon: LucideIcon;
  /**
   * `primary` = lavender-ink on indigo tint; `success` = money green on green tint;
   * `inverse` = for use inside dark inverse bands.
   */
  variant?: 'primary' | 'success' | 'inverse';
  className?: string;
};

const VARIANTS: Record<NonNullable<IconChipProps['variant']>, string> = {
  primary: 'bg-primary/10 text-accent-ink',
  success: 'bg-success-subtle text-success',
  inverse: 'bg-card-invert-foreground/10 text-card-invert-foreground',
};

/**
 * Unified icon chip used across the marketing cards.
 *
 * Standardizes the recurring motif (previously `h-11/h-12`, `rounded-lg/rounded-xl`
 * at random) into a single 44px, `rounded-2xl` token-driven chip.
 */
export default function IconChip({ icon: Icon, variant = 'primary', className = '' }: IconChipProps) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${VARIANTS[variant]} ${className}`.trim()}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}
