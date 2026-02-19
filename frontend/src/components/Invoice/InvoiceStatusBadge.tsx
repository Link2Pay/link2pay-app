import type { InvoiceStatus } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/translations';

const STATUS_CONFIG: Record<InvoiceStatus, { labelKey: TranslationKey; className: string }> = {
  DRAFT: { labelKey: 'invoiceStatus.draft', className: 'badge-draft' },
  PENDING: { labelKey: 'invoiceStatus.pending', className: 'badge-pending' },
  PROCESSING: { labelKey: 'invoiceStatus.processing', className: 'badge-processing' },
  PAID: { labelKey: 'invoiceStatus.paid', className: 'badge-paid' },
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
