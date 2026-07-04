import type { LucideIcon } from 'lucide-react';

export type StatVariant = 'accent' | 'ink' | 'neutral';

export interface StatCardData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant: StatVariant;
  /** Fondo del círculo del icono (override; hay default por variante). */
  circle?: string;
  /** Color del glifo (override; hay default por variante). */
  glyph?: string;
  /** Color de la cifra en variante neutral (p. ej. text-success). */
  valueClass?: string;
}

const VARIANT_CLASS: Record<StatVariant, string> = {
  accent: 'bg-accent text-accent-foreground',
  ink: 'bg-card-invert text-card-invert-foreground',
  neutral: 'bg-card',
};

// Círculo/glifo por defecto según variante. En la card de acento el chip del
// icono es blanco translúcido (patrón "icono sobre superficie de marca", igual
// que el item activo del sidebar) — claro en ambos temas, sin negro.
const DEFAULT_CIRCLE: Record<StatVariant, string> = {
  accent: 'bg-white/15',
  ink: 'bg-accent',
  neutral: 'bg-muted',
};
const DEFAULT_GLYPH: Record<StatVariant, string> = {
  accent: 'text-accent-foreground',
  ink: 'text-accent-foreground',
  neutral: 'text-ink-3',
};

/**
 * Stat card espectral del Design System "Moneytory": icono en círculo a la
 * derecha, label + cifra tabular a la izquierda. Variantes accent (indigo) / ink
 * (tinta) para el par de énfasis, y neutral con tinte semántico opcional.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  circle,
  glyph,
  valueClass,
}: StatCardData) {
  const isEmphasis = variant !== 'neutral';
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl p-6 ${VARIANT_CLASS[variant]}`}>
      <div>
        <p className={`text-sm font-medium ${isEmphasis ? 'opacity-80' : 'text-ink-3'}`}>{label}</p>
        <p
          className={`mt-1 font-display text-2xl font-bold [font-variant-numeric:tabular-nums] ${
            isEmphasis ? '' : valueClass ?? 'text-ink-0'
          }`}
        >
          {value}
        </p>
      </div>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${circle ?? DEFAULT_CIRCLE[variant]}`}
      >
        <Icon className={`h-4 w-4 ${glyph ?? DEFAULT_GLYPH[variant]}`} aria-hidden="true" />
      </span>
    </div>
  );
}
