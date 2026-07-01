import { useEffect, useRef, type ComponentType, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { config } from '../config';
import BrandMark from './BrandMark';
import BrandWordmark from './BrandWordmark';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import WalletConnect from './Wallet/WalletConnect';
import PrivyLogin from './Auth/PrivyLogin';

export interface MobileNavItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  navItems: MobileNavItem[];
  isActivePath: (path: string) => boolean;
  /** Element to restore focus to when the drawer closes (the hamburger button). */
  triggerRef: RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MobileNavDrawer({
  open,
  onClose,
  navItems,
  isActivePath,
  triggerRef,
}: MobileNavDrawerProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Escape to close + lightweight focus trap while the drawer is open.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll while open; restore on close/unmount.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Move focus into the panel on open; restore focus to the trigger on close.
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);

  return (
    <div className="md:hidden" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('layout.menu.title')}
        className={`fixed right-0 top-0 z-50 flex h-full w-[85%] max-w-xs flex-col border-l border-surface-3 bg-surface-1 shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <BrandMark className="h-8 w-8 rounded-lg" />
            <BrandWordmark className="text-base font-semibold leading-snug" />
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('layout.menu.close')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Nav list */}
        <nav aria-label={t('layout.menu.title')} className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sidebar-accent text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Controls footer: Language, Theme, Disconnect */}
        <div className="space-y-3 border-t border-surface-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          {config.privyAppId ? <PrivyLogin /> : <WalletConnect />}
        </div>
      </div>
    </div>
  );
}
