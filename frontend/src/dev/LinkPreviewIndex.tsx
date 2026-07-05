/**
 * Índice SOLO PARA DESARROLLO: lista los escenarios de preview del detalle de link.
 * Montado únicamente tras `import.meta.env.DEV` en App.tsx, por lo que no se registra
 * ni se empaqueta en producción. Punto de entrada para QA visual de InvoiceDetail.
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MOCK_LINK_SCENARIOS } from './mockLinks';
import BrandMark from '../components/BrandMark';

export default function LinkPreviewIndex() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark className="h-8 w-8" />
          <div>
            <h1 className="font-display text-xl font-extrabold text-ink-0">Link detail preview</h1>
            <p className="text-xs text-ink-3">Solo desarrollo · escenarios mock del detalle de link</p>
          </div>
        </div>

        <div className="card divide-y divide-surface-3 overflow-hidden">
          {MOCK_LINK_SCENARIOS.map((s) => (
            <Link
              key={s.id}
              to={`/dev/links/${s.id}`}
              className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-0">{s.label}</p>
                <p className="truncate font-mono text-2xs text-ink-3">/dev/links/{s.id}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
            </Link>
          ))}
        </div>

        <p className="mt-4 text-center text-2xs text-ink-4">
          Estos escenarios no existen en producción.
        </p>
      </div>
    </div>
  );
}
