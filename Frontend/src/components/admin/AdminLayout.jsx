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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Users", href: "/admin/users", icon: Users },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-[#131921] text-white transition-all duration-200",
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
                {sidebarOpen && <span>{item.label}</span>}
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
            {sidebarOpen && <span>Back to Store</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#CCCCCC] hover:bg-white/10 hover:text-white transition-colors"
            title={!sidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-[#0F1111]">
            {NAV_ITEMS.find((n) => location.pathname.startsWith(n.href))?.label || "Admin"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#565959]">
              {user?.name} •{" "}
              <span className="text-[#FF9900] font-semibold text-xs">ADMIN</span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
