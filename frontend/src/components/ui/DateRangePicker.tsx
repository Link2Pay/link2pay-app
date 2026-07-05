import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

export interface DateRange {
  from: string; // 'YYYY-MM-DD' | ''
  to: string;   // 'YYYY-MM-DD' | ''
}

interface DateRangePickerProps {
  id: string;
  from: string;
  to: string;
  onChange: (range: DateRange) => void;
  labels: { trigger: string; from: string; to: string; clear: string };
  className?: string;
}

/**
 * Selector de rango de fechas del Design System, con el mismo lenguaje visual que
 * `Select`: botón estilo `.input` con chevron que rota y un popover tokenizado
 * (`bg-popover` + `shadow-overlay`) que contiene dos campos de fecha (Desde/Hasta)
 * y una acción para limpiar. Cierra con Escape o al perder el foco.
 */
export default function DateRangePicker({
  id,
  from,
  to,
  onChange,
  labels,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const triggerLabel = from && to ? `${from} – ${to}` : from || to || labels.trigger;
  const hasRange = Boolean(from || to);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        id={id}
        type="button"
        className={`input flex items-center justify-between gap-3 pr-3 text-left ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false);
        }}
      >
        <span className={`flex items-center gap-2 truncate ${hasRange ? '' : 'text-muted-foreground'}`}>
          <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3" />
          <span className="truncate [font-variant-numeric:tabular-nums]">{triggerLabel}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-foreground transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby={id}
          className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-3 shadow-overlay"
        >
          <div className="space-y-3">
            <label className="block">
              <span className="label">{labels.from}</span>
              <input
                type="date"
                className="input date-input pr-11"
                value={from}
                max={to || undefined}
                onChange={(event) => onChange({ from: event.target.value, to })}
              />
            </label>
            <label className="block">
              <span className="label">{labels.to}</span>
              <input
                type="date"
                className="input date-input pr-11"
                value={to}
                min={from || undefined}
                onChange={(event) => onChange({ from, to: event.target.value })}
              />
            </label>
            <button
              type="button"
              disabled={!hasRange}
              onClick={() => {
                onChange({ from: '', to: '' });
                setIsOpen(false);
              }}
              className="btn-ghost w-full justify-center text-xs disabled:opacity-50"
            >
              {labels.clear}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
