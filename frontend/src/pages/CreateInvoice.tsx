import InvoiceForm from '../components/Invoice/InvoiceForm';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, { title: string; subtitle: string }> = {
  en: {
    title: 'Create Payment Link',
    subtitle: 'Fill in the details below to create a new payment link',
  },
  es: {
    title: 'Crear link de pago',
    subtitle: 'Completa los detalles para crear un nuevo link de pago',
  },
  pt: {
    title: 'Criar link de pagamento',
    subtitle: 'Preencha os detalhes abaixo para criar um novo link de pagamento',
  },
};

export default function CreateInvoice() {
  const { language } = useI18n();
  const copy = COPY[language];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>
      <InvoiceForm />
    </div>
  );
}
