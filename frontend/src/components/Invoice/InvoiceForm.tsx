import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SectionCard from '../ui/SectionCard';
import Field from '../ui/Field';
import toast from 'react-hot-toast';
import { Calendar, Check, ChevronDown, Lock, Plus, X } from 'lucide-react';
import { createInvoice, getBusinessProfile } from '../../services/api';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import KycGate from '../Kyc/KycGate';
import ComingSoonWall from '../Offramp/ComingSoonWall';
import { railByCountry, FIAT_RAILS } from '../../config/rails';
import { config } from '../../config';
import { endOfDayIso } from '../../lib/format';
import type { Currency, InvoiceType } from '../../types';
import type { Language } from '../../i18n/translations';
import usdcLogo from '../../assets/logos/usdc.png';
import eurcLogo from '../../assets/logos/eurc.png';
import xlmLogo from '../../assets/logos/xlm.png';

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
    noExpiryHint: string;
    showDatePicker: string;
    kycRequiredError: string;
  breBKeyLockedLabel: string;
  breBKeyLockedCta: string;
  settlement: string;
  payoutAlias: string;
  settlementDemo: string;
  fiatPanelHint: string;
  fiatAliasHint: string;
  removeLineItem: string;
  remove: string;
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
    creating: 'Creating…',
    createInvoice: 'Create Invoice',
    yourNamePlaceholder: 'Your name',
    yourEmailPlaceholder: 'you@example.com',
    optional: 'Optional',
    clientNamePlaceholder: 'Client name',
    clientEmailPlaceholder: 'client@example.com',
    titlePlaceholder: 'Website Development',
    descriptionPlaceholder: 'Project description…',
    serviceDescriptionPlaceholder: 'Service description',
    itemDescriptionPlaceholder: 'Item or product',
    titleBusinessPlaceholder: 'Product sale',
    descriptionBusinessPlaceholder: 'Items, quantities, order details…',
    taxPlaceholder: '0',
    notesPlaceholder: 'Payment terms, additional notes…',
    networkMismatch: 'Network mismatch: You selected {selected} but Freighter wallet is on {freighter}. Please switch your Freighter wallet to {selected}, disconnect and reconnect your wallet.',
    taxId: 'Tax ID',
    taxIdPlaceholder: 'NIT / RUT / tax number',
    address: 'Address',
    addressPlaceholder: 'Street, city, country',
    phone: 'Phone',
    phonePlaceholder: '+57 …',
    clientTaxId: 'Client Tax ID',
    prefillHint: 'Prefilled from your business profile',
    openAmountLabel: 'Let the payer enter the amount',
    openAmountHint: 'No fixed amount. The payer chooses how much to send on the payment page.',
    openAmountPlaceholder: 'Payer decides',
    expiration: 'Expiration',
    defaultDirectTitle: 'Payment request',
    noExpiryHint: 'Leave blank for no expiration',
    showDatePicker: 'Show date picker',
    kycRequiredError: 'Verify your identity to create a fiat (Bre-B) payment link.',
    breBKeyLockedLabel: 'Add your Bre-B key in your profile to enable this option.',
    breBKeyLockedCta: 'Go to profile',
    settlement: 'Settlement',
    payoutAlias: 'Payout alias',
    settlementDemo: 'Simulated {rail} settlement (demo)',
    fiatPanelHint: 'Configure the alias that receives COP and complete identity verification to enable Bre-B settlement.',
    fiatAliasHint: 'Enter the Bre-B alias, key, or account identifier used to receive the payout.',
    removeLineItem: 'Remove line item',
    remove: 'Remove',
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
    creating: 'Creando…',
    createInvoice: 'Crear factura',
    yourNamePlaceholder: 'Tu nombre',
    yourEmailPlaceholder: 'tu@email.com',
    optional: 'Opcional',
    clientNamePlaceholder: 'Nombre del cliente',
    clientEmailPlaceholder: 'cliente@email.com',
    titlePlaceholder: 'Desarrollo web',
    descriptionPlaceholder: 'Descripcion del proyecto…',
    serviceDescriptionPlaceholder: 'Descripcion del servicio',
    itemDescriptionPlaceholder: 'Articulo o producto',
    titleBusinessPlaceholder: 'Venta de productos',
    descriptionBusinessPlaceholder: 'Articulos, cantidades, detalles del pedido…',
    taxPlaceholder: '0',
    notesPlaceholder: 'Terminos de pago, notas adicionales…',
    networkMismatch: 'Red incorrecta: Seleccionaste {selected} pero Freighter esta en {freighter}. Por favor cambia tu wallet Freighter a {selected}, desconecta y reconecta tu wallet.',
    taxId: 'ID fiscal (NIT/RUT/CUIT)',
    taxIdPlaceholder: 'NIT / RUT / numero fiscal',
    address: 'Direccion',
    addressPlaceholder: 'Calle, ciudad, pais',
    phone: 'Telefono',
    phonePlaceholder: '+57 …',
    clientTaxId: 'ID fiscal del cliente',
    prefillHint: 'Rellenado desde tu perfil de negocio',
    openAmountLabel: 'Que el pagador ingrese el monto',
    openAmountHint: 'Sin monto fijo. El pagador elige cuánto enviar en la página de pago.',
    openAmountPlaceholder: 'El pagador decide',
    expiration: 'Vencimiento',
    defaultDirectTitle: 'Solicitud de pago',
    noExpiryHint: 'Déjalo en blanco para que no expire',
    showDatePicker: 'Mostrar selector de fecha',
    kycRequiredError: 'Verifica tu identidad para crear un link de pago en fiat (Bre-B).',
    breBKeyLockedLabel: 'Agrega tu llave Bre-B en tu perfil para activar esta opción.',
    breBKeyLockedCta: 'Ir a mi perfil',
    settlement: 'Liquidación',
    payoutAlias: 'Alias de cobro',
    settlementDemo: 'Liquidación {rail} simulada (demo)',
    fiatPanelHint: 'Configura el alias que recibe COP y completa la verificación de identidad para habilitar Bre-B.',
    fiatAliasHint: 'Ingresa el alias, llave o identificador de cuenta que recibirá el retiro.',
    removeLineItem: 'Eliminar línea',
    remove: 'Eliminar',
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
    creating: 'Criando…',
    createInvoice: 'Criar fatura',
    yourNamePlaceholder: 'Seu nome',
    yourEmailPlaceholder: 'voce@email.com',
    optional: 'Opcional',
    clientNamePlaceholder: 'Nome do cliente',
    clientEmailPlaceholder: 'cliente@email.com',
    titlePlaceholder: 'Desenvolvimento de site',
    descriptionPlaceholder: 'Descricao do projeto…',
    serviceDescriptionPlaceholder: 'Descricao do servico',
    itemDescriptionPlaceholder: 'Item ou produto',
    titleBusinessPlaceholder: 'Venda de produtos',
    descriptionBusinessPlaceholder: 'Itens, quantidades, detalhes do pedido…',
    taxPlaceholder: '0',
    notesPlaceholder: 'Termos de pagamento, notas adicionais…',
    networkMismatch: 'Rede incorreta: Voce selecionou {selected} mas Freighter esta em {freighter}. Por favor, mude sua carteira Freighter para {selected}, desconecte e reconecte sua carteira.',
    taxId: 'ID fiscal (CNPJ/CPF)',
    taxIdPlaceholder: 'CNPJ / CPF / numero fiscal',
    address: 'Endereco',
    addressPlaceholder: 'Rua, cidade, pais',
    phone: 'Telefone',
    phonePlaceholder: '+55 …',
    clientTaxId: 'ID fiscal do cliente',
    prefillHint: 'Preenchido do seu perfil de negocio',
    openAmountLabel: 'Deixar o pagador inserir o valor',
    openAmountHint: 'Sem valor fixo. O pagador escolhe quanto enviar na página de pagamento.',
    openAmountPlaceholder: 'O pagador decide',
    expiration: 'Validade',
    defaultDirectTitle: 'Solicitação de pagamento',
    noExpiryHint: 'Deixe em branco para não expirar',
    showDatePicker: 'Mostrar seletor de data',
    kycRequiredError: 'Verifique sua identidade para criar um link de pagamento em fiat (Bre-B).',
    breBKeyLockedLabel: 'Adicione sua chave Bre-B no seu perfil para ativar esta opção.',
    breBKeyLockedCta: 'Ir para meu perfil',
    settlement: 'Liquidação',
    payoutAlias: 'Alias de recebimento',
    settlementDemo: 'Liquidação {rail} simulada (demo)',
    fiatPanelHint: 'Configure o alias que recebe COP e conclua a verificação de identidade para habilitar o Bre-B.',
    fiatAliasHint: 'Digite o alias, chave ou identificador da conta que receberá o pagamento.',
    removeLineItem: 'Remover item',
    remove: 'Remover',
  },
};


