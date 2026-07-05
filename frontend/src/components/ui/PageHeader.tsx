import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Icono opcional junto al título (p. ej. Wallet). */
  icon?: LucideIcon;
  /** Elemento alineado a la derecha en la fila del título: badge, network pill, etc. */
  titleAside?: ReactNode;
  /** Acciones a la derecha: botón primario, badge de estado, etc. */
  actions?: ReactNode;
}

/**
 * Cabecera de página del Design System "Moneytory": título display grande,
 * subtítulo mudo y hairline inferior. Reutilizada en todas las páginas de la app
 * para dar identidad consistente.
 */
export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  titleAside,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="flex min-w-0 items-center gap-2 font-display text-3xl font-extrabold tracking-tight text-ink-0 sm:text-4xl">
            {Icon ? <Icon className="h-6 w-6 shrink-0 text-ink-3" aria-hidden="true" /> : null}
            <span>{title}</span>
          </h1>
          {titleAside ? <div className="shrink-0">{titleAside}</div> : null}
        </div>
        {subtitle ? <p className="mt-1 text-sm text-ink-3">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">{actions}</div>
      ) : null}
    </div>
  );
}
