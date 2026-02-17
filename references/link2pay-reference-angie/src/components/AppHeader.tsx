import { Link, useLocation } from "react-router-dom";
import { FileText, Plus, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const AppHeader = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Link2Pay</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            to="/dashboard"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive("/dashboard")
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Invoices
          </Link>
          <Link
            to="/create"
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:text-foreground sm:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border px-4 pb-4 pt-2 sm:hidden">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Invoices
          </Link>
          <Link
            to="/create"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-1 block rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
          >
            Create Invoice
          </Link>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
