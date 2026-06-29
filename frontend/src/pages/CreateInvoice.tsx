import { useState } from 'react';
import InvoiceForm from '../components/Invoice/InvoiceForm';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import type { InvoiceType } from '../types';

const COPY: Record<Language, {
  title: string;
  subtitle: string;
  pickerTitle: string;
  pickerSubtitle: string;
  back: string;
  types: Record<InvoiceType, { title: string; description: string; badge?: string }>;
}> = {
  en: {
    title: 'Create Payment Link',
    subtitle: 'Fill in the details below to create a new payment link',
    pickerTitle: 'Choose link type',
    pickerSubtitle: 'Select the format that best fits your use case',
    back: '← Change type',
    types: {
      DIRECT_PAYMENT: {
        title: 'Direct Payment',
        description: 'Quick payment link with a single amount. Perfect for one-time requests and freelance gigs.',
        badge: 'Simplest',
      },
      BUSINESS_INVOICE: {
        title: 'Business Invoice',
        description: 'Full B2B invoice with line items, quantities, tax, and client details.',
      },
      SERVICE_INVOICE: {
        title: 'Service Invoice',
        description: 'Hours-based billing for consulting, development, or professional services.',
      },
    },
  },
  es: {
    title: 'Crear link de pago',
    subtitle: 'Completa los detalles para crear un nuevo link de pago',
    pickerTitle: 'Elige el tipo de link',
    pickerSubtitle: 'Selecciona el formato que mejor se adapte a tu caso de uso',
    back: '← Cambiar tipo',
    types: {
      DIRECT_PAYMENT: {
        title: 'Pago directo',
        description: 'Link de pago rápido con un solo monto. Perfecto para cobros únicos.',
        badge: 'Más simple',
      },
      BUSINESS_INVOICE: {
        title: 'Factura de negocio',
        description: 'Factura completa con líneas, cantidades, impuestos y datos del cliente.',
      },
      SERVICE_INVOICE: {
        title: 'Factura de servicios',
        description: 'Facturación por horas para consultoría, desarrollo o servicios profesionales.',
      },
    },
  },
  pt: {
    title: 'Criar link de pagamento',
    subtitle: 'Preencha os detalhes abaixo para criar um novo link de pagamento',
    pickerTitle: 'Escolha o tipo de link',
    pickerSubtitle: 'Selecione o formato que melhor se adapta ao seu caso de uso',
    back: '← Mudar tipo',
    types: {
      DIRECT_PAYMENT: {
        title: 'Pagamento direto',
        description: 'Link de pagamento rápido com valor único. Perfeito para cobranças pontuais.',
        badge: 'Mais simples',
      },
      BUSINESS_INVOICE: {
        title: 'Fatura empresarial',
        description: 'Fatura completa com itens, quantidades, impostos e dados do cliente.',
      },
      SERVICE_INVOICE: {
        title: 'Fatura de serviços',
        description: 'Cobrança por horas para consultoria, desenvolvimento ou serviços profissionais.',
      },
    },
  },
};

const TYPE_ICONS: Record<InvoiceType, string> = {
  DIRECT_PAYMENT: '⚡',
  BUSINESS_INVOICE: '🏢',
  SERVICE_INVOICE: '⏱️',
};

const TYPE_ORDER: InvoiceType[] = ['DIRECT_PAYMENT', 'BUSINESS_INVOICE', 'SERVICE_INVOICE'];

export default function CreateInvoice() {
  const { language } = useI18n();
  const copy = COPY[language];
  const [invoiceType, setInvoiceType] = useState<InvoiceType | null>(null);

  if (!invoiceType) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-ink-0">{copy.pickerTitle}</h2>
          <p className="text-sm text-ink-3">{copy.pickerSubtitle}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPE_ORDER.map((type) => {
            const info = copy.types[type];
            return (
              <button
                key={type}
                onClick={() => setInvoiceType(type)}
                className="card text-left p-5 hover:border-stellar-300 hover:bg-stellar-50/30 transition-all group focus:outline-none focus:ring-2 focus:ring-stellar-400"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{TYPE_ICONS[type]}</span>
                  {info.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stellar-100 text-stellar-700">
                      {info.badge}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-ink-0 mb-1 group-hover:text-stellar-700 transition-colors">
                  {info.title}
                </p>
                <p className="text-xs text-ink-3 leading-relaxed">{info.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setInvoiceType(null)}
          className="text-xs text-stellar-600 hover:text-stellar-700 hover:underline"
        >
          {copy.back}
        </button>
        <span className="text-ink-4 text-xs">·</span>
        <span className="text-xs text-ink-3">
          {TYPE_ICONS[invoiceType]} {copy.types[invoiceType].title}
        </span>
      </div>
      <InvoiceForm invoiceType={invoiceType} />
    </div>
  );
}
