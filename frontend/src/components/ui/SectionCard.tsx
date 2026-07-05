import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  id?: string;
  title: string;
  titleIcon?: LucideIcon;
  eyebrow?: string;
  hint?: string;
  action?: ReactNode;
  inlineHeader?: boolean;
  headerVariant?: 'section' | 'dashboard';
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor de sección del Design System: tarjeta sin borde/sombra con un
 * encabezado consistente (eyebrow opcional + título display + hint) y un slot
 * de acción a la derecha. Reutilizado por los formularios y la página de perfil.
 */
export default function SectionCard({
  id,
  title,
  titleIcon: TitleIcon,
  eyebrow,
  hint,
  action,
  inlineHeader = false,
  headerVariant = 'section',
  children,
  className = '',
}: SectionCardProps) {
  const titleClass =
    headerVariant === 'dashboard'
      ? 'text-sm font-semibold text-ink-0'
      : 'font-display text-xl font-bold tracking-tight text-foreground';

  return (
    <section id={id} className={`card p-5 sm:p-6 ${className}`}>
      <div
        className={`mb-5 gap-3 ${inlineHeader ? 'flex items-start justify-between' : 'flex flex-col sm:flex-row sm:items-start sm:justify-between'}`}
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-2xs font-medium uppercase tracking-label text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h3 className={`flex items-center gap-2 ${titleClass}`}>
            {TitleIcon ? <TitleIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" /> : null}
            <span>{title}</span>
          </h3>
          {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
