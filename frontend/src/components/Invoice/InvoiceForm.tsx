import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createInvoice } from '../../services/api';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
import type { Currency } from '../../types';
import type { Language } from '../../i18n/translations';

interface LineItemForm {
  description: string;
  quantity: number;
  rate: number;
}

const COPY: Record<Language, {
  failedCreateInvoice: string;
  yourInformation: string;
  clientInformation: string;
  invoiceDetails: string;
  lineItems: string;
  notes: string;
  walletAddress: string;
  name: string;
  email: string;
  company: string;
  clientName: string;
  clientEmail: string;
  title: string;
  currency: string;
  dueDate: string;
  description: string;
  addItem: string;
  qty: string;
  rate: string;
  amount: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  cancel: string;
  creating: string;
  createInvoice: string;
  yourNamePlaceholder: string;
  yourEmailPlaceholder: string;
  optional: string;
  clientNamePlaceholder: string;
  clientEmailPlaceholder: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  serviceDescriptionPlaceholder: string;
  taxPlaceholder: string;
  notesPlaceholder: string;
}> = {
  en: {
    failedCreateInvoice: 'Failed to create invoice',
    yourInformation: 'Your Information',
    clientInformation: 'Client Information',
    invoiceDetails: 'Invoice Details',
    lineItems: 'Line Items',
    notes: 'Notes',
    walletAddress: 'Wallet Address',
    name: 'Name',
    email: 'Email',
    company: 'Company',
    clientName: 'Client Name',
    clientEmail: 'Client Email',
    title: 'Title',
    currency: 'Currency',
    dueDate: 'Due Date',
    description: 'Description',
    addItem: 'Add Item',
    qty: 'Qty',
    rate: 'Rate',
    amount: 'Amount',
    subtotal: 'Subtotal',
    taxRate: 'Tax Rate (%)',
    taxAmount: 'Tax Amount',
    total: 'Total',
    cancel: 'Cancel',
    creating: 'Creating...',
    createInvoice: 'Create Invoice',
    yourNamePlaceholder: 'Your name',
    yourEmailPlaceholder: 'you@example.com',
    optional: 'Optional',
    clientNamePlaceholder: 'Client name',
    clientEmailPlaceholder: 'client@example.com',
    titlePlaceholder: 'Website Development',
    descriptionPlaceholder: 'Project description...',
    serviceDescriptionPlaceholder: 'Service description',
    taxPlaceholder: '0',
    notesPlaceholder: 'Payment terms, additional notes...',
  },
  es: {
    failedCreateInvoice: 'No se pudo crear la factura',
    yourInformation: 'Tu informacion',
    clientInformation: 'Informacion del cliente',
    invoiceDetails: 'Detalles de la factura',
    lineItems: 'Lineas',
    notes: 'Notas',
    walletAddress: 'Direccion de wallet',
    name: 'Nombre',
    email: 'Email',
    company: 'Empresa',
    clientName: 'Nombre del cliente',
    clientEmail: 'Email del cliente',
    title: 'Titulo',
    currency: 'Moneda',
    dueDate: 'Fecha de vencimiento',
    description: 'Descripcion',
    addItem: 'Agregar item',
    qty: 'Cant.',
    rate: 'Tarifa',
    amount: 'Importe',
    subtotal: 'Subtotal',
    taxRate: 'Impuesto (%)',
    taxAmount: 'Monto de impuesto',
    total: 'Total',
    cancel: 'Cancelar',
    creating: 'Creando...',
    createInvoice: 'Crear factura',
    yourNamePlaceholder: 'Tu nombre',
    yourEmailPlaceholder: 'tu@email.com',
    optional: 'Opcional',
    clientNamePlaceholder: 'Nombre del cliente',
    clientEmailPlaceholder: 'cliente@email.com',
    titlePlaceholder: 'Desarrollo web',
    descriptionPlaceholder: 'Descripcion del proyecto...',
    serviceDescriptionPlaceholder: 'Descripcion del servicio',
    taxPlaceholder: '0',
    notesPlaceholder: 'Terminos de pago, notas adicionales...',
  },
  pt: {
    failedCreateInvoice: 'Falha ao criar fatura',
    yourInformation: 'Suas informacoes',
    clientInformation: 'Informacoes do cliente',
    invoiceDetails: 'Detalhes da fatura',
    lineItems: 'Itens',
    notes: 'Notas',
    walletAddress: 'Endereco da wallet',
    name: 'Nome',
    email: 'Email',
    company: 'Empresa',
    clientName: 'Nome do cliente',
    clientEmail: 'Email do cliente',
    title: 'Titulo',
    currency: 'Moeda',
    dueDate: 'Data de vencimento',
    description: 'Descricao',
    addItem: 'Adicionar item',
    qty: 'Qtd.',
    rate: 'Taxa',
    amount: 'Valor',
    subtotal: 'Subtotal',
    taxRate: 'Imposto (%)',
    taxAmount: 'Valor do imposto',
    total: 'Total',
    cancel: 'Cancelar',
    creating: 'Criando...',
    createInvoice: 'Criar fatura',
    yourNamePlaceholder: 'Seu nome',
    yourEmailPlaceholder: 'voce@email.com',
    optional: 'Opcional',
    clientNamePlaceholder: 'Nome do cliente',
    clientEmailPlaceholder: 'cliente@email.com',
    titlePlaceholder: 'Desenvolvimento de site',
    descriptionPlaceholder: 'Descricao do projeto...',
    serviceDescriptionPlaceholder: 'Descricao do servico',
    taxPlaceholder: '0',
    notesPlaceholder: 'Termos de pagamento, notas adicionais...',
  },
};

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { publicKey } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [freelancerName, setFreelancerName] = useState('');
  const [freelancerEmail, setFreelancerEmail] = useState('');
  const [freelancerCompany, setFreelancerCompany] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState<Currency>('XLM');
  const [taxRate, setTaxRate] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([{ description: '', quantity: 1, rate: 0 }]);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = taxRate ? subtotal * (parseFloat(taxRate) / 100) : 0;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const invoice = await createInvoice(
        {
          freelancerWallet: publicKey,
          freelancerName: freelancerName || undefined,
          freelancerEmail: freelancerEmail || undefined,
          freelancerCompany: freelancerCompany || undefined,
          clientName,
          clientEmail,
          clientCompany: clientCompany || undefined,
          title,
          description: description || undefined,
          notes: notes || undefined,
          currency,
          taxRate: taxRate ? parseFloat(taxRate) : undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          lineItems: lineItems.filter((item) => item.description && item.rate > 0),
        },
        publicKey
      );

      toast.success(`Invoice ${invoice.invoiceNumber} created`);
      navigate(`/dashboard/invoices/${invoice.id}`);
    } catch (err: any) {
      const msg = err.message || copy.failedCreateInvoice;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in sm:space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <section className="card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-ink-0 mb-4 uppercase tracking-wider">{copy.yourInformation}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="freelancer-name" className="label">{copy.name}</label>
            <input
              id="freelancer-name"
              type="text"
              className="input"
              placeholder={copy.yourNamePlaceholder}
              value={freelancerName}
              onChange={(e) => setFreelancerName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="freelancer-email" className="label">{copy.email}</label>
            <input
              id="freelancer-email"
              type="email"
              className="input"
              placeholder={copy.yourEmailPlaceholder}
              value={freelancerEmail}
              onChange={(e) => setFreelancerEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="freelancer-company" className="label">{copy.company}</label>
            <input
              id="freelancer-company"
              type="text"
              className="input"
              placeholder={copy.optional}
              value={freelancerCompany}
              onChange={(e) => setFreelancerCompany(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="label">{copy.walletAddress}</label>
          <div className="input bg-surface-1 font-mono text-xs text-ink-2 cursor-default break-all">{publicKey}</div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-ink-0 mb-4 uppercase tracking-wider">{copy.clientInformation}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client-name" className="label">
              {copy.clientName} <span className="text-danger">*</span>
            </label>
            <input
              id="client-name"
              type="text"
              className="input"
              placeholder={copy.clientNamePlaceholder}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">
              {copy.clientEmail} <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className="input"
              placeholder={copy.clientEmailPlaceholder}
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">{copy.company}</label>
            <input
              type="text"
              className="input"
              placeholder={copy.optional}
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-ink-0 mb-4 uppercase tracking-wider">{copy.invoiceDetails}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">
              {copy.title} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder={copy.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{copy.currency}</label>
              <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
                <option value="EURC">EURC</option>
              </select>
            </div>
            <div>
              <label className="label">{copy.dueDate}</label>
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div>
          <label className="label">{copy.description}</label>
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder={copy.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-ink-0 uppercase tracking-wider">{copy.lineItems}</h3>
          <button type="button" onClick={addLineItem} className="btn-ghost w-full text-sm text-stellar-600 sm:w-auto">
            + {copy.addItem}
          </button>
        </div>

        <div className="mb-2 hidden grid-cols-12 gap-3 px-1 sm:grid">
          <div className="col-span-5 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.description}</div>
          <div className="col-span-2 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.qty}</div>
          <div className="col-span-2 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.rate}</div>
          <div className="col-span-2 text-xs font-medium text-ink-3 uppercase tracking-wider text-right">{copy.amount}</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <div key={index} className="rounded-lg border border-surface-3 p-3 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3 sm:rounded-none sm:border-0 sm:p-0">
              <div className="sm:col-span-5">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:hidden">
                  {copy.description}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={copy.serviceDescriptionPlaceholder}
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  required
                />
              </div>
              <div className="mt-3 sm:col-span-2 sm:mt-0">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:hidden">
                  {copy.qty}
                </label>
                <input
                  type="number"
                  className="input text-center"
                  min="0.01"
                  step="0.01"
                  value={item.quantity || ''}
                  onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="mt-3 sm:col-span-2 sm:mt-0">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:hidden">
                  {copy.rate}
                </label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.rate || ''}
                  onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm sm:col-span-2 sm:mt-0 sm:block sm:text-right">
                <span className="text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:hidden">
                  {copy.amount}
                </span>
                <span className="font-mono text-ink-1">{(item.quantity * item.rate).toFixed(2)}</span>
              </div>
              <div className="mt-3 text-right sm:col-span-1 sm:mt-0 sm:text-center">
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-ink-4 hover:text-danger transition-colors text-lg"
                  >
                    X
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-surface-3">
          <div className="flex flex-col items-end gap-2">
            <div className="flex w-full items-center justify-between gap-4 text-sm sm:w-auto sm:justify-end">
              <span className="text-ink-3">{copy.subtotal}</span>
              <span className="font-mono w-24 text-right sm:w-28">{subtotal.toFixed(2)} {currency}</span>
            </div>
            <div className="flex w-full items-center justify-between gap-4 text-sm sm:w-auto sm:justify-end">
              <span className="text-ink-3">{copy.taxRate}</span>
              <input
                type="number"
                className="input w-24 text-right sm:w-28"
                min="0"
                max="100"
                step="0.1"
                placeholder={copy.taxPlaceholder}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            {taxAmount > 0 && (
              <div className="flex w-full items-center justify-between gap-4 text-sm sm:w-auto sm:justify-end">
                <span className="text-ink-3">{copy.taxAmount}</span>
                <span className="font-mono w-24 text-right sm:w-28">{taxAmount.toFixed(2)} {currency}</span>
              </div>
            )}
            <div className="flex w-full items-center justify-between gap-4 border-t border-surface-3 pt-2 text-base font-semibold sm:w-auto sm:justify-end">
              <span>{copy.total}</span>
              <span className="font-mono w-24 text-right text-stellar-700 sm:w-28">{total.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-ink-0 mb-4 uppercase tracking-wider">{copy.notes}</h3>
        <textarea
          className="input min-h-[80px] resize-y"
          placeholder={copy.notesPlaceholder}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary w-full sm:w-auto">
          {copy.cancel}
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {copy.creating}
            </span>
          ) : (
            copy.createInvoice
          )}
        </button>
      </div>
    </form>
  );
}
