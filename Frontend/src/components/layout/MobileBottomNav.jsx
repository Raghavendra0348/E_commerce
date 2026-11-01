import { Link, useLocation } from "react-router-dom";
import { Home, UserRound, Heart, ShoppingCart, Menu } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function MobileBottomNav({ onBrowse, browseOpen = false }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const count = useCartStore(state => state.itemCount);
  const tabs = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/" },
    { label: "You", href: authenticated ? "/account/profile" : "/login?redirect=/account/profile", icon: UserRound, active: pathname.startsWith("/account") || ["/login", "/register"].includes(pathname) },
    { label: "Wishlist", href: authenticated ? "/wishlist" : "/login?redirect=/wishlist", icon: Heart, active: pathname === "/wishlist" },
    { label: "Cart", href: "/cart", icon: ShoppingCart, active: pathname === "/cart" },
  ];
  return <nav id="mobile-bottom-navigation" className="mobile-bottom-navigation" aria-label="Mobile primary navigation">
    {tabs.map(({ label, href, icon: Icon, active }) => <Link key={label} to={href} className={`mobile-bottom-tab ${active && !browseOpen ? "is-active" : ""}`} aria-current={active && !browseOpen ? "page" : undefined}>
      <span className="mobile-bottom-icon"><Icon aria-hidden="true" strokeWidth={1.8} />{label === "Cart" && count > 0 && <span className="mobile-cart-count" aria-label={`${count} items`}>{count > 99 ? "99+" : count}</span>}</span>
      <span>{t(label)}</span>
    </Link>)}
    <button type="button" onClick={onBrowse} className={`mobile-bottom-tab ${browseOpen ? "is-active" : ""}`} aria-expanded={browseOpen} aria-controls="mobile-navigation"><span className="mobile-bottom-icon"><Menu aria-hidden="true" strokeWidth={1.8} /></span><span>{t("Browse")}</span></button>
  </nav>;
}
