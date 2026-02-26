import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRight, Globe2, Heart, LayoutDashboard } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import BrandMark from '../BrandMark';
import BrandWordmark from '../BrandWordmark';
import { useI18n } from '../../i18n/I18nProvider';

export default function MarketingLayout() {
  const { t } = useI18n();

  const navItems = [
    { path: '/', label: t('marketing.nav.home'), end: true },
    { path: '/payment-links', label: t('marketing.nav.features') },
    { path: '/sdk', label: t('marketing.nav.sdk') },
    { path: '/plans', label: t('marketing.nav.pricing') },
    { path: '/why-link2pay', label: t('marketing.nav.about') },
  ];

  const footerProduct = [
    { label: t('marketing.nav.features'), to: '/payment-links' },
    { label: t('marketing.nav.sdk'), to: '/sdk' },
    { label: t('marketing.nav.pricing'), to: '/plans' },
    { label: t('marketing.dashboard'), to: '/app' },
  ];

  const footerCompany = [
    { label: t('marketing.nav.about'), to: '/why-link2pay' },
    { label: t('marketing.terms'), to: '#' },
    { label: t('marketing.privacy'), to: '#' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex min-h-14 items-center justify-between gap-3 py-2 md:min-h-16">
            <Link to="/" className="flex items-center gap-2">
              <BrandMark className="h-9 w-9 rounded-lg" />
              <BrandWordmark className="text-lg font-semibold leading-snug" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/app"
                aria-label={t('marketing.dashboard')}
                title={t('marketing.dashboard')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/12 text-primary transition-colors hover:bg-primary/20 hover:text-primary md:hidden"
              >
                <LayoutDashboard className="h-4 w-4" />
              </Link>

              <LanguageToggle />
              <ThemeToggle />

              <div className="hidden items-center gap-2 md:flex">
                <Link to="/app" className="btn-secondary px-3 py-2 text-sm">
                  {t('marketing.dashboard')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto pb-2 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-primary/40 bg-primary/12 text-primary'
                      : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <BrandMark className="h-8 w-8 rounded-lg" />
                <BrandWordmark className="text-base font-semibold" />
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t('marketing.footerDescription')}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5" />
                <span>{t('marketing.availableWorldwide')}</span>
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{t('marketing.product')}</h4>
              <ul className="space-y-2">
                {footerProduct.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{t('marketing.company')}</h4>
              <ul className="space-y-2">
                {footerCompany.map((item) =>
                  item.to.startsWith('/') ? (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <a
                        href={item.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {t('marketing.madeWith')} <Heart className="h-3 w-3 text-destructive" /> {t('marketing.forFreelancers')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
