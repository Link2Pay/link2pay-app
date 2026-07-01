import type { InvoiceStatus } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/translations';

const STATUS_CONFIG: Record<InvoiceStatus, { labelKey: TranslationKey; className: string }> = {
  DRAFT: { labelKey: 'invoiceStatus.draft', className: 'badge-draft' },
  PENDING: { labelKey: 'invoiceStatus.pending', className: 'badge-pending' },
  AWAITING_ANCHOR: { labelKey: 'invoiceStatus.awaitingAnchor', className: 'badge-processing' },
  AWAITING_PAYMENT: { labelKey: 'invoiceStatus.awaitingPayment', className: 'badge-pending' },
  PROCESSING: { labelKey: 'invoiceStatus.processing', className: 'badge-processing' },
  PAID: { labelKey: 'invoiceStatus.paid', className: 'badge-paid' },
  SETTLING: { labelKey: 'invoiceStatus.settling', className: 'badge-processing' },
  SETTLED_FIAT: { labelKey: 'invoiceStatus.settledFiat', className: 'badge-paid' },
  ANCHOR_ERROR: { labelKey: 'invoiceStatus.anchorError', className: 'badge-failed' },
  NEEDS_KYC: { labelKey: 'invoiceStatus.needsKyc', className: 'badge-pending' },
  FAILED: { labelKey: 'invoiceStatus.failed', className: 'badge-failed' },
  EXPIRED: { labelKey: 'invoiceStatus.expired', className: 'badge-cancelled' },
  CANCELLED: { labelKey: 'invoiceStatus.cancelled', className: 'badge-cancelled' },
};

interface Props {
  status: InvoiceStatus;
}

export default function InvoiceStatusBadge({ status }: Props) {
  const { t } = useI18n();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return <span className={config.className}>{t(config.labelKey)}</span>;
}
