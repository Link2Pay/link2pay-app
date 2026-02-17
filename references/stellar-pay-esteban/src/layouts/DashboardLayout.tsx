import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  FilePlus,
  History,
  Users,
  Zap,
  Wallet,
  LogOut,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Crear Invoice", url: "/dashboard/create", icon: FilePlus },
  { title: "Historial", url: "/dashboard/history", icon: History },
  { title: "Clientes", url: "/dashboard/clients", icon: Users },
];

export default function DashboardLayout() {
  const { isConnected, walletAddress, connectWallet, disconnectWallet } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isConnected) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">Link2Pay</span>
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-primary/30 text-primary">
            TESTNET
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/dashboard"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeClassName="bg-sidebar-accent text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground mb-1 px-3">Wallet</div>
          <div className="text-xs font-mono text-foreground px-3 truncate mb-3">
            {walletAddress}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center justify-end px-6 gap-3 flex-shrink-0">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-mono text-primary">{walletAddress}</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              Conectar Wallet
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
