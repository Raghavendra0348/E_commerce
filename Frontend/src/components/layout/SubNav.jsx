import { Link } from "react-router-dom";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useCategories } from "../../hooks/useCategories";
import MobileCategoryTabs from "./MobileCategoryTabs";

const shoppingCategories = [
  ["mobiles-accessories", "Mobiles"],
  ["electronics", "Electronics"],
  ["computers-accessories", "Computers"],
  ["fashion", "Fashion"],
  ["home-kitchen", "Home & Kitchen"],
  ["books", "Books"],
  ["audio", "Audio"],
  ["home-appliances", "Appliances"],
  ["gaming", "Gaming"],
];

export default function SubNav({ showMobileCategories = true, onBrowse }) {
  const { data: categories = [] } = useCategories();
  return (
    <nav id="storefront-category-nav" className="storefront-category-nav" data-mobile-visible={showMobileCategories} aria-label="Category navigation">
      {showMobileCategories && <MobileCategoryTabs categories={categories} />}
      <div className="desktop-category-links">
        <ul>
          <li>
            {onBrowse ? (
              <Button variant="navbar" className="subnav-all" onClick={onBrowse} aria-label="Browse all categories">
                <Menu size={19} aria-hidden="true" /> All
              </Button>
            ) : <Link to="/products" className="subnav-all"><Menu size={19} aria-hidden="true" /> All</Link>}
          </li>
          <li><Link to="/products?sortBy=price&sortOrder=asc">Today's Deals</Link></li>
          {shoppingCategories.map(([slug, label]) => {
            const category = categories.find(item => item.slug === slug);
            return <li key={slug}><Link to={category ? `/products?categoryId=${category.id}` : `/products?search=${encodeURIComponent(label)}`}>{label}</Link></li>;
          })}
          <li><Link to="/products?sortBy=createdAt&sortOrder=desc">New Arrivals</Link></li>
        </ul>
        <Link className="subnav-festival" to="/products"><Sparkles aria-hidden="true" /><span>Great Indian Festival</span></Link>
      </div>
    </nav>
  );
}
