import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  hintId?: string;
  children: ReactNode;
}

/**
 * Campo de formulario del Design System: label (`.label`) + control + hint
 * opcional. El control se pasa como children (input/select/textarea/.input).
 */
export default function Field({ id, label, required, hint, hintId, children }: FieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && <p id={hintId} className="mt-1 text-2xs text-ink-4">{hint}</p>}
    </div>
  );
}
