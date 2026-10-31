import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SubNav from "./SubNav";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";

export default function PageLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  return (
    <div className="flex min-h-screen flex-col bg-[#EAEDED]">
      {!isOnline && (
        <div className="bg-[#CC0C39] text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="h-3.5 w-3.5" />
          <span>You are currently browsing offline. Live catalog and order updates may be unavailable.</span>
        </div>
      )}

      <Navbar onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)} />
      <SubNav />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Sliding cart drawer */}
      <CartDrawer />
    </div>
  );
}

