import type { InvoiceStatus } from '../../types';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'badge-draft' },
  PENDING: { label: 'Pending', className: 'badge-pending' },
  PROCESSING: { label: 'Processing', className: 'badge-processing' },
  PAID: { label: 'Paid', className: 'badge-paid' },
  FAILED: { label: 'Failed', className: 'badge-failed' },
  EXPIRED: { label: 'Expired', className: 'badge-cancelled' },
  CANCELLED: { label: 'Cancelled', className: 'badge-cancelled' },
};

interface Props {
  status: InvoiceStatus;
}

export default function InvoiceStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return <span className={config.className}>{config.label}</span>;
}
