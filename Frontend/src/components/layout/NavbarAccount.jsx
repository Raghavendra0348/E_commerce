import { Link, useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useAuthStore } from "../../store/useAuthStore";
import { useTranslation } from "../../hooks/useTranslation";
import { T } from "../common/Translation";
import { getSessionRevision } from "../../lib/session";
import api from "../../api/axios";
import { toast } from "sonner";

export function NavbarMobileAccountLink() {
  const authenticated = useAuthStore(state => state.isAuthenticated);
  return <Link id="navbar-mobile-account" className="mobile-header-account" to={authenticated ? "/account/profile" : "/login?redirect=/account/profile"} aria-label="Your account"><User aria-hidden="true" /></Link>;
}

export function NavbarAccountMenu() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userFirstName = useAuthStore(state => state.user?.name?.split(" ")[0] || null);
  const isAdmin = useAuthStore(state => state.user?.role === "ADMIN");
  const navigate = useNavigate();
  const handleLogout = async () => {
    const revision = getSessionRevision();
    const { refreshToken, logout } = useAuthStore.getState();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch { /* Local sign out still works if the request fails. */ }
    finally {
      if (revision === getSessionRevision()) {
        logout();
        toast.success("You've been signed out");
        navigate("/");
      }
    }
  };
  return (
    <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button id="navbar-account-menu" className="navbar-account flex flex-col items-start hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 cursor-pointer shrink-0 transition-none min-w-0" aria-label={isAuthenticated ? `${t("Your account")}, ${userFirstName}` : t("Sign in")}>
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

                    {isAdmin && (
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
  );
}

export function NavbarOrdersLink() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return (
    <Link id="navbar-orders-link"
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
  );
}
