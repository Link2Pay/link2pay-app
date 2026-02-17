import { cn } from "@/lib/utils";

type InvoiceStatus = "draft" | "pending" | "paid";

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning",
  },
  paid: {
    label: "Paid · NFT Minted",
    className: "bg-success/10 text-success",
  },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-muted-foreground": status === "draft",
          "bg-warning": status === "pending",
          "bg-success": status === "paid",
        })}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
export type { InvoiceStatus };
