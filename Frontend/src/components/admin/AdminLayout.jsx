import { T } from "@/components/common/Translation";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Home,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import LanguageSelector from "@/components/layout/LanguageSelector";
import AdminSidebar from "./AdminSidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "System Health", href: "/admin/system", icon: Activity },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div id="admin-shell" className="admin-shell flex h-dvh min-w-0 overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 flex-col bg-[#131921] text-white transition-all duration-200",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        {/* Logo + toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <span className="font-extrabold text-lg">
              amazon<span className="text-[#FF9900]">.in</span>
              <span className="ml-2 text-xs text-[#BBBFBF] font-normal">Admin</span>
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Collapse admin sidebar" : "Expand admin sidebar"}
            className="text-white/70 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#FF9900] text-[#0F1111]"
                    : "text-[#CCCCCC] hover:bg-white/10 hover:text-white"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span><T>{item.label}</T></span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/10 p-2 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#CCCCCC] hover:bg-white/10 hover:text-white transition-colors"
            title={!sidebarOpen ? "Back to Store" : undefined}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span><T>{"Back to Store"}</T></span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#CCCCCC] hover:bg-white/10 hover:text-white transition-colors"
            title={!sidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span><T>{"Sign Out"}</T></span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent id="admin-mobile-navigation" side="left" className="w-[min(20rem,90vw)] bg-[#131921] text-white p-0 flex flex-col">
          <SheetHeader className="sr-only"><SheetTitle>Admin navigation</SheetTitle><SheetDescription>Manage your store and return to the storefront.</SheetDescription></SheetHeader>
          <AdminSidebar open showToggle={false} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} className="h-full w-full" />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 sm:px-6">
          <button onClick={() => setMobileOpen(true)} aria-label="Open admin navigation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gray-200 md:hidden"><Menu className="h-5 w-5" /></button>
          <h1 className="min-w-0 flex-1 text-base sm:text-lg font-semibold text-[#0F1111]">
            <T>{NAV_ITEMS.find((n) => location.pathname.startsWith(n.href))?.label || "Admin"}</T>
          </h1>
          <div className="flex min-w-0 items-center gap-3">
            <LanguageSelector compact className="flex bg-[#131921]" />
            <span className="text-sm text-[#565959]">
              <span className="hidden sm:inline">{user?.name} • </span>
              <span className="text-[#FF9900] font-semibold text-xs">ADMIN</span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main id="admin-main-content" className="admin-content min-w-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
