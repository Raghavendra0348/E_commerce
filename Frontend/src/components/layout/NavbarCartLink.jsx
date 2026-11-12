import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { useTranslation } from "../../hooks/useTranslation";
import { T } from "../common/Translation";

export default function NavbarCartLink() {
  const { t } = useTranslation();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.user?.id);
  const itemCount = useCartStore(state => state.itemCount);
  const fetchCart = useCartStore(state => state.fetchCart);
  useEffect(() => {
    if (authenticated) void fetchCart();
  }, [authenticated, userId, fetchCart]);
  return (
    <Link id="navbar-cart-link"
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
  );
}
