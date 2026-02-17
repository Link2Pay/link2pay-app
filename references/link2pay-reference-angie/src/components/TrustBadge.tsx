import { Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  variant: "verified" | "nft";
  className?: string;
}

const TrustBadge = ({ variant, className }: TrustBadgeProps) => {
  if (variant === "verified") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground",
          className
        )}
      >
        <Shield className="h-3.5 w-3.5" />
        Blockchain-Verified
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground",
        className
      )}
    >
      <Lock className="h-3.5 w-3.5" />
      NFT-Backed
    </span>
  );
};

export default TrustBadge;
