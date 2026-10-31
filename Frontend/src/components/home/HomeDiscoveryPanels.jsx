import { useState } from "react";
import { Link } from "react-router-dom";
import { Tag, Shirt, Armchair, Headphones, Package, ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const panels = [
  { id: "value", title: "Discover everyday favourites", subtitle: "Small finds. Plenty to explore.", icon: Tag, link: "Explore all products", tone: "peach" },
  { id: "fashion", title: "Refresh your everyday style", subtitle: "Find your next wardrobe favourite.", icon: Shirt, link: "Explore fashion", tone: "rose" },
  { id: "furniture", title: "Make yourself at home", subtitle: "Thoughtful finds for your space.", icon: Armchair, link: "Shop furniture", tone: "sage" },
  { id: "audio", title: "Tune into something new", subtitle: "For your desk, downtime and beyond.", icon: Headphones, link: "Discover audio", tone: "blue" },
];

function DiscoveryTile({ product, Icon }) {
  const [failed, setFailed] = useState(false);
  const first = product.images?.[0];
  const raw = (typeof first === "string" ? first : first?.url) || product.imageUrl;
  const isPlaceholder = !raw || /placehold|placeholder/i.test(raw);
  const src = raw?.startsWith("/uploads/") ? `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000"}${raw}` : raw;
  return (
    <Link id={`discovery-product-${product.id}`} to={`/products/${product.slug}`} className="discovery-tile">
      <div className="discovery-tile-image">
        {!isPlaceholder && !failed ? <img src={src} alt={product.name} loading="lazy" onError={() => setFailed(true)} /> : <div className="discovery-image-fallback"><Icon strokeWidth={1.2} aria-hidden="true" /><span>Images coming soon</span></div>}
      </div>
      <span className="discovery-product-name">{product.name}</span>
      <span className="discovery-product-price">{formatPrice(product.price)}</span>
    </Link>
  );
}

function DiscoveryPanel({ panel, categories, categoriesLoading, categoriesError }) {
  const category = categories.find(item => item.slug === panel.id);
  const isGeneral = panel.id === "value";
  const { data, isLoading, isError, refetch } = useProducts({ limit: 4, ...(category ? { categoryId: category.id } : {}), sortBy: "price", sortOrder: "asc" });
  const unavailable = !isGeneral && !category;
  const loading = isLoading || (!isGeneral && categoriesLoading);
  const error = isError || (!isGeneral && categoriesError);
  const products = unavailable ? [] : data?.products || [];
  const href = category ? `/products?categoryId=${category.id}` : "/products?sortBy=price&sortOrder=asc";
  return (
    <article id={`discovery-panel-${panel.id}`} className={`discovery-panel discovery-tone-${panel.tone}`}>
      <div className="discovery-heading"><h2>{panel.title}</h2><p>{panel.subtitle}</p></div>
      <div className="discovery-products">
        {loading ? [0, 1, 2, 3].map(i => <div key={i} className="discovery-skeleton"><Skeleton className="aspect-[1.35] w-full rounded-sm" /><Skeleton className="h-3 w-full mt-2" /><Skeleton className="h-3 w-14 mt-2" /></div>) : products.map(product => <DiscoveryTile key={product.id} product={product} Icon={panel.icon} />)}
      </div>
      {error && <div className="discovery-message">We couldn't load these finds. <Button variant="link" size="xs" onClick={() => refetch()}>Retry products</Button></div>}
      {!loading && !error && products.length === 0 && <div className="discovery-message"><Package size={24} aria-hidden="true" /><p>More finds are on the way.</p></div>}
      <Link to={href} className="discovery-shop-link">{panel.link}<ArrowRight size={14} aria-hidden="true" /></Link>
    </article>
  );
}

export default function HomeDiscoveryPanels() {
  const { data: categories = [], isLoading, isError } = useCategories();
  return <section id="home-discovery" className="discovery-grid" aria-label="Shop curated collections">{panels.map(panel => <DiscoveryPanel key={panel.id} panel={panel} categories={categories} categoriesLoading={isLoading} categoriesError={isError} />)}</section>;
}
