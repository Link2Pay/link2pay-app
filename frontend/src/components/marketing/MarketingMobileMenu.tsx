import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import BrandMark from '../BrandMark';
import BrandWordmark from '../BrandWordmark';
import type { MobileNavItem } from '../MobileNavDrawer';
import { MARKETING_CONTAINER } from './layout';

interface MarketingMobileMenuProps {
  open: boolean;
  onClose: () => void;
  items: MobileNavItem[];
  /** Element to restore focus to when the menu closes (the hamburger button). */
  triggerRef: RefObject<HTMLElement | null>;
  /** Accessible label / heading for the menu. Defaults to the translated "Menu". */
  title?: string;
  /** Controls rendered at the bottom (e.g. CTA, toggles). */
  footer?: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Landing-only mobile navigation. Unlike the shared right-side `MobileNavDrawer`
 * (used by the dashboard), this is a full-screen overlay that slides down from
 * the top, with large centered links. Keep the two in sync only where it makes
 * sense — the accessibility mechanics below mirror the drawer intentionally.
 */
export default function MarketingMobileMenu({
  open,
  onClose,
  items,
  triggerRef,
  title,
  footer,
}: MarketingMobileMenuProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuTitle = title ?? t('layout.menu.title');

  // Escape to close + lightweight focus trap while the menu is open.
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
      <div
        ref={panelRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={menuTitle}
        style={{
          // Soft, non-linear fade — no vertical movement.
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          transitionDuration: open ? '320ms' : '240ms',
        }}
        className={`fixed inset-0 z-50 flex flex-col bg-background transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Header row — mirrors the marketing header so the logo stays in place. */}
        <div className="border-b border-border/60">
          <div className={MARKETING_CONTAINER}>
            <div className="flex min-h-16 items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-8 w-8" />
                <BrandWordmark className="text-lg font-semibold leading-snug" />
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={t('layout.menu.close')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Large centered nav links */}
        <nav
          aria-label={menuTitle}
          className="flex flex-1 flex-col justify-center overflow-y-auto"
        >
          <div className={MARKETING_CONTAINER}>
            <ul className="flex flex-col gap-2 py-8">
              {items.map((item, index) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    style={{
                      transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      transitionDuration: '650ms',
                      transitionDelay: open ? `${150 + index * 75}ms` : '0ms',
                    }}
                    className={({ isActive }) =>
                      `block py-2 text-3xl font-semibold tracking-tight transition-[color,opacity] motion-reduce:transition-none ${
                        open ? 'opacity-100' : 'opacity-0'
                      } ${
                        isActive
                          ? 'text-accent-ink'
                          : 'text-foreground hover:text-accent-ink'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer controls (CTA + toggles) */}
        {footer && (
          <div className="border-t border-border/60">
            <div className={MARKETING_CONTAINER}>
              <div
                className="space-y-3 pt-5"
                style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
              >
                {footer}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
