import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  MapPin,
  ChevronDown,
  User,
  Package,
  Heart,
  LogOut,
  LayoutDashboard,
  Menu,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCategories } from "@/hooks/useCategories";
import api from "@/api/axios";
import { toast } from "sonner";
import AmazonLogo from "./AmazonLogo";
import LocationModal from "./LocationModal";

const LANGUAGES = [
  { code: "EN", label: "English", native: "EN" },
  { code: "HI", label: "हिन्दी", native: "HI" },
  { code: "TA", label: "தமிழ்", native: "TA" },
  { code: "TE", label: "తెలుగు", native: "TE" },
  { code: "KN", label: "ಕನ್ನಡ", native: "KN" },
  { code: "ML", label: "മലയാളം", native: "ML" },
  { code: "BN", label: "বাংলা", native: "BN" },
  { code: "MR", label: "मराठी", native: "MR" },
];

export default function Navbar({ onMobileMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("amazon_delivery_location");
      return saved
        ? JSON.parse(saved)
        : { city: "Tirupati", pincode: "517619" };
    } catch {
      return { city: "Tirupati", pincode: "517619" };
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const { data: categories = [] } = useCategories();
  const inputRef = useRef(null);

  // Sync category selection with URL search parameters if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catId = params.get("categoryId");
    if (catId) {
      setSelectedCategoryId(catId);
    }
    const q = params.get("search");
    if (q) {
      setSearchQuery(q);
    }
  }, [location.search]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("search", trimmed);
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);

    navigate(`/products${params.toString() ? `?${params.toString()}` : ""}`);
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
    <header className="sticky top-0 z-50 select-none">
      {/* Top Navbar Row */}
      <div
        className="bg-[#131921] text-white"
        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
      >
        <div className="mx-auto flex h-[60px] max-w-[1500px] items-center gap-1 sm:gap-2 px-2 sm:px-4">
          {/* Mobile menu hamburger button */}
          <button
            onClick={onMobileMenuToggle}
            className="flex items-center justify-center p-1.5 text-white hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] md:hidden cursor-pointer"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* 1. Amazon.in Logo */}
          <Link
            to="/"
            className="flex items-center hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 shrink-0 transition-none"
            aria-label="Amazon India Homepage"
          >
            <AmazonLogo />
          </Link>

          {/* 2. Deliver to Location (as in image: "Delivering to Tirupati 517619 / Update location") */}
          <div
            onClick={() => setLocationModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 cursor-pointer text-white shrink-0 select-none transition-none"
            title="Click to update delivery location"
          >
            <MapPin className="h-4 w-4 text-white mt-1 shrink-0" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[12px] text-[#CCCCCC] leading-tight font-normal">
                Delivering to {deliveryLocation.city} {deliveryLocation.pincode}
              </span>
              <span className="text-[14px] font-bold text-white leading-tight">
                Update location
              </span>
            </div>
          </div>

          {/* 3. Search Bar with Category Dropdown & Orange Button */}
          <form
            onSubmit={handleSearch}
            className="flex-1 flex h-[40px] min-w-0 mx-1 sm:mx-2 rounded-[4px] overflow-hidden focus-within:ring-2 focus-within:ring-[#FF9900] bg-white"
          >
            {/* Category Dropdown */}
            <div className="relative bg-[#E6E6E6] hover:bg-[#D4D4D4] border-r border-[#CDCDCD] flex items-center shrink-0 transition-colors cursor-pointer group">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="appearance-none bg-transparent h-full pl-3 pr-7 text-[12px] text-[#0F1111] font-medium cursor-pointer outline-none select-none max-w-[130px] sm:max-w-[170px] truncate"
                aria-label="Select Category filter"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 h-3 w-3 text-[#555555] pointer-events-none group-hover:text-[#0F1111]" />
            </div>

            {/* Search Input */}
            <input
              ref={inputRef}
              type="search"
              placeholder="Search Amazon.in"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 text-[14px] text-[#0F1111] bg-white outline-none min-w-0 placeholder:text-[#565959]"
            />

            {/* Search Submit Button */}
            <button
              type="submit"
              className="w-[45px] h-full bg-[#FEBD69] hover:bg-[#F3A847] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              aria-label="Submit search"
            >
              <Search className="h-5 w-5 text-[#131921] stroke-[2.5]" />
            </button>
          </form>

          {/* 4. Language Selector (🇮🇳 EN ▾) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hidden lg:flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-2 cursor-pointer shrink-0 transition-none"
                aria-label="Choose a language for shopping"
              >
                {/* Indian Tricolor Flag */}
                <div className="w-[20px] h-[14px] flex flex-col rounded-[1px] overflow-hidden shadow-xs border border-white/20 shrink-0">
                  <div className="h-1/3 bg-[#FF9933]" />
                  <div className="h-1/3 bg-white flex items-center justify-center">
                    <div className="h-1 w-1 rounded-full border-[0.5px] border-[#000080]" />
                  </div>
                  <div className="h-1/3 bg-[#138808]" />
                </div>
                <span className="text-[14px] font-bold text-white uppercase tracking-tight">
                  {selectedLanguage}
                </span>
                <ChevronDown className="h-3 w-3 text-[#A7ACB2]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white text-[#0F1111] p-1.5 shadow-lg">
              <DropdownMenuLabel className="text-xs text-[#565959] font-bold uppercase tracking-wider px-2 py-1">
                Select Language
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className="flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer hover:bg-[#F7FAFA]"
                >
                  <span className="font-medium">
                    {lang.label} - {lang.native}
                  </span>
                  {selectedLanguage === lang.code && (
                    <Check className="h-4 w-4 text-[#FF9900]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 5. Account & Lists */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-start hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 cursor-pointer shrink-0 transition-none min-w-0">
                <span className="text-[12px] text-[#CCCCCC] leading-tight font-normal">
                  {isAuthenticated ? `Hello, ${userFirstName}` : "Hello, sign in"}
                </span>
                <span className="text-[14px] font-bold text-white leading-tight flex items-center gap-0.5">
                  Account & Lists <ChevronDown className="h-3 w-3 text-[#A7ACB2]" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-white text-[#0F1111] p-3 shadow-xl mt-1">
              {!isAuthenticated ? (
                <div className="pb-3 text-center border-b border-[#D5D9D9]">
                  <Button asChild className="w-full bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs h-9">
                    <Link to="/login">Sign in</Link>
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
                  Your Account
                </div>
                {isAuthenticated && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/account/profile" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer">
                        <User className="h-4 w-4 text-[#565959]" /> Your Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/orders" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer">
                        <Package className="h-4 w-4 text-[#565959]" /> Your Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer">
                        <Heart className="h-4 w-4 text-[#565959]" /> Your Wish List
                      </Link>
                    </DropdownMenuItem>

                    {user?.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/dashboard" className="flex items-center gap-2 text-xs py-1.5 px-2 cursor-pointer text-[#007185] font-semibold">
                            <LayoutDashboard className="h-4 w-4 text-[#007185]" /> Admin Console
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 text-[#CC0C39] focus:text-[#CC0C39] cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
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
              Returns
            </span>
            <span className="text-[14px] font-bold text-white leading-tight">
              & Orders
            </span>
          </Link>

          {/* 7. Cart with bold orange count inside basket */}
          <Link
            to="/cart"
            className="flex items-end gap-1 hover:outline hover:outline-1 hover:outline-white hover:rounded-[2px] px-2 py-1.5 text-white cursor-pointer select-none shrink-0 transition-none"
            aria-label={`Cart (${itemCount} items)`}
          >
            <div className="relative flex items-center">
              <span className="absolute -top-1.5 left-[13px] text-[#FF9900] font-black text-sm leading-none font-sans">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
              <ShoppingCart className="h-7 w-8 text-white stroke-[2]" />
            </div>
            <span className="text-[14px] font-bold leading-none pb-0.5 hidden sm:inline">
              Cart
            </span>
          </Link>
        </div>
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
