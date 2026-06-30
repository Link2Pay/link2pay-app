import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createInvoice, getBusinessProfile } from '../../services/api';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import type { Currency, InvoiceType } from '../../types';
import type { Language } from '../../i18n/translations';

interface LineItemForm {
  description: string;
  quantity: number;
  rate: number;
}

interface Props {
  invoiceType?: InvoiceType;
}

const COPY: Record<Language, {
  failedCreateInvoice: string;
  yourInformation: string;
  clientInformation: string;
  paymentDetails: string;
  invoiceDetails: string;
  lineItems: string;
  notes: string;
  walletAddress: string;
  name: string;
  email: string;
  company: string;
  clientName: string;
  clientEmail: string;
  clientOptional: string;
  title: string;
  titleDirectPlaceholder: string;
  amount: string;
  amountPlaceholder: string;
  currency: string;
  dueDate: string;
  description: string;
  addItem: string;
  qty: string;
  hours: string;
  rate: string;
  ratePerHour: string;
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
  itemDescriptionPlaceholder: string;
  titleBusinessPlaceholder: string;
  descriptionBusinessPlaceholder: string;
  taxPlaceholder: string;
  notesPlaceholder: string;
  networkMismatch: string;
  taxId: string;
  taxIdPlaceholder: string;
  address: string;
  addressPlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  clientTaxId: string;
  prefillHint: string;
  openAmountLabel: string;
  openAmountHint: string;
  openAmountPlaceholder: string;
  expiration: string;
  defaultDirectTitle: string;
}> = {
  en: {
    failedCreateInvoice: 'Failed to create invoice',
    yourInformation: 'Your Information',
    clientInformation: 'Client Information',
    paymentDetails: 'Payment Details',
    invoiceDetails: 'Invoice Details',
    lineItems: 'Line Items',
    notes: 'Notes',
    walletAddress: 'Wallet Address',
    name: 'Name',
    email: 'Email',
    company: 'Company',
    clientName: 'Client Name',
    clientEmail: 'Client Email',
    clientOptional: 'Client (optional)',
    title: 'Title',
    titleDirectPlaceholder: 'What are you charging for?',
    amount: 'Amount',
    amountPlaceholder: '0.00',
    currency: 'Currency',
    dueDate: 'Due Date',
    description: 'Description',
    addItem: 'Add Item',
    qty: 'Qty',
    hours: 'Hours',
    rate: 'Unit price',
    ratePerHour: 'Rate/hr',
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
    itemDescriptionPlaceholder: 'Item or product',
    titleBusinessPlaceholder: 'Product sale',
    descriptionBusinessPlaceholder: 'Items, quantities, order details...',
    taxPlaceholder: '0',
    notesPlaceholder: 'Payment terms, additional notes...',
    networkMismatch: 'Network mismatch: You selected {selected} but Freighter wallet is on {freighter}. Please switch your Freighter wallet to {selected}, disconnect and reconnect your wallet.',
    taxId: 'Tax ID',
    taxIdPlaceholder: 'NIT / RUT / tax number',
    address: 'Address',
    addressPlaceholder: 'Street, city, country',
    phone: 'Phone',
    phonePlaceholder: '+57 ...',
    clientTaxId: 'Client Tax ID',
    prefillHint: 'Prefilled from your business profile',
    openAmountLabel: 'Let the payer enter the amount',
    openAmountHint: 'No fixed amount — the payer chooses how much to send on the payment page.',
    openAmountPlaceholder: 'Payer decides',
    expiration: 'Expiration',
    defaultDirectTitle: 'Payment request',
  },
  es: {
    failedCreateInvoice: 'No se pudo crear la factura',
    yourInformation: 'Tu informacion',
    clientInformation: 'Informacion del cliente',
    paymentDetails: 'Detalles del pago',
    invoiceDetails: 'Detalles de la factura',
    lineItems: 'Lineas',
    notes: 'Notas',
    walletAddress: 'Direccion de wallet',
    name: 'Nombre',
    email: 'Email',
    company: 'Empresa',
    clientName: 'Nombre del cliente',
    clientEmail: 'Email del cliente',
    clientOptional: 'Cliente (opcional)',
    title: 'Titulo',
    titleDirectPlaceholder: '¿Por qué cobras?',
    amount: 'Monto',
    amountPlaceholder: '0.00',
    currency: 'Moneda',
    dueDate: 'Fecha de vencimiento',
    description: 'Descripcion',
    addItem: 'Agregar item',
    qty: 'Cant.',
    hours: 'Horas',
    rate: 'Precio unit.',
    ratePerHour: 'Tarifa/hr',
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
    itemDescriptionPlaceholder: 'Articulo o producto',
    titleBusinessPlaceholder: 'Venta de productos',
    descriptionBusinessPlaceholder: 'Articulos, cantidades, detalles del pedido...',
    taxPlaceholder: '0',
    notesPlaceholder: 'Terminos de pago, notas adicionales...',
    networkMismatch: 'Red incorrecta: Seleccionaste {selected} pero Freighter esta en {freighter}. Por favor cambia tu wallet Freighter a {selected}, desconecta y reconecta tu wallet.',
    taxId: 'ID fiscal (NIT/RUT/CUIT)',
    taxIdPlaceholder: 'NIT / RUT / numero fiscal',
    address: 'Direccion',
    addressPlaceholder: 'Calle, ciudad, pais',
    phone: 'Telefono',
    phonePlaceholder: '+57 ...',
    clientTaxId: 'ID fiscal del cliente',
    prefillHint: 'Rellenado desde tu perfil de negocio',
    openAmountLabel: 'Que el pagador ingrese el monto',
    openAmountHint: 'Sin monto fijo — el pagador elige cuánto enviar en la página de pago.',
    openAmountPlaceholder: 'El pagador decide',
    expiration: 'Vencimiento',
    defaultDirectTitle: 'Solicitud de pago',
  },
  pt: {
    failedCreateInvoice: 'Falha ao criar fatura',
    yourInformation: 'Suas informacoes',
    clientInformation: 'Informacoes do cliente',
    paymentDetails: 'Detalhes do pagamento',
    invoiceDetails: 'Detalhes da fatura',
    lineItems: 'Itens',
    notes: 'Notas',
    walletAddress: 'Endereco da wallet',
    name: 'Nome',
    email: 'Email',
    company: 'Empresa',
    clientName: 'Nome do cliente',
    clientEmail: 'Email do cliente',
    clientOptional: 'Cliente (opcional)',
    title: 'Titulo',
    titleDirectPlaceholder: 'O que você está cobrando?',
    amount: 'Valor',
    amountPlaceholder: '0.00',
    currency: 'Moeda',
    dueDate: 'Data de vencimento',
    description: 'Descricao',
    addItem: 'Adicionar item',
    qty: 'Qtd.',
    hours: 'Horas',
    rate: 'Preço unit.',
    ratePerHour: 'Taxa/hr',
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
    itemDescriptionPlaceholder: 'Item ou produto',
    titleBusinessPlaceholder: 'Venda de produtos',
    descriptionBusinessPlaceholder: 'Itens, quantidades, detalhes do pedido...',
    taxPlaceholder: '0',
    notesPlaceholder: 'Termos de pagamento, notas adicionais...',
    networkMismatch: 'Rede incorreta: Voce selecionou {selected} mas Freighter esta em {freighter}. Por favor, mude sua carteira Freighter para {selected}, desconecte e reconecte sua carteira.',
    taxId: 'ID fiscal (CNPJ/CPF)',
    taxIdPlaceholder: 'CNPJ / CPF / numero fiscal',
    address: 'Endereco',
    addressPlaceholder: 'Rua, cidade, pais',
    phone: 'Telefone',
    phonePlaceholder: '+55 ...',
    clientTaxId: 'ID fiscal do cliente',
    prefillHint: 'Preenchido do seu perfil de negocio',
    openAmountLabel: 'Deixar o pagador inserir o valor',
    openAmountHint: 'Sem valor fixo — o pagador escolhe quanto enviar na página de pagamento.',
    openAmountPlaceholder: 'O pagador decide',
    expiration: 'Validade',
    defaultDirectTitle: 'Solicitação de pagamento',
  },
};

