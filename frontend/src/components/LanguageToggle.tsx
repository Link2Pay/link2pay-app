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

  return (
    <div
      className="inline-flex items-center rounded-lg border border-border bg-card p-0.5"
      role="group"
      aria-label={t('language.switch')}
      title={t('language.switch')}
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLanguage(option.code)}
          className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
            language === option.code
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
