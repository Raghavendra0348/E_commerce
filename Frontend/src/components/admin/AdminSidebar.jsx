import { T } from "@/components/common/Translation";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Activity,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "System Health", href: "/admin/system", icon: Activity, live: true },
];

export default function AdminSidebar({
  open = true,
  onToggle,
  onLogout,
  onNavigate,
  showToggle = true,
  className,
}) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#131921] text-white transition-all duration-200 select-none shrink-0",
        open ? "w-60" : "w-16",
        className
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {open && (
          <Link to="/admin/dashboard" className="font-extrabold text-lg flex items-center">
            amazon<span className="text-[#FF9900]">.in</span>
            <span className="ml-2 text-xs text-[#BBBFBF] font-normal uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </Link>
        )}
        {showToggle && <button
          onClick={onToggle}
          className="text-white/70 hover:text-white transition-colors p-1 rounded"
          aria-label="Toggle sidebar"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 mx-auto" />}
        </button>}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
                onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-[#FF9900] text-[#0F1111]"
                  : "text-[#CCCCCC] hover:bg-white/10 hover:text-white"
              )}
              title={!open ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {open && (
                <span className="flex items-center justify-between flex-1">
                  <span><T>{item.label}</T></span>
                  {item.live && (
                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/10 p-2 space-y-1">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#CCCCCC] hover:bg-white/10 hover:text-white transition-colors"
          title={!open ? "Back to Store" : undefined}
        >
          <Home className="h-5 w-5 shrink-0" />
          {open && <span><T>{"Back to Store"}</T></span>}
        </Link>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#CCCCCC] hover:bg-[#CC0C39]/20 hover:text-[#CC0C39] transition-colors"
          title={!open ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {open && <span><T>{"Sign Out"}</T></span>}
        </button>
      </div>
    </aside>
  );
}
