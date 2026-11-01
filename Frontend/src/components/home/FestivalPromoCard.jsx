import { T } from "@/components/common/Translation";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import ProductImage from "@/components/common/ProductImage";
import { Skeleton } from "@/components/ui/skeleton";

export const EXTRA_FESTIVAL_CARDS = [
  { slug: "fashion", title: "Styles for every celebration", subtitle: "Everyday essentials & festive favourites", tone: "ruby", label: "Fashion finds" },
  { slug: "furniture", title: "A festive refresh for your home", subtitle: "Furniture that makes room for you", tone: "emerald", label: "Home favourites" },
  { slug: "gaming", title: "Level up your game", subtitle: "Controllers, keyboards & gaming gear", tone: "saffron", label: "Gaming essentials" },
  { slug: "beauty-personal-care", title: "Your festive glow starts here", subtitle: "Beauty, grooming & everyday self-care", tone: "berry", label: "Beauty & personal care" },
];

export default function FestivalPromoCard({ card }) {
  const { data: categories = [] } = useCategories();
  const category = categories.find(item => item.slug === card.slug);
  // Match discovery-panel query keys so shared category data stays cached.
  const { data, isLoading } = useProducts({ limit: 4, ...(category ? { categoryId: category.id } : {}), sortBy: "price", sortOrder: "asc" });
  const products = category ? (data?.products || []).slice(0, 3) : [];
  const href = category ? `/products?categoryId=${category.id}` : `/products?search=${encodeURIComponent(card.slug === "beauty-personal-care" ? "beauty" : card.slug)}`;
  return (
    <Link id={`festival-card-${card.slug}`} className={`festival-slide festival-promo-card festival-promo-${card.tone}`} to={href} aria-label={`Shop ${card.label}`}>
      <div className="festival-promo-copy">
        <h2><T>{card.title}</T></h2>
        <p><T>{card.subtitle}</T></p>
        <span className="festival-promo-eyebrow"><Sparkles size={14} aria-hidden="true" /><T>{card.label}</T></span>
      </div>
      <div className="festival-promo-products" aria-label={`${card.label} preview`}>
        {isLoading ? [0, 1, 2].map(index => <Skeleton key={index} className="festival-promo-product" />) : products.length ? products.map(product => <div className="festival-promo-product" key={product.id}><ProductImage src={product.images?.[0]?.url || product.imageUrl} alt={product.name} loading="lazy" /></div>) : <div className="festival-promo-empty"><Sparkles size={42} aria-hidden="true" /><span>Explore the collection</span></div>}
      </div>
      <div className="festival-promo-footer">
        <span className="festival-promo-cta">Shop now <ArrowRight size={16} aria-hidden="true" /></span>
        <strong>Great Indian Festival</strong>
        <span className="festival-promo-tagline">More to discover. More to celebrate.</span>
        <span className="festival-promo-bottom">Fresh finds for your festive wish list</span>
      </div>
    </Link>
  );
}
