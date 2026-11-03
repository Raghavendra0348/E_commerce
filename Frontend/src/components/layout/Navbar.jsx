import LanguageSelector from "./LanguageSelector";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, ArrowLeft } from "lucide-react";
import AmazonLogo from "./AmazonLogo";
import LocationModal from "./LocationModal";
import NavbarSearch from "./NavbarSearch";
import { NavbarAccountMenu, NavbarMobileAccountLink, NavbarOrdersLink } from "./NavbarAccount";
import NavbarCartLink from "./NavbarCartLink";
import { NavbarDesktopDelivery, NavbarMobileDelivery } from "./NavbarDelivery";
import { useDeliveryLocation } from "@/hooks/useDeliveryLocation";

export default function Navbar({ onMobileMenuToggle }) {
  const { deliveryLocation, locationModalOpen, setLocationModalOpen, handleLocationSelect } = useDeliveryLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileLayout = location.pathname === "/" ? "home" : location.pathname === "/products" ? "catalog" : "compact";
  const goBack = () => {
    if (location.key !== "default") { navigate(-1); return; }
    const path = location.pathname;
    const parent = path.startsWith("/products/") ? "/products" : path === "/checkout" ? "/cart" : /^\/account\/orders\//.test(path) ? "/account/orders" : path.startsWith("/account/") && path !== "/account/profile" ? "/account/profile" : "/";
    navigate(parent);
  };

  return (
    <header id="storefront-navbar" data-mobile-layout={mobileLayout} className="storefront-navbar sticky top-0 z-50 select-none">
      {/* Top Navbar Row */}
      <div className="navbar-top-row bg-[#131921] text-white">
        <div className="navbar-main mx-auto flex min-h-[60px] max-w-[1500px] items-center gap-1 sm:gap-2 px-2 sm:px-4">
          {/* Mobile menu hamburger button */}
          <button
            onClick={onMobileMenuToggle}
            className="flex items-center justify-center p-1.5 text-white hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] md:hidden cursor-pointer"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          {mobileLayout !== "home" && <button type="button" className="navbar-mobile-back" onClick={goBack} aria-label="Go back"><ArrowLeft aria-hidden="true" /></button>}

          {/* 1. Amazon.in Logo */}
          <Link
            to="/"
            className="navbar-logo flex items-center hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 shrink-0 transition-none"
            aria-label="Amazon India Homepage"
          >
            <AmazonLogo className="desktop-amazon-logo" />
            <img className="mobile-amazon-mark" src="/a_logo.jpg" alt="" aria-hidden="true" />
          </Link>

          <NavbarDesktopDelivery deliveryLocation={deliveryLocation} onOpen={() => setLocationModalOpen(true)} />

          {/* 3. Search Bar with Category Dropdown & Orange Button */}
          <NavbarSearch />
          <NavbarMobileAccountLink />

          <LanguageSelector className="hidden lg:flex" />

          <NavbarAccountMenu />
          <NavbarOrdersLink />
          <NavbarCartLink />
        </div>
      </div>

      <NavbarMobileDelivery deliveryLocation={deliveryLocation} onOpen={() => setLocationModalOpen(true)} />

      {/* Deliver To Location Modal */}
      <LocationModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        currentLocation={deliveryLocation}
        onLocationSelect={handleLocationSelect}
      />
    </header>
  );
}
