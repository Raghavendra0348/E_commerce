import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";

export default function CartItem({ item, onQuantityChange, onRemove, busy = false, compact = false }) {
  const product = item.product || {};
  const outOfStock = product.stock <= 0;
  const first = product.images?.[0];
  const raw = (typeof first === "string" ? first : first?.url) || product.imageUrl || "/product-placeholder.svg";
  const image = raw.startsWith("/uploads/") ? `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000"}${raw}` : raw;
  return (
    <li id={`cart-item-${compact ? "drawer-" : ""}${item.id}`} className={cn("amazon-cart-item", compact && "amazon-cart-item-compact", busy && "opacity-50")} aria-busy={busy}>
      <Link to={`/products/${product.slug}`} className="amazon-cart-image">
        <ProductImage src={image} alt={product.name || "Product"} loading="lazy" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg"; }} />
      </Link>
      <div className="amazon-cart-details">
        <Link to={`/products/${product.slug}`} className="amazon-cart-product-title">{product.name}</Link>
        <p className={cn("amazon-cart-stock", outOfStock ? "text-[#b12704]" : "text-[#007600]")}><T>{outOfStock ? "Currently unavailable" : product.stock <= 5 ? `Only ${product.stock} left in stock` : "In stock"}</T></p>
        {product.category?.name && <p className="amazon-cart-category">{product.category.name}</p>}
        <p className="amazon-cart-unit-price">{formatPrice(product.price)} each</p>
        <div className="amazon-cart-item-actions">
          <div className="amazon-cart-quantity" role="group" aria-label={`Quantity for ${product.name}`}>
            <Button variant="ghost" size="icon" onClick={() => onQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || busy || outOfStock} aria-label={`Decrease quantity of ${product.name}`}><Minus size={14} /></Button>
            <span aria-live="polite">{item.quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => onQuantityChange(item.id, item.quantity + 1)} disabled={busy || outOfStock || item.quantity >= product.stock} aria-label={`Increase quantity of ${product.name}`}><Plus size={14} /></Button>
          </div>
          <Button variant="link" size="xs" className="amazon-cart-delete" onClick={() => onRemove(item.id)} disabled={busy} aria-label={`Delete ${product.name} from cart`}><T>{"Delete"}</T></Button>
          {!compact && <Link to={`/products/${product.slug}`} className="amazon-cart-detail-link">View details</Link>}
        </div>
      </div>
      <div className="amazon-cart-line-price">{formatPrice(Number(product.price) * item.quantity)}</div>
    </li>
  );
}

