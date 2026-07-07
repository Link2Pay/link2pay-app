import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeftRight, LayoutDashboard, Receipt } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/translations';

type IconComponent = ComponentType<{
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

interface BottomTab {
  to: string;
  icon: IconComponent;
  labelKey: TranslationKey;
  /** Exact match — needed for the index route so it doesn't stay active elsewhere. */
  end?: boolean;
}

// Atajos a las 3 secciones principales, en el orden pedido: Panel · Links · Transacciones.
const TABS: BottomTab[] = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'layout.nav.dashboard', end: true },
  { to: '/dashboard/links', icon: Receipt, labelKey: 'layout.nav.invoices' },
  { to: '/dashboard/transactions', icon: ArrowLeftRight, labelKey: 'layout.nav.transactions' },
];

/**
 * Barra de navegación inferior fija, solo visible en móvil (< md). Complementa al
 * drawer lateral (hamburguesa) con acceso directo a las secciones más usadas.
 */
export default function BottomNav() {
  const { t } = useI18n();

  return (
    <nav
      aria-label={t('layout.menu.title')}
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, icon: Icon, labelKey, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={t(labelKey)}
          className={({ isActive }) =>
            `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <Icon aria-hidden="true" className="h-6 w-6" />
        </NavLink>
      ))}
    </nav>
  );
}
