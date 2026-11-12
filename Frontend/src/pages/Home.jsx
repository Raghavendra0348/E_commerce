import { T } from "../components/common/Translation";
import FestivalPromoCard, { EXTRA_FESTIVAL_CARDS } from "../components/home/FestivalPromoCard";
import HomeDiscoveryPanels from "../components/home/HomeDiscoveryPanels";
import RecommendedDeals from "../components/home/RecommendedDeals";
import HomePhotoDiscovery from "../components/home/HomePhotoDiscovery";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as Arrow,
  ShoppingBag,
  Sparkles,
  Truck,
  Smartphone,
  Laptop,
  Zap,
  Shirt,
  UtensilsCrossed,
  Home as HomeIcon,
  Tv,
  Headphones,
  Gamepad2,
  BookOpen,
  Dumbbell,
  Puzzle,
  ShoppingBasket,
  Armchair,
  Car,
  Briefcase,
  Luggage,
  Watch,
  Baby,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import HomeProductCard, { HomeProductCardSkeleton } from "../components/home/HomeProductCard";
import { cn } from "../lib/utils";
import "../styles/home-product-cards.css";

// ─── Hero Banner ─────────────────────────────────────────────────────────────
const FESTIVAL_DEALS = [
  { title: "Under ₹799", subtitle: "Home & kitchen essentials", image: "61veH18HX2L.jpg", color: "#bd1b30", href: "/products?search=kitchen&maxPrice=798.99" },
  { title: "Under ₹1,999", subtitle: "Everyday denim & jeans", image: "denim-orange.png", color: "#e36b08", href: "/products?search=jeans&maxPrice=1998.99" },
  { title: "Under ₹599", subtitle: "Kurtas & ethnic wear", image: "ethnic-green.png", color: "#006b4f", href: "/products?search=kurta&maxPrice=598.99" },
  { title: "Under ₹999", subtitle: "Fashion & accessories", image: "fashion-purple.png", color: "#6b2690", href: "/products?categoryId=4&maxPrice=998.99" },
];
function HeroBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });
  return (
    <section id="festival-carousel" className="festival-carousel" aria-label="Festival offers" aria-roledescription="carousel">
      <div className="festival-viewport" ref={emblaRef}><div className="festival-track">
        {FESTIVAL_DEALS.map((deal, index) => (
          <div key={deal.image} id={`festival-art-slide-${index}`} className="festival-slide festival-art-slide">
            <Link to={deal.href} className="festival-card-link" aria-label={`Shop ${deal.subtitle} ${deal.title}`}>
              <div className="festival-art festival-original-art" style={{ backgroundColor: deal.color }}>
                <img src={`/banners/${deal.image}`} alt={deal.subtitle} width="855" height="1368" fetchPriority={index === 0 ? "high" : "auto"} draggable="false" />
                <div className="festival-original-heading">
                  <h2>{deal.title}</h2>
                  <p>{deal.subtitle}</p>
                  <div className="festival-service-row"><span>Secure<br />Checkout</span><span>Track<br />Orders</span></div>
                </div>
              </div>
            </Link>
          </div>
        ))}
        {EXTRA_FESTIVAL_CARDS.map(card => <FestivalPromoCard key={card.slug} card={card} />)}
      </div></div>
      <Button variant="secondary" className="festival-arrow festival-arrow-prev" onClick={() => emblaApi?.scrollPrev()} aria-label="Previous festival offers"><ChevronLeft /></Button>
      <Button variant="secondary" className="festival-arrow festival-arrow-next" onClick={() => emblaApi?.scrollNext()} aria-label="Next festival offers"><ChevronRight /></Button>
    </section>
  );
}
// ─── Category Icons Mapping ───────────────────────────────────────────────────
const CATEGORY_MAP = [
  { match: ["mobile", "phone", "smartphone"], icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50" },
  { match: ["laptop", "computer", "pc"], icon: Laptop, color: "text-indigo-600", bg: "bg-indigo-50" },
  { match: ["electronic", "gadget"], icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
  { match: ["fashion", "clothing", "apparel", "wear"], icon: Shirt, color: "text-rose-600", bg: "bg-rose-50" },
  { match: ["home-kitchen", "kitchen", "cooking"], icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-50" },
  { match: ["appliance", "home-appliances"], icon: Tv, color: "text-cyan-600", bg: "bg-cyan-50" },
  { match: ["home", "living", "decor"], icon: HomeIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
  { match: ["audio", "headphone", "speaker", "sound"], icon: Headphones, color: "text-purple-600", bg: "bg-purple-50" },
  { match: ["gaming", "game"], icon: Gamepad2, color: "text-red-600", bg: "bg-red-50" },
  { match: ["book", "reading"], icon: BookOpen, color: "text-yellow-700", bg: "bg-yellow-50" },
  { match: ["beauty", "personal-care", "cosmetic"], icon: Sparkles, color: "text-pink-600", bg: "bg-pink-50" },
  { match: ["sport", "fitness", "gym", "workout"], icon: Dumbbell, color: "text-teal-600", bg: "bg-teal-50" },
  { match: ["toy"], icon: Puzzle, color: "text-violet-600", bg: "bg-violet-50" },
  { match: ["grocery", "essential", "supermarket", "food"], icon: ShoppingBasket, color: "text-green-600", bg: "bg-green-50" },
  { match: ["furniture", "sofa", "chair"], icon: Armchair, color: "text-amber-800", bg: "bg-amber-50" },
  { match: ["automotive", "car", "vehicle", "bike"], icon: Car, color: "text-slate-700", bg: "bg-slate-100" },
  { match: ["office", "stationery"], icon: Briefcase, color: "text-sky-700", bg: "bg-sky-50" },
  { match: ["bag", "luggage", "travel", "backpack"], icon: Luggage, color: "text-orange-700", bg: "bg-orange-50" },
  { match: ["wearable", "watch", "smartwatch"], icon: Watch, color: "text-zinc-700", bg: "bg-zinc-100" },
  { match: ["baby", "kid"], icon: Baby, color: "text-pink-500", bg: "bg-pink-50" },
];

function getCategoryMeta(name = "", slug = "") {
  const target = `${name} ${slug}`.toLowerCase();
  for (const item of CATEGORY_MAP) {
    if (item.match.some((term) => target.includes(term))) {
      return item;
    }
  }
  return { icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" };
}

function CategoryRow() {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <section id="home-categories" className="home-category-section bg-white border-b border-[#EDEDED] py-3.5 sm:py-4">
      <div className="mx-auto max-w-[1500px] px-4">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-1">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 shrink-0 animate-pulse"
                >
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#EDEDED]" />
                  <div className="h-3 w-16 rounded bg-[#EDEDED]" />
                </div>
              ))
            : categories.map((cat) => {
                const meta = getCategoryMeta(cat.name, cat.slug);
                const Icon = meta.icon;
                return (
                  <Link
                    key={cat.id}
                    to={`/products?categoryId=${cat.id}`}
                    className="flex flex-col items-center gap-2 shrink-0 group"
                  >
                    <div
                      className={cn(
                        "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-[#D5D9D9] shadow-sm transition-all duration-200",
                        "group-hover:border-[#FF9900] group-hover:shadow-md group-hover:scale-105",
                        meta.bg
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6 sm:h-7 sm:w-7 transition-colors duration-200",
                          meta.color,
                          "group-hover:text-[#FF9900]"
                        )}
                        strokeWidth={1.75}
                      />
                    </div>
                    <span className="text-xs text-[#0F1111] font-medium text-center max-w-[76px] sm:max-w-[84px] leading-tight line-clamp-2 group-hover:text-[#C7511F]">
                      <T>{cat.name}</T>
                    </span>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}

// ─── Horizontal Product Row ───────────────────────────────────────────────────
function ProductRow({ title, params, seeAllHref }) {
  const { data, isLoading, error } = useProducts({ limit: 12, ...params });
  const products = data?.products || [];

  return (
    <section id={`home-row-${title.toLowerCase().replaceAll(" ", "-")}`} className="home-product-row bg-white py-5">
      <div className="mx-auto max-w-[1500px] px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F1111]"><T>{title}</T></h2>
          <Link
            to={seeAllHref}
            className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1"
          >
            <T>{"See all"}</T> <Arrow className="h-3.5 w-3.5" />
          </Link>
        </div>
        {error && <p role="alert" className="text-sm text-[#565959] mb-3">{error.response?.status === 429 ? "Products are temporarily rate-limited. Automatic updates resume after the server cooldown." : "Products could not be loaded. Check that the backend is running."}</p>}
        <div className="home-product-rail no-scrollbar" aria-busy={isLoading}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="home-product-slot">
                  <HomeProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className="home-product-slot">
                  <HomeProductCard product={product} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

// ─── Promo Banner ─────────────────────────────────────────────────────────────


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  useDocumentTitle("Online Shopping India - Mobiles, Electronics, Fashion & More");

  return (
    <div id="storefront-home" className="min-h-screen festival-home">
      {/* Hero Banner */}
      <HeroBanner />
      <RecommendedDeals />
      <HomePhotoDiscovery />
      <HomeDiscoveryPanels />

      {/* Category Row */}
      <CategoryRow />

      {/* Today's Deals */}
      <ProductRow
        title="Today's Deals"
        params={{ sortBy: "price", sortOrder: "asc" }}
        seeAllHref="/products?sortBy=price&sortOrder=asc"
      />

      {/* Promo Banner */}


      {/* New Arrivals */}
      <ProductRow
        title="New Arrivals"
        params={{ sortBy: "createdAt", sortOrder: "desc" }}
        seeAllHref="/products?sortBy=createdAt&sortOrder=desc"
      />
    </div>
  );
}
