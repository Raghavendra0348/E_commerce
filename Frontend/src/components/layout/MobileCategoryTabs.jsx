import { Link, useLocation } from "react-router-dom";
import { Sparkles, Laptop, Smartphone, Tv, Shirt, Lamp, Armchair, Headphones, Gamepad2, BookOpen, Dumbbell, Car, Briefcase, Luggage, Watch, Grid2X2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const featured = [
  { slug: "electronics", label: "Electronics", icon: Laptop },
  { slug: "mobiles-accessories", label: "Mobiles", icon: Smartphone },
  { slug: "home-appliances", label: "Appliances", icon: Tv },
  { slug: "fashion", label: "Fashion", icon: Shirt },
  { slug: "home-kitchen", label: "Home", icon: Lamp },
  { slug: "furniture", label: "Furniture", icon: Armchair },
];
const icons = { audio: Headphones, gaming: Gamepad2, books: BookOpen, "sports-fitness": Dumbbell, automotive: Car, "office-products": Briefcase, "bags-luggage": Luggage, wearables: Watch, "computers-accessories": Laptop };

export default function MobileCategoryTabs({ categories = [] }) {
  const { pathname, search } = useLocation();
  const selected = new URLSearchParams(search).get("categoryId");
  const { t } = useTranslation();
  const ordered = featured.flatMap(item => {
    const category = categories.find(category => category.slug === item.slug);
    return category ? [{ ...category, label: item.label, icon: item.icon }] : [];
  });
  const rest = categories.filter(category => !featured.some(item => item.slug === category.slug)).map(category => ({ ...category, label: category.name, icon: icons[category.slug] || Grid2X2 }));
  return <div id="mobile-category-tabs" className="mobile-category-tabs" aria-label="Shop by category">
    <Link to="/" className={`mobile-category-tab ${pathname === "/" ? "is-active" : ""}`} aria-current={pathname === "/" ? "page" : undefined}><Sparkles aria-hidden="true" strokeWidth={1.5} /><span>{t("For you")}</span></Link>
    {[...ordered, ...rest].map(({ id, label, icon: Icon }) => <Link key={id} to={`/products?categoryId=${id}`} className={`mobile-category-tab ${selected === String(id) ? "is-active" : ""}`} aria-current={selected === String(id) ? "page" : undefined}><Icon aria-hidden="true" strokeWidth={1.5} /><span>{t(label)}</span></Link>)}
    {!categories.length && <Link to="/products" className="mobile-category-tab"><Grid2X2 aria-hidden="true" strokeWidth={1.5} /><span>{t("All products")}</span></Link>}
  </div>;
}
