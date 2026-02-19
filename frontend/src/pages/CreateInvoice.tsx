import InvoiceForm from '../components/Invoice/InvoiceForm';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, { title: string; subtitle: string }> = {
  en: {
    title: 'Create Invoice',
    subtitle: 'Fill in the details below to create a new invoice',
  },
  es: {
    title: 'Crear factura',
    subtitle: 'Completa los detalles para crear una nueva factura',
  },
  pt: {
    title: 'Criar fatura',
    subtitle: 'Preencha os detalhes abaixo para criar uma nova fatura',
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
