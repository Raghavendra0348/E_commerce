import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import SubNav from "./SubNav";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";
import MobileMenu from "./MobileMenu";
import MobileBottomNav from "./MobileBottomNav";

export default function PageLayout() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  return (
    <div id="storefront-shell" className="storefront-shell flex min-h-dvh min-w-0 flex-col bg-[#EAEDED]">
      {!isOnline && (
        <div className="bg-[#CC0C39] text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5" />
          <span>You are currently browsing offline. Live catalog and order updates may be unavailable.</span>
        </div>
      )}

      <Navbar onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)} />
      <SubNav showMobileCategories={pathname === "/"} />
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      <main id="main-content" className="storefront-content w-full min-w-0 flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Sliding cart drawer */}
      <CartDrawer />
      <MobileBottomNav onBrowse={() => setMobileMenuOpen(true)} browseOpen={mobileMenuOpen} />
    </div>
  );
}

