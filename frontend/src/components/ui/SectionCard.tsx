import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  hint?: string;
  action?: ReactNode;
  inlineHeader?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor de sección del Design System: tarjeta sin borde/sombra con un
 * encabezado consistente (eyebrow opcional + título display + hint) y un slot
 * de acción a la derecha. Reutilizado por los formularios y la página de perfil.
 */
export default function SectionCard({
  title,
  eyebrow,
  hint,
  action,
  inlineHeader = false,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <div
        className={`mb-5 gap-3 ${inlineHeader ? 'flex items-start justify-between' : 'flex flex-col sm:flex-row sm:items-start sm:justify-between'}`}
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-2xs font-medium uppercase tracking-label text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h3>
          {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
