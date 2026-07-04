import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Icono opcional junto al título (p. ej. Wallet). */
  icon?: LucideIcon;
  /** Acciones a la derecha: botón primario, badge de estado, etc. */
  actions?: ReactNode;
}

/**
 * Cabecera de página del Design System "Moneytory": título display grande,
 * subtítulo mudo y hairline inferior. Reutilizada en todas las páginas de la app
 * para dar identidad consistente.
 */
export default function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight text-ink-0 sm:text-4xl">
          {Icon ? <Icon className="h-6 w-6 text-ink-3" aria-hidden="true" /> : null}
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-3">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">{actions}</div>
      ) : null}
    </div>
  );
}