export default function InvoiceForm({ invoiceType = 'DIRECT_PAYMENT' }: Props) {
  const navigate = useNavigate();
  const { publicKey, getFreighterNetwork } = useWalletStore();
  const { networkPassphrase } = useNetworkStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const isDirect = invoiceType === 'DIRECT_PAYMENT';
  const isService = invoiceType === 'SERVICE_INVOICE';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [freelancerName, setFreelancerName] = useState('');
  const [freelancerEmail, setFreelancerEmail] = useState('');
  const [freelancerCompany, setFreelancerCompany] = useState('');
  const [freelancerTaxId, setFreelancerTaxId] = useState('');
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [freelancerPhone, setFreelancerPhone] = useState('');
  const [freelancerLogoUrl, setFreelancerLogoUrl] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [hasProfile, setHasProfile] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState<Currency>('USDC');
  const [payoutMethod, setPayoutMethod] = useState<'CRYPTO' | 'BRE_B'>('CRYPTO');
  const [payoutAlias, setPayoutAlias] = useState('');
  const [taxRate, setTaxRate] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  // DIRECT_PAYMENT: single amount field
  const [directAmount, setDirectAmount] = useState<string>('');
  // DIRECT_PAYMENT: when true the amount is left open and the payer enters it
  // on the payment page (no fixed total at create time).
  const [isOpenAmount, setIsOpenAmount] = useState(false);

  // BUSINESS/SERVICE: line items
  const [lineItems, setLineItems] = useState<LineItemForm[]>([{ description: '', quantity: 1, rate: 0 }]);

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);
  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };
  const updateLineItem = (index: number, field: keyof LineItemForm, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  // Prefill issuer identity from the saved business profile so it isn't
  // re-typed on every invoice. Functional setState guards against clobbering
  // anything the user manages to type before the fetch resolves.
  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getBusinessProfile(publicKey);
        if (cancelled || !profile) return;
        setHasProfile(true);
        const issuerName = profile.displayName || profile.legalName || '';
        if (issuerName) setFreelancerName((v) => v || issuerName);
        if (profile.email) setFreelancerEmail((v) => v || profile.email || '');
        if (profile.legalName) setFreelancerCompany((v) => v || profile.legalName || '');
        if (profile.taxId) setFreelancerTaxId((v) => v || profile.taxId || '');
        if (profile.phone) setFreelancerPhone((v) => v || profile.phone || '');
        if (profile.logoUrl) setFreelancerLogoUrl((v) => v || profile.logoUrl || '');
        const addr = [profile.addressLine, profile.city, profile.country].filter(Boolean).join(', ');
        if (addr) setFreelancerAddress((v) => v || addr);
        if (profile.defaultCurrency) setCurrency(profile.defaultCurrency);
        if (profile.defaultPayoutMethod) setPayoutMethod(profile.defaultPayoutMethod);
        if (profile.defaultPayoutAlias) setPayoutAlias((a) => a || profile.defaultPayoutAlias || '');
      } catch {
        // Profile is optional — ignore failures and let the user fill manually.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const subtotal = isDirect
    ? isOpenAmount
      ? 0
      : parseFloat(directAmount) || 0
    : lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = taxRate ? subtotal * (parseFloat(taxRate) / 100) : 0;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const freighterNetwork = await getFreighterNetwork();
      if (freighterNetwork && freighterNetwork !== networkPassphrase) {
        const selectedName = networkPassphrase.includes('Test') ? 'TESTNET' : 'MAINNET';
        const freighterName = freighterNetwork.includes('Test') ? 'TESTNET' : 'MAINNET';
        const errorMsg = copy.networkMismatch
          .replace('{selected}', selectedName)
          .replace('{freighter}', freighterName)
          .replace('{selected}', selectedName);
        setError(errorMsg);
        toast.error(errorMsg, { duration: 6000 });
        setIsSubmitting(false);
        return;
      }

      // Direct links auto-title when left blank; open-amount links carry no
      // line items (the payer's amount is persisted at pay time).
      const openAmount = isDirect && isOpenAmount;
      const resolvedTitle = isDirect ? title.trim() || copy.defaultDirectTitle : title;
      const resolvedLineItems = isDirect
        ? openAmount
          ? []
          : [{ description: resolvedTitle, quantity: 1, rate: parseFloat(directAmount) || 0 }]
        : lineItems.filter((item) => item.description && item.rate > 0);

      const invoice = await createInvoice(
        {
          freelancerWallet: publicKey,
          freelancerName: freelancerName || undefined,
          freelancerEmail: freelancerEmail || undefined,
          freelancerCompany: freelancerCompany || undefined,
          freelancerTaxId: freelancerTaxId || undefined,
          freelancerAddress: freelancerAddress || undefined,
          freelancerPhone: freelancerPhone || undefined,
          freelancerLogoUrl: freelancerLogoUrl || undefined,
          clientName: clientName.trim() || (isDirect ? 'Payer' : clientName),
          clientEmail: clientEmail.trim() || (isDirect ? `payer@link2pay.io` : clientEmail),
          clientCompany: clientCompany || undefined,
          clientTaxId: clientTaxId || undefined,
          title: resolvedTitle,
          description: description || undefined,
          notes: notes || undefined,
          currency,
          payoutMethod,
          payoutAlias: payoutMethod === 'BRE_B' ? payoutAlias.trim() || undefined : undefined,
          taxRate: taxRate ? parseFloat(taxRate) : undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          networkPassphrase,
          invoiceType,
          isOpenAmount: openAmount || undefined,
          lineItems: resolvedLineItems,
        },
        publicKey
      );

      toast.success(`Invoice ${invoice.invoiceNumber} created`);
      navigate(`/dashboard/links/${invoice.id}`);
    } catch (err: any) {
      const msg = err.message || copy.failedCreateInvoice;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const settlementSection = (
    <div>
      <label className="label">Settlement</label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPayoutMethod('CRYPTO')}
          className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
            payoutMethod === 'CRYPTO'
              ? 'border-stellar-400 bg-stellar-50 text-stellar-700'
              : 'border-surface-3 bg-card text-ink-2'
          }`}
        >
          <span className="block font-medium">Crypto</span>
          <span className="block text-[11px] text-ink-3">Receiver keeps {currency} on-chain</span>
        </button>
        <button
          type="button"
          onClick={() => setPayoutMethod('BRE_B')}
          className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
            payoutMethod === 'BRE_B'
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-surface-3 bg-card text-ink-2'
          }`}
        >
          <span className="block font-medium">Fiat off-ramp · Bre-B (COP)</span>
          <span className="block text-[11px] text-ink-3">Payer pays {currency}, receiver gets pesos</span>
        </button>
      </div>
      {payoutMethod === 'BRE_B' && (
        <div className="mt-2">
          <input
            className="input"
            placeholder="Bre-B llave (payout alias), e.g. @nequi-3001234567"
            value={payoutAlias}
            onChange={(e) => setPayoutAlias(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-amber-700">Simulated Bre-B settlement (testnet demo)</p>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in sm:space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* ── DIRECT PAYMENT layout (minimal: amount + currency + expiration) ── */}
      {isDirect && (
        <section className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-ink-0 mb-4 uppercase tracking-wider">{copy.paymentDetails}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="label">
                  {copy.amount}
                  {!isOpenAmount && <span className="text-danger"> *</span>}
                </label>
                <input
                  type="number"
                  className={`input ${isOpenAmount ? 'opacity-50' : ''}`}
                  min="0.01"
                  step="0.01"
                  placeholder={isOpenAmount ? copy.openAmountPlaceholder : copy.amountPlaceholder}
                  value={isOpenAmount ? '' : directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  disabled={isOpenAmount}
                  required={!isOpenAmount}
                />
              </div>
              <div>
                <label className="label">{copy.currency}</label>
                <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                  <option value="USDC">USDC</option>
                  <option value="EURC">EURC</option>
                  <option value="XLM">XLM</option>
                </select>
              </div>
              <div>
                <label className="label">{copy.expiration}</label>
                <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-surface-3"
                checked={isOpenAmount}
                onChange={(e) => setIsOpenAmount(e.target.checked)}
              />
              {copy.openAmountLabel}
            </label>
            {isOpenAmount && <p className="text-[11px] text-ink-3">{copy.openAmountHint}</p>}
          </div>
        </section>
      )}

      {/* ── BUSINESS / SERVICE layout ── */}
      {!isDirect && (
        <>
          <section className="card p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-ink-0 mb-1 uppercase tracking-wider">{copy.yourInformation}</h3>
            {hasProfile && (
              <p className="mb-4 text-[11px] text-ink-3">{copy.prefillHint}</p>
            )}
            {!hasProfile && <div className="mb-4" />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">{copy.name}</label>
                <input type="text" className="input" placeholder={copy.yourNamePlaceholder}
                  value={freelancerName} onChange={(e) => setFreelancerName(e.target.value)} />
              </div>
              <div>
                <label className="label">{copy.email}</label>
                <input type="email" className="input" placeholder={copy.yourEmailPlaceholder}
                  value={freelancerEmail} onChange={(e) => setFreelancerEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">{copy.company}</label>
                <input type="text" className="input" placeholder={copy.optional}
                  value={freelancerCompany} onChange={(e) => setFreelancerCompany(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">{copy.taxId}</label>
                <input type="text" className="input" placeholder={copy.taxIdPlaceholder}
                  value={freelancerTaxId} onChange={(e) => setFreelancerTaxId(e.target.value)} />
              </div>
              <div>
                <label className="label">{copy.phone}</label>
                <input type="text" className="input" placeholder={copy.phonePlaceholder}
                  value={freelancerPhone} onChange={(e) => setFreelancerPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">{copy.address}</label>
                <input type="text" className="input" placeholder={copy.addressPlaceholder}
                  value={freelancerAddress} onChange={(e) => setFreelancerAddress(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <label className="label">{copy.walletAddress}</label>
              <div className="input bg-surface-1 font-mono text-xs text-ink-2 cursor-default break-all">{publicKey}</div>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-ink-0 mb-4 uppercase tracking-wider">{copy.clientInformation}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  {copy.clientName} <span className="text-danger">*</span>
                </label>
                <input type="text" className="input" placeholder={copy.clientNamePlaceholder}
                  value={clientName} onChange={(e) => setClientName(e.target.value)} required />
              </div>
              <div>
                <label className="label">
                  {copy.clientEmail} <span className="text-danger">*</span>
                </label>
                <input type="email" className="input" placeholder={copy.clientEmailPlaceholder}
                  value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">{copy.company}</label>
                <input type="text" className="input" placeholder={copy.optional}
                  value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
              </div>
              <div>
                <label className="label">{copy.clientTaxId}</label>
                <input type="text" className="input" placeholder={copy.optional}
                  value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} />
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
                <input type="text" className="input" placeholder={isService ? copy.titlePlaceholder : copy.titleBusinessPlaceholder}
                  value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">{copy.currency}</label>
                  <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                    <option value="USDC">USDC</option>
                    <option value="EURC">EURC</option>
                    <option value="XLM">XLM</option>
                  </select>
                </div>
                <div>
                  <label className="label">{copy.dueDate}</label>
                  <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <div>{settlementSection}</div>
            </div>
            <div>
              <label className="label">{copy.description}</label>
              <textarea className="input min-h-[80px] resize-y" placeholder={isService ? copy.descriptionPlaceholder : copy.descriptionBusinessPlaceholder}
                value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <div className="col-span-2 text-xs font-medium text-ink-3 uppercase tracking-wider">{isService ? copy.hours : copy.qty}</div>
              <div className="col-span-2 text-xs font-medium text-ink-3 uppercase tracking-wider">{isService ? copy.ratePerHour : copy.rate}</div>
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
                    <input type="text" className="input" placeholder={isService ? copy.serviceDescriptionPlaceholder : copy.itemDescriptionPlaceholder}
                      value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} required />
                  </div>
                  <div className="mt-3 sm:col-span-2 sm:mt-0">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:hidden">
                      {isService ? copy.hours : copy.qty}
                    </label>
                    <input type="number" className="input text-center" min="0.01" step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)} required />
                  </div>
                  <div className="mt-3 sm:col-span-2 sm:mt-0">
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:hidden">
                      {isService ? copy.ratePerHour : copy.rate}
                    </label>
                    <input type="number" className="input" min="0" step="0.01" placeholder="0.00"
                      value={item.rate || ''}
                      onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)} required />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm sm:col-span-2 sm:mt-0 sm:block sm:text-right">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-ink-3 sm:hidden">{copy.amount}</span>
                    <span className="font-mono text-ink-1">{(item.quantity * item.rate).toFixed(2)}</span>
                  </div>
                  <div className="mt-3 text-right sm:col-span-1 sm:mt-0 sm:text-center">
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLineItem(index)}
                        className="text-ink-4 hover:text-danger transition-colors text-lg">
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
                  <input type="number" className="input w-24 text-right sm:w-28" min="0" max="100" step="0.1"
                    placeholder={copy.taxPlaceholder} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
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
            <textarea className="input min-h-[80px] resize-y" placeholder={copy.notesPlaceholder}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </section>
        </>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary w-full sm:w-auto">
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
