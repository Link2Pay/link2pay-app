import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Cuando se usa dentro de un <form> nativo que lee por `name`. */
  name?: string;
  className?: string;
}

/**
 * Dropdown del Design System (mismo lenguaje que CurrencyPicker de los
 * formularios): botón estilo `.input` con chevron que rota y un popover de
 * opciones tokenizado (`bg-popover` + `shadow-overlay`), en lugar del `<select>`
 * nativo (flecha y lista del sistema operativo). Cierra con Escape o al perder
 * el foco.
 */
export default function Select({
  id,
  value,
  options,
  onChange,
  placeholder,
  name,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

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
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        id={id}
        type="button"
        className={`input flex items-center justify-between gap-3 pr-3 text-left ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false);
        }}
      >
        <span className={`truncate ${selected ? '' : 'text-muted-foreground'}`}>
          {selected ? selected.label : placeholder ?? ''}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-foreground transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-overlay"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-bold transition-colors duration-150 ${
                option.value === value
                  ? 'bg-muted text-foreground'
                  : 'text-ink-2 hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
