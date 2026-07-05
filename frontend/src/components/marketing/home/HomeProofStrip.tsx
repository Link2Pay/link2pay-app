import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../i18n/translations';

type ProofItem = {
  value: string;
  label: string;
};

const COPY: Record<Language, ProofItem[]> = {
  en: [
    { value: '3-5s', label: 'Settlement' },
    { value: '~$0.00001', label: 'Per transaction' },
    { value: '99.99%', label: 'Uptime since 2014' },
    { value: '150+', label: 'Countries reached' },
  ],
  es: [
    { value: '3-5s', label: 'Liquidación' },
    { value: '~$0,00001', label: 'Por transacción' },
    { value: '99,99%', label: 'Uptime desde 2014' },
    { value: '150+', label: 'Países alcanzados' },
  ],
  pt: [
    { value: '3-5s', label: 'Liquidação' },
    { value: '~$0,00001', label: 'Por transação' },
    { value: '99,99%', label: 'Uptime desde 2014' },
    { value: '150+', label: 'Países alcançados' },
  ],
};

export default function HomeProofStrip() {
  const { language } = useI18n();
  const items = COPY[language];

  return (
    <section className="border-b border-t border-border bg-card/70">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="bg-card/70 px-4 py-5 sm:px-6">
              <div className="font-mono text-lg font-semibold text-foreground [font-variant-numeric:tabular-nums] sm:text-xl">
                {item.value}
              </div>
              <p className="mt-1 text-2xs font-medium uppercase tracking-label text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
