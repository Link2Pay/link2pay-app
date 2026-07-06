import { useI18n } from '../i18n/I18nProvider';
import type { Language, TranslationKey } from '../i18n/translations';

const LANGUAGE_OPTIONS: Array<{
  code: Language;
  shortLabel: string;
  nameKey: TranslationKey;
}> = [
  { code: 'en', shortLabel: 'EN', nameKey: 'language.english' },
  { code: 'es', shortLabel: 'ES', nameKey: 'language.spanish' },
  { code: 'pt', shortLabel: 'PT', nameKey: 'language.portuguese' },
];

export default function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  const activeIndex = Math.max(
    0,
    LANGUAGE_OPTIONS.findIndex((option) => option.code === language),
  );

  return (
    <div
      className="relative inline-grid grid-cols-3 items-center rounded-lg border border-border bg-card p-0.5"
      role="group"
      aria-label={t('language.switch')}
      title={t('language.switch')}
    >
      {/* Indicador deslizante: un único recuadro que se traslada al idioma activo. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0.5 left-0.5 rounded-md bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: 'calc((100% - 0.25rem) / 3)',
          transform: `translateX(${activeIndex * 100}%)`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLanguage(option.code)}
          className={`relative z-10 rounded-md px-2.5 py-2 text-center text-xs font-semibold tracking-wide transition-colors ${
            language === option.code
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={language === option.code}
          title={t(option.nameKey)}
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}