function formatMoney(value: number, currency: Currency) {
  return `${value.toFixed(2)} ${currency}`;
}

const CURRENCY_OPTIONS: Array<{ value: Currency; label: string; logo: string }> = [
  { value: 'USDC', label: 'USDC', logo: usdcLogo },
  { value: 'EURC', label: 'EURC', logo: eurcLogo },
  { value: 'XLM', label: 'XLM', logo: xlmLogo },
];

function CurrencyPicker({
  id,
  name,
  value,
  onChange,
  className = '',
}: {
  id: string;
  name: string;
  value: Currency;
  onChange: (value: Currency) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = CURRENCY_OPTIONS.find((option) => option.value === value) ?? CURRENCY_OPTIONS[0];

  return (
    <div
      className="relative"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        className={`input flex items-center justify-between gap-3 pr-3 text-left ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <img src={selected.logo} alt="" className="h-5 w-5 shrink-0 rounded-full" />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-foreground transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-popover p-1 shadow-overlay"
        >
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition-colors duration-150 ${
                option.value === value ? 'bg-muted text-foreground' : 'text-ink-2 hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <img src={option.logo} alt="" className="h-5 w-5 shrink-0 rounded-full" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateInput({
  id,
  name,
  value,
  onChange,
  pickerLabel,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  pickerLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        className="input date-input pr-11"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label={pickerLabel}
        title={pickerLabel}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Calendar aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

function SettlementOptionCard({
  id,
  name,
  value,
  checked,
  compact,
  title,
  description,
  onChange,
  locked,
}: {
  id: string;
  name: string;
  value: 'CRYPTO' | 'BRE_B';
  checked: boolean;
  compact: boolean;
  title: string;
  description: string;
  onChange: (value: 'CRYPTO' | 'BRE_B') => void;
  locked?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      aria-disabled={locked}
      className={`group relative flex gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-150 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background ${
        compact ? 'min-h-16 items-center' : 'min-h-20 items-start'
      } ${
        locked
          ? 'cursor-not-allowed border-border bg-muted text-ink-3 opacity-50'
          : `cursor-pointer ${
              checked
                ? 'border-accent-ink bg-card-invert text-card-invert-foreground'
                : 'border-border bg-muted text-ink-2 hover:text-foreground'
            }`
      }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        className="sr-only"
        checked={checked}
        disabled={locked}
        onChange={() => {
          if (!locked) onChange(value);
        }}
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150 ${
          locked
            ? 'border-border bg-card text-ink-3'
            : checked
              ? 'border-card-invert-foreground bg-card-invert-foreground text-card-invert'
              : 'border-border bg-card text-transparent'
        }`}
      >
        {locked ? (
          <Lock className="h-3 w-3" strokeWidth={3} />
        ) : (
          checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />
        )}
      </span>
      <span className="min-w-0">
        <span className={`block font-bold ${!locked && checked ? 'text-card-invert-foreground' : 'text-foreground'}`}>
          {title}
        </span>
        <span className={`mt-1 block text-2xs ${!locked && checked ? 'text-card-invert-foreground/70' : 'text-ink-3'}`}>
          {description}
        </span>
      </span>
    </label>
  );
}

export default function InvoiceForm({ invoiceType = 'DIRECT_PAYMENT' }: Props) {
  const navigate = useNavigate();
  const { publicKey, getFreighterNetwork, _externalSigner } = useWalletStore();
  const { networkPassphrase } = useNetworkStore();
  const { language, t } = useI18n();
  const copy = COPY[language];
  const formId = useId();

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
  // Wall 2: a saved Bre-B key (BusinessProfile.defaultPayoutAlias) is required
  // before the Bre-B settlement option can be selected at all.
  const [hasBreBKey, setHasBreBKey] = useState(false);
  // The merchant's country decides which fiat rail the off-ramp offers.
  const [merchantCountry, setMerchantCountry] = useState('');
  // Cleared to create a fiat (Bre-B) invoice: verified merchant, or gate disabled.
  // Crypto invoices ignore this entirely.
  const [kycVerified, setKycVerified] = useState(false);
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
        setMerchantCountry(profile.country ?? '');
        if (profile.defaultCurrency) setCurrency(profile.defaultCurrency);
        const breBKeySaved = Boolean(profile.defaultPayoutAlias);
        setHasBreBKey(breBKeySaved);
        // Never auto-select Bre-B without a saved key — it would land on a
        // locked option (Wall 2).
        if (profile.defaultPayoutMethod === 'BRE_B' ? breBKeySaved : profile.defaultPayoutMethod) {
          setPayoutMethod(profile.defaultPayoutMethod);
        }
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

  // The fiat off-ramp rail is fixed by the merchant's country. Bre-B (Colombia)
  // is live; Pix (Brazil) and Transferência 3.0 (Argentina) are walled. Falls
  // back to Bre-B when no country is set so today's behaviour is preserved.
  const fiatRail = railByCountry(merchantCountry) ?? FIAT_RAILS.BRE_B;
  // A rail is usable when it's rolled out AND this environment allows fiat
  // (testnet walls fiat — the anchor there only simulates settlement).
  const fiatLive = fiatRail.status === 'live' && config.fiatRailsEnabled;
  // On fiat-disabled environments the option isn't rendered, so BRE_B can
  // never be selected; the extra guard keeps stale state from resurfacing it.
  const fiatSelected = payoutMethod === 'BRE_B' && config.fiatRailsEnabled;
  const fiatWalled = fiatSelected && !fiatLive;
  const directAmountId = `${formId}-direct-amount`;
  const directCurrencyId = `${formId}-direct-currency`;
  const directDueDateId = `${formId}-direct-due-date`;
  const payoutAliasId = `${formId}-payout-alias`;
  const fiatAliasHintId = `${formId}-fiat-alias-hint`;
  const lineDescriptionLabel = isService ? copy.serviceDescriptionPlaceholder : copy.itemDescriptionPlaceholder;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    // Walled rails (Pix / Transferência 3.0) can't create an invoice yet.
    if (fiatWalled) return;

    // Defensive: the settlement option is locked in the UI without a saved
    // Bre-B key, so this shouldn't be reachable — the backend enforces it too.
    if (fiatSelected && fiatLive && !hasBreBKey) return;

    // Fiat payouts require a verified merchant. Crypto has no gate.
    if (fiatSelected && fiatLive && !kycVerified) {
      setError(copy.kycRequiredError);
      toast.error(copy.kycRequiredError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // The Freighter network-mismatch guard only applies when signing through
      // Freighter, whose browser extension carries its own selected network.
      // Privy embedded wallets (external signer) sign for whatever passphrase we
      // pass, so this check is irrelevant — and would false-positive if the user
      // merely has the Freighter extension installed on a different network.
      if (!_externalSigner) {
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
          // Only a live fiat rail becomes a BRE_B invoice; anything else is crypto.
          payoutMethod: fiatSelected && fiatLive ? 'BRE_B' : 'CRYPTO',
          payoutAlias: fiatSelected && fiatLive ? payoutAlias.trim() || undefined : undefined,
          taxRate: taxRate ? parseFloat(taxRate) : undefined,
          dueDate: dueDate ? endOfDayIso(dueDate) : undefined,
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

  const renderSettlementSection = (compact = false) => (
    <div className="space-y-3">
      {/* Fiat is an environment capability: on fiat-disabled environments
          (testnet is crypto-only) the option is not rendered at all. */}
      <fieldset>
        <legend className="label mb-2">{copy.settlement}</legend>
        <div className={`grid grid-cols-1 gap-2 ${compact || !config.fiatRailsEnabled ? '' : 'sm:grid-cols-2'}`}>
          <SettlementOptionCard
            id={`${formId}-settlement-crypto`}
            name={`${formId}-settlement`}
            value="CRYPTO"
            checked={payoutMethod === 'CRYPTO'}
            compact={compact}
            title={t('rail.cryptoLabel')}
            description={t('rail.cryptoDesc', { currency })}
            onChange={setPayoutMethod}
          />
          {config.fiatRailsEnabled && (
            <SettlementOptionCard
              id={`${formId}-settlement-fiat`}
              name={`${formId}-settlement`}
              value="BRE_B"
              checked={fiatSelected}
              compact={compact}
              title={`${t('rail.fiatOfframp')} · ${fiatRail.railName} (${fiatRail.currency})`}
              description={t('rail.fiatDesc', { currency, fiat: fiatRail.currency })}
              onChange={setPayoutMethod}
              locked={!hasBreBKey}
            />
          )}
        </div>
      </fieldset>
      {config.fiatRailsEnabled && !hasBreBKey && (
        <p className="flex flex-wrap items-center gap-1.5 px-1 text-2xs text-ink-3">
          <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
          {copy.breBKeyLockedLabel}
          <Link to="/dashboard/profile-options#payout-section" className="font-semibold text-accent-ink hover:underline">
            {copy.breBKeyLockedCta}
          </Link>
        </p>
      )}
      {fiatSelected && fiatLive && (
        <div className="rounded-2xl border border-accent-ink bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="label mb-1">{copy.settlement}</p>
              <h4 className="font-display text-lg font-bold tracking-tight text-foreground">
                {t('rail.fiatOfframp')} · {fiatRail.railName}
              </h4>
              <p className="mt-1 text-xs text-ink-3">{copy.fiatPanelHint}</p>
            </div>
            <span className="ml-auto inline-flex h-7 shrink-0 items-center rounded-full border border-border bg-muted px-2.5 text-2xs font-semibold text-secondary-foreground">
              {fiatRail.currency}
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
            <div className="space-y-3">
              <Field
                id={payoutAliasId}
                label={copy.payoutAlias}
                hint={copy.fiatAliasHint}
                hintId={fiatAliasHintId}
              >
                <input
                  id={payoutAliasId}
                  name="payoutAlias"
                  className="input"
                  placeholder={`${fiatRail.aliasLabel}: ${fiatRail.aliasPlaceholder}`}
                  value={payoutAlias}
                  onChange={(e) => setPayoutAlias(e.target.value)}
                  autoComplete="off"
                  aria-describedby={fiatAliasHintId}
                />
              </Field>
              <p className="text-2xs text-ink-3">
                {copy.settlementDemo.replace('{rail}', fiatRail.railName)}
              </p>
            </div>
            <KycGate active={fiatSelected && fiatLive} onVerifiedChange={setKycVerified} />
          </div>
        </div>
      )}
      {fiatWalled && <ComingSoonWall rail={fiatRail} wallet={publicKey} />}
    </div>
  );

  // Panel de resumen económico + liquidación para facturas (negocio/servicios).
  // Mismo lenguaje que Pago directo: superficie bg-muted con tarjeta interna
  // bg-card para el total, y la liquidación debajo separada por un hairline.
  const renderInvoiceTotalsPanel = () => (
    <div className="mt-6 rounded-2xl bg-muted p-5">
      <div className="space-y-3 rounded-xl bg-card p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ink-3">{copy.subtotal}</span>
          <span className="font-display font-bold tabular-nums text-foreground">{formatMoney(subtotal, currency)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <label htmlFor={`${formId}-tax-rate`} className="text-ink-3">{copy.taxRate}</label>
          <input
            id={`${formId}-tax-rate`}
            name="taxRate"
            type="number"
            className="input h-10 w-28 text-right tabular-nums"
            min="0"
            max="100"
            step="0.1"
            inputMode="decimal"
            placeholder={copy.taxPlaceholder}
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            autoComplete="off"
          />
        </div>
        {taxAmount > 0 && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-ink-3">{copy.taxAmount}</span>
            <span className="font-display font-bold tabular-nums text-foreground">{formatMoney(taxAmount, currency)}</span>
          </div>
        )}
        <div className="flex items-end justify-between gap-4 border-t border-border pt-3">
          <span className="font-bold text-foreground">{copy.total}</span>
          <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4">{renderSettlementSection()}</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in sm:space-y-8">
      {error && (
        <div
          className="rounded-xl border border-destructive-border bg-destructive-subtle p-4 text-sm text-destructive"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {isDirect && (
        <SectionCard title={copy.paymentDetails} eyebrow={copy.defaultDirectTitle}>
          <div className="grid items-start gap-5">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                <Field id={directAmountId} label={copy.amount} required={!isOpenAmount}>
                  <input
                    id={directAmountId}
                    name="amount"
                    type="number"
                    className={`input h-16 font-display text-3xl font-bold tabular-nums tracking-tight ${isOpenAmount ? 'opacity-50' : ''}`}
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder={isOpenAmount ? copy.openAmountPlaceholder : copy.amountPlaceholder}
                    value={isOpenAmount ? '' : directAmount}
                    onChange={(e) => setDirectAmount(e.target.value)}
                    disabled={isOpenAmount}
                    required={!isOpenAmount}
                    autoComplete="off"
                  />
                </Field>
                <Field id={directCurrencyId} label={copy.currency}>
                  <CurrencyPicker
                    id={directCurrencyId}
                    name="currency"
                    value={currency}
                    onChange={setCurrency}
                    className="h-16 font-bold"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id={directDueDateId} label={copy.expiration} hint={copy.noExpiryHint}>
                  <DateInput
                    id={directDueDateId}
                    name="dueDate"
                    value={dueDate}
                    onChange={setDueDate}
                    pickerLabel={copy.showDatePicker}
                  />
                </Field>
                <label
                  className={`group flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors duration-150 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background ${
                    isOpenAmount
                      ? 'border-card-invert bg-card-invert text-card-invert-foreground'
                      : 'border-border bg-muted text-ink-2 hover:text-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="isOpenAmount"
                    className="sr-only"
                    checked={isOpenAmount}
                    onChange={(e) => setIsOpenAmount(e.target.checked)}
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150 ${
                      isOpenAmount
                        ? 'border-card-invert-foreground bg-card-invert-foreground'
                        : 'border-border bg-card group-hover:border-foreground'
                    }`}
                  >
                    {isOpenAmount && <Check className="h-3.5 w-3.5 text-card-invert" strokeWidth={3} />}
                  </span>
                  <span>
                    <span className={`block font-bold ${isOpenAmount ? 'text-card-invert-foreground' : 'text-foreground'}`}>
                      {copy.openAmountLabel}
                    </span>
                    <span className={`mt-1 block text-xs ${isOpenAmount ? 'text-card-invert-foreground/70' : 'text-ink-3'}`}>
                      {copy.openAmountHint}
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-2xl bg-muted p-5">
                <div className="rounded-xl bg-card p-4">
                  <p className="label mb-2">{copy.total}</p>
                  <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {isOpenAmount ? copy.openAmountPlaceholder : formatMoney(subtotal, currency)}
                  </p>
                </div>
                <div className="mt-5 border-t border-border pt-4">{renderSettlementSection(true)}</div>
              </div>
            </div>

          </div>
        </SectionCard>
      )}

      {!isDirect && (
        <>
          <SectionCard title={copy.yourInformation} hint={hasProfile ? copy.prefillHint : undefined}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field id={`${formId}-freelancer-name`} label={copy.name}>
                <input
                  id={`${formId}-freelancer-name`}
                  name="freelancerName"
                  type="text"
                  className="input"
                  placeholder={copy.yourNamePlaceholder}
                  value={freelancerName}
                  onChange={(e) => setFreelancerName(e.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field id={`${formId}-freelancer-email`} label={copy.email}>
                <input
                  id={`${formId}-freelancer-email`}
                  name="freelancerEmail"
                  type="email"
                  className="input"
                  placeholder={copy.yourEmailPlaceholder}
                  value={freelancerEmail}
                  onChange={(e) => setFreelancerEmail(e.target.value)}
                  autoComplete="email"
                  spellCheck={false}
                />
              </Field>
              <Field id={`${formId}-freelancer-company`} label={copy.company}>
                <input
                  id={`${formId}-freelancer-company`}
                  name="freelancerCompany"
                  type="text"
                  className="input"
                  placeholder={copy.optional}
                  value={freelancerCompany}
                  onChange={(e) => setFreelancerCompany(e.target.value)}
                  autoComplete="organization"
                />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field id={`${formId}-freelancer-tax-id`} label={copy.taxId}>
                <input
                  id={`${formId}-freelancer-tax-id`}
                  name="freelancerTaxId"
                  type="text"
                  className="input"
                  placeholder={copy.taxIdPlaceholder}
                  value={freelancerTaxId}
                  onChange={(e) => setFreelancerTaxId(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              <Field id={`${formId}-freelancer-phone`} label={copy.phone}>
                <input
                  id={`${formId}-freelancer-phone`}
                  name="freelancerPhone"
                  type="tel"
                  className="input"
                  placeholder={copy.phonePlaceholder}
                  value={freelancerPhone}
                  onChange={(e) => setFreelancerPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </Field>
              <Field id={`${formId}-freelancer-address`} label={copy.address}>
                <input
                  id={`${formId}-freelancer-address`}
                  name="freelancerAddress"
                  type="text"
                  className="input"
                  placeholder={copy.addressPlaceholder}
                  value={freelancerAddress}
                  onChange={(e) => setFreelancerAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </Field>
            </div>
            <div className="mt-4">
              <p className="label">{copy.walletAddress}</p>
              <div className="min-h-11 rounded-xl border border-border bg-muted px-4 py-3 font-mono text-xs text-ink-2 break-all">
                {publicKey}
              </div>
            </div>
          </SectionCard>

          <SectionCard title={copy.clientInformation}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field id={`${formId}-client-name`} label={copy.clientName} required>
                <input
                  id={`${formId}-client-name`}
                  name="clientName"
                  type="text"
                  className="input"
                  placeholder={copy.clientNamePlaceholder}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field id={`${formId}-client-email`} label={copy.clientEmail} required>
                <input
                  id={`${formId}-client-email`}
                  name="clientEmail"
                  type="email"
                  className="input"
                  placeholder={copy.clientEmailPlaceholder}
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  autoComplete="email"
                  spellCheck={false}
                  required
                />
              </Field>
              <Field id={`${formId}-client-company`} label={copy.company}>
                <input
                  id={`${formId}-client-company`}
                  name="clientCompany"
                  type="text"
                  className="input"
                  placeholder={copy.optional}
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  autoComplete="organization"
                />
              </Field>
              <Field id={`${formId}-client-tax-id`} label={copy.clientTaxId}>
                <input
                  id={`${formId}-client-tax-id`}
                  name="clientTaxId"
                  type="text"
                  className="input"
                  placeholder={copy.optional}
                  value={clientTaxId}
                  onChange={(e) => setClientTaxId(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title={copy.invoiceDetails}>
            {/* Una sola columna: título → descripción → panel moneda/fecha debajo
                (también en desktop, no en 2 columnas). */}
            <div className="space-y-4">
              <div className="space-y-4">
                <Field id={`${formId}-title`} label={copy.title} required>
                  <input
                    id={`${formId}-title`}
                    name="title"
                    type="text"
                    className="input"
                    placeholder={isService ? copy.titlePlaceholder : copy.titleBusinessPlaceholder}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </Field>
                <Field id={`${formId}-description`} label={copy.description}>
                  <textarea
                    id={`${formId}-description`}
                    name="description"
                    className="input min-h-[96px] resize-y py-3"
                    placeholder={isService ? copy.descriptionPlaceholder : copy.descriptionBusinessPlaceholder}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
              </div>
              <div className="space-y-4 rounded-2xl bg-muted p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id={`${formId}-currency`} label={copy.currency}>
                    <CurrencyPicker
                      id={`${formId}-currency`}
                      name="currency"
                      value={currency}
                      onChange={setCurrency}
                    />
                  </Field>
                  <Field id={`${formId}-due-date`} label={copy.dueDate} hint={copy.noExpiryHint}>
                  <DateInput
                    id={`${formId}-due-date`}
                    name="dueDate"
                    value={dueDate}
                    onChange={setDueDate}
                    pickerLabel={copy.showDatePicker}
                  />
                </Field>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={copy.lineItems}
            action={
              <button type="button" onClick={addLineItem} className="btn-secondary w-full sm:w-auto">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {copy.addItem}
              </button>
            }
          >
            <div className="mb-2 hidden grid-cols-12 gap-3 px-1 sm:grid">
              <div className="col-span-5 text-2xs font-medium uppercase tracking-label text-muted-foreground">{copy.description}</div>
              <div className="col-span-2 text-2xs font-medium uppercase tracking-label text-muted-foreground">{isService ? copy.hours : copy.qty}</div>
              <div className="col-span-2 text-2xs font-medium uppercase tracking-label text-muted-foreground">{isService ? copy.ratePerHour : copy.rate}</div>
              <div className="col-span-2 text-right text-2xs font-medium uppercase tracking-label text-muted-foreground">{copy.amount}</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-3 sm:space-y-2">
              {lineItems.map((item, index) => {
                const itemBaseId = `${formId}-line-${index}`;
                return (
                  <div key={index} className="rounded-xl border border-border p-3 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3 sm:border-0 sm:p-0">
                    <div className="sm:col-span-5">
                      <label className="mb-1 block text-2xs font-medium uppercase tracking-label text-muted-foreground sm:hidden" htmlFor={`${itemBaseId}-description`}>
                        {copy.description}
                      </label>
                      <input
                        id={`${itemBaseId}-description`}
                        name={`lineItems.${index}.description`}
                        type="text"
                        className="input"
                        placeholder={lineDescriptionLabel}
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        autoComplete="off"
                        required
                      />
                    </div>
                    {/* Mobile: cantidad/horas y tarifa lado a lado (grid-cols-2).
                        Desktop: sm:contents disuelve el wrapper y ambos vuelven a
                        ocupar sus columnas dentro del grid de 12. */}
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:contents sm:mt-0">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-2xs font-medium uppercase tracking-label text-muted-foreground sm:hidden" htmlFor={`${itemBaseId}-quantity`}>
                          {isService ? copy.hours : copy.qty}
                        </label>
                        <input
                          id={`${itemBaseId}-quantity`}
                          name={`lineItems.${index}.quantity`}
                          type="number"
                          className="input text-center tabular-nums"
                          min="0.01"
                          step="0.01"
                          inputMode="decimal"
                          value={item.quantity || ''}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-2xs font-medium uppercase tracking-label text-muted-foreground sm:hidden" htmlFor={`${itemBaseId}-rate`}>
                          {isService ? copy.ratePerHour : copy.rate}
                        </label>
                        <input
                          id={`${itemBaseId}-rate`}
                          name={`lineItems.${index}.rate`}
                          type="number"
                          className="input tabular-nums"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={item.rate || ''}
                          onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>
                    {/* Mobile: divisor bajo Horas/Tarifa + MONTO con el mismo
                        énfasis que la fila "Total" (font-bold text-foreground).
                        Desktop: sin divisor/padding, valor a la derecha. */}
                    <div className="mt-3 flex items-center justify-between border-t border-border px-2 pt-3 sm:col-span-2 sm:mt-0 sm:block sm:border-0 sm:px-0 sm:pt-0 sm:text-right">
                      <span className="text-base font-bold text-foreground sm:hidden">{copy.amount}</span>
                      <span className="font-display text-base font-bold tabular-nums text-foreground sm:text-sm">{formatMoney(item.quantity * item.rate, currency)}</span>
                    </div>
                    <div className="mt-3 flex justify-center sm:col-span-1 sm:mt-0 sm:block sm:text-center">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-ink-4 transition-colors duration-150 hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-11 sm:gap-0 sm:px-0"
                          aria-label={copy.removeLineItem}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span className="text-sm font-medium sm:hidden">{copy.remove}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {renderInvoiceTotalsPanel()}
          </SectionCard>

          <SectionCard title={copy.notes}>
            <Field id={`${formId}-notes`} label={copy.notes}>
              <textarea
                id={`${formId}-notes`}
                name="notes"
                className="input min-h-[96px] resize-y py-3"
                placeholder={copy.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </SectionCard>
        </>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary w-full sm:w-auto"
        >
          {copy.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (fiatSelected && fiatLive && !kycVerified) || fiatWalled}
          className="btn-primary w-full sm:w-auto"
        >
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
