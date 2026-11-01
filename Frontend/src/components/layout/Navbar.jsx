import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";
import { T } from "@/components/common/Translation";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  MapPin,
  ChevronDown,
  User,
  Package,
  Heart,
  LogOut,
  LayoutDashboard,
  Menu,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import api from "@/api/axios";
import { toast } from "sonner";
import AmazonLogo from "./AmazonLogo";
import LocationModal from "./LocationModal";
import NavbarSearch from "./NavbarSearch";


export default function Navbar({ onMobileMenuToggle }) {
  const { t } = useTranslation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("amazon_delivery_location");
      const location = saved ? JSON.parse(saved) : null;
      return location?.verified && /^[1-9]\d{5}$/.test(location.pincode) && location.city && location.state ? location : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const mobileLayout = location.pathname === "/" ? "home" : location.pathname === "/products" ? "catalog" : "compact";
  const goBack = () => {
    if (location.key !== "default") { navigate(-1); return; }
    const path = location.pathname;
    const parent = path.startsWith("/products/") ? "/products" : path === "/checkout" ? "/cart" : /^\/account\/orders\//.test(path) ? "/account/orders" : path.startsWith("/account/") && path !== "/account/profile" ? "/account/profile" : "/";
    navigate(parent);
  };
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();

  // Fetch cart count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const handleLocationSelect = (newLoc) => {
    setDeliveryLocation(newLoc);
    try {
      localStorage.setItem("amazon_delivery_location", JSON.stringify(newLoc));
    } catch (_) {}
    toast.success(`Delivery location updated to ${newLoc.city} ${newLoc.pincode}`);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (_) {
      // Silent fail — still logout locally
    } finally {
      logout();
      toast.success("You've been signed out");
      navigate("/");
    }
  };

  const userFirstName = user?.name ? user.name.split(" ")[0] : null;

  return (
    <header id="storefront-navbar" data-mobile-layout={mobileLayout} className="storefront-navbar sticky top-0 z-50 select-none">
      {/* Top Navbar Row */}
      <div
        className="bg-[#131921] text-white"
        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
      >
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

          {/* 2. Deliver to Location (as in image: "Delivering to Tirupati 517619 / Update location") */}
          <div
            onClick={() => setLocationModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 cursor-pointer text-white shrink-0 select-none transition-none"
            title="Click to update delivery location"
          >
            <MapPin className="h-4 w-4 text-white mt-1 shrink-0" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[12px] text-[#CCCCCC] leading-tight font-normal">
                <T>{deliveryLocation ? t("Deliver to {city} {pincode}", deliveryLocation) : t("Choose your delivery location")}</T>
              </span>
              <span className="text-[14px] font-bold text-white leading-tight">
                <T>{"Update location"}</T>
              </span>
            </div>
          </div>

          {/* 3. Search Bar with Category Dropdown & Orange Button */}
          <NavbarSearch />
          <Link className="mobile-header-account" to={isAuthenticated ? "/account/profile" : "/login?redirect=/account/profile"} aria-label="Your account"><User aria-hidden="true" /></Link>

          <LanguageSelector className="hidden lg:flex" />

          {/* 5. Account & Lists */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="navbar-account flex flex-col items-start hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 cursor-pointer shrink-0 transition-none min-w-0" aria-label={isAuthenticated ? `${t("Your account")}, ${userFirstName}` : t("Sign in")}>
                <span className="hidden sm:block text-[12px] text-[#CCCCCC] leading-tight font-normal">
                  <T>{isAuthenticated ? t("Hello, {name}", { name: userFirstName }) : t("Hello, sign in")}</T>
                </span>
                <span className="hidden sm:flex text-[14px] font-bold text-white leading-tight items-center gap-0.5">
                  <T>{"Account & Lists"}</T> <ChevronDown className="h-3 w-3 text-[#A7ACB2]" />
                </span>
                <span className="flex sm:hidden items-center gap-1 text-xs font-semibold"><User className="h-5 w-5 shrink-0" /><span className="max-w-[64px] truncate"><T>{isAuthenticated ? userFirstName : "Sign in"}</T></span></span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-white text-[#0F1111] p-3 shadow-xl mt-1">
              {!isAuthenticated ? (
                <div className="pb-3 text-center border-b border-[#D5D9D9]">
                  <Button asChild className="w-full bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs h-9">
                    <Link to="/login"><T>{"Sign in"}</T></Link>
                  </Button>
                  <p className="text-[11px] text-[#565959] mt-2">
                    New customer?{" "}
                    <Link to="/register" className="text-[#007185] hover:text-[#C7511F] hover:underline font-semibold">
                      Start here.
                    </Link>
                  </p>
                </div>
              ) : null}

              <div className="pt-2 space-y-1">
                <div className="text-xs font-bold text-[#0F1111] px-2 py-1">
                  <T>{"Your Account"}</T>
                </div>
                {isAuthenticated && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/account/profile" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer">
                        <User className="h-4 w-4 text-[#565959]" /> <T>{"Your Profile"}</T>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/orders" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer">
                        <Package className="h-4 w-4 text-[#565959]" /> <T>{"Your Orders"}</T>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer">
                        <Heart className="h-4 w-4 text-[#565959]" /> <T>{"Your Wish List"}</T>
                      </Link>
                    </DropdownMenuItem>

                    {user?.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/dashboard" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer text-[#007185] font-semibold">
                            <LayoutDashboard className="h-4 w-4 text-[#007185]" /> <T>{"Admin Console"}</T>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 text-[#CC0C39] focus:text-[#CC0C39] cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> <T>{"Sign Out"}</T>
                    </DropdownMenuItem>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 6. Returns & Orders */}
          <Link
            to={isAuthenticated ? "/account/orders" : "/login?redirect=/account/orders"}
            className="hidden sm:flex flex-col items-start hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 cursor-pointer text-white shrink-0 select-none transition-none"
          >
            <span className="text-[12px] text-[#CCCCCC] leading-tight font-normal">
              <T>{"Returns"}</T>
            </span>
            <span className="text-[14px] font-bold text-white leading-tight">
              <T>{"& Orders"}</T>
            </span>
          </Link>

          {/* 7. Cart with bold orange count inside basket */}
          <Link
            to="/cart"
            className="navbar-cart flex items-end gap-1 hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 text-white cursor-pointer select-none shrink-0 transition-none"
            aria-label={t("Cart ({count} items)", { count: itemCount })}
          >
            <div className="relative flex items-center">
              <span className="absolute -top-1.5 left-[13px] text-[#FF9900] font-black text-sm leading-none font-sans">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
              <ShoppingCart className="h-7 w-8 text-white stroke-[2]" />
            </div>
            <span className="text-[14px] font-bold leading-none pb-0.5 hidden sm:inline">
              <T>{"Cart"}</T>
            </span>
          </Link>
        </div>
      </div>

      <div className="navbar-location-row flex lg:hidden items-center bg-[#232F3E] text-white pr-1">
      <button onClick={() => setLocationModalOpen(true)} className="navbar-mobile-location flex min-w-0 flex-1 items-center gap-2 bg-[#232F3E] px-3 py-2 text-left text-xs text-white" aria-label="Update delivery location">
        <MapPin className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate"><T>{deliveryLocation ? t("Deliver to {city} {pincode}", deliveryLocation) : t("Choose your delivery location")}</T></span><ChevronDown className="h-3 w-3 shrink-0" />
      </button>
        <LanguageSelector compact className="flex" />
      </div>

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
