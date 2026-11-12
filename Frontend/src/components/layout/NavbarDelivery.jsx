import { MapPin, ChevronDown } from "lucide-react";
import { T } from "../common/Translation";
import { useTranslation } from "../../hooks/useTranslation";
import LanguageSelector from "./LanguageSelector";
import { useAuthStore } from "../../store/useAuthStore";

export function NavbarDesktopDelivery({ deliveryLocation, onOpen }) {
  const { t } = useTranslation();
  const userName = useAuthStore(state => state.isAuthenticated ? state.user?.name?.trim() : null);
  const heading = userName ? `Deliver to ${userName}` : deliveryLocation ? "Deliver to" : t("Choose your delivery location");
  return (
    <button type="button" id="navbar-desktop-delivery"
            onClick={onOpen}
            className="hidden lg:flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 cursor-pointer text-white shrink-0 select-none transition-none"
            title={deliveryLocation ? `${heading}: ${deliveryLocation.city} ${deliveryLocation.pincode}` : heading} aria-label="Update delivery location"
          >
            <MapPin aria-hidden="true" className="h-5 w-5 text-white mt-1 shrink-0" />
            <div className="navbar-delivery-copy flex min-w-0 flex-col text-left leading-tight">
              <span className="truncate text-[12px] text-[#CCCCCC] leading-tight font-normal">
                <T>{heading}</T>
              </span>
              <span className="truncate text-[14px] font-bold text-white leading-tight">
                <T>{deliveryLocation ? `${deliveryLocation.city} ${deliveryLocation.pincode}` : "Update location"}</T>
              </span>
            </div>
          </button>
  );
}

export function NavbarMobileDelivery({ deliveryLocation, onOpen }) {
  const { t } = useTranslation();
  const userName = useAuthStore(state => state.isAuthenticated ? state.user?.name?.trim() : null);
  const locationText = deliveryLocation ? `${deliveryLocation.city} ${deliveryLocation.pincode}` : "Update location";
  const deliveryText = userName ? `Deliver to ${userName} · ${locationText}`
    : deliveryLocation ? t("Deliver to {city} {pincode}", deliveryLocation) : t("Choose your delivery location");
  return (
    <div id="navbar-mobile-delivery" className="navbar-location-row flex lg:hidden items-center bg-[#232F3E] text-white pr-1">
      <button type="button" onClick={onOpen} className="navbar-mobile-location flex min-w-0 flex-1 items-center gap-2 bg-[#232F3E] px-3 py-2 text-left text-xs text-white" aria-label="Update delivery location" title={deliveryText}>
        <MapPin className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate"><T>{deliveryText}</T></span><ChevronDown className="h-3 w-3 shrink-0" />
      </button>
        <LanguageSelector compact className="flex" />
      </div>
  );
}
