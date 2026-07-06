import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, Globe2, Heart, Menu } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import BrandMark from '../BrandMark';
import BrandWordmark from '../BrandWordmark';
import MarketingMobileMenu from './MarketingMobileMenu';
import { useI18n } from '../../i18n/I18nProvider';
import { MARKETING_CONTAINER } from './layout';

export default function MarketingLayout() {
  const { t } = useI18n();
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: t('marketing.nav.home'), end: true },
    { path: '/payment-links', label: t('marketing.nav.features') },
    { path: '/plans', label: t('marketing.nav.pricing') },
    { path: '/why-link2pay', label: t('marketing.nav.about') },
  ];

  const footerProduct = [
    { label: t('marketing.nav.features'), to: '/payment-links' },
    { label: t('marketing.nav.pricing'), to: '/plans' },
    { label: t('marketing.nav.sdk'), to: '/sdk' },
  ];

  const footerCompany = [
    { label: t('marketing.nav.about'), to: '/why-link2pay' },
    { label: t('marketing.terms'), to: '#' },
    { label: t('marketing.privacy'), to: '#' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className={MARKETING_CONTAINER}>
          <div className="flex min-h-16 items-center justify-between gap-4 py-2">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Link2Pay">
              <BrandMark className="h-8 w-8" />
              <BrandWordmark className="text-lg font-semibold leading-snug" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label={t('layout.menu.title')}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <LanguageToggle />
              <ThemeToggle />
              <Link to="/app" className="btn-primary h-10 px-4 text-sm">
                {t('marketing.openApp')}
              </Link>
            </div>

            <button
              ref={mobileNavTriggerRef}
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t('layout.menu.open')}
              aria-haspopup="dialog"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-drawer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted md:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MarketingMobileMenu
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        items={navItems}
        triggerRef={mobileNavTriggerRef}
        footer={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className="label">{t('layout.menu.language')}</p>
                <LanguageToggle />
              </div>
              <div className="border-l border-border pl-4 sm:pl-6">
                <p className="label">{t('layout.menu.theme')}</p>
                <ThemeToggle alwaysShowLabel />
              </div>
            </div>
            <div className="border-t border-border/60 pt-4">
              <Link
                to="/app"
                onClick={() => setMobileNavOpen(false)}
                className="btn-primary h-12 w-full justify-center gap-2 text-base font-semibold"
              >
                {t('marketing.openApp')}
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </div>
        }
      />

      <main className="overflow-x-clip">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card">
        <div className={`${MARKETING_CONTAINER} py-14`}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrandMark className="h-7 w-7" />
                <BrandWordmark className="text-base font-semibold" />
              </div>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {t('marketing.footerDescription')}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5" />
                <span>{t('marketing.availableWorldwide')}</span>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                {t('marketing.product')}
              </h2>
              <ul className="space-y-2.5">
                {footerProduct.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-sm text-foreground transition-colors hover:text-accent-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                {t('marketing.company')}
              </h2>
              <ul className="space-y-2.5">
                {footerCompany.map((item) =>
                  item.to.startsWith('/') ? (
                    <li key={item.label}>
                      <Link to={item.to} className="text-sm text-foreground transition-colors hover:text-accent-ink">
                        {item.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <a href={item.to} className="text-sm text-foreground transition-colors hover:text-accent-ink">
                        {item.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                {t('marketing.network')}
              </h2>
              <div className="space-y-2.5">
                <a
                  href="https://stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-foreground transition-colors hover:text-accent-ink"
                >
                  {t('marketing.builtOnStellar')}
                </a>
                <a
                  href="https://stellar.expert"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-foreground transition-colors hover:text-accent-ink"
                >
                  {t('marketing.exploreTransactions')}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:justify-start">
              {t('marketing.madeWith')}
              <Heart className="h-3.5 w-3.5 text-destructive" />
              {t('marketing.forLatam')}
            </p>
            <p className="text-center text-xs text-muted-foreground lg:text-left">
              {t('marketing.rightsReserved')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
