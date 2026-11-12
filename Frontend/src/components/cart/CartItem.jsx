import { T } from "../common/Translation";
import ProductImage from "../common/ProductImage";
import PriceDisplay from "../common/PriceDisplay";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { formatPrice, cn } from "../../lib/utils";

export default function CartItem({ item, onQuantityChange, onRemove, busy = false, compact = false, selected = true, onSelectionChange }) {
  const product = item.product || {};
  const productId = item.productId ?? product.id;
  const outOfStock = product.stock <= 0;
  const first = product.images?.[0];
  const raw = (typeof first === "string" ? first : first?.url) || product.imageUrl || "/product-placeholder.svg";
  const image = raw.startsWith("/uploads/") ? `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000"}${raw}` : raw;
  return (
    <li id={`cart-item-${compact ? "drawer-" : ""}${item.id}`} className={cn("amazon-cart-item", compact && "amazon-cart-item-compact", busy && "opacity-50")} aria-busy={busy}>
      <div className="amazon-cart-image-wrap relative">
        {onSelectionChange && <input type="checkbox" aria-label={`Select ${product.name} for checkout`} checked={selected} onChange={event => onSelectionChange(item.id, event.target.checked)} className="absolute top-0 left-0 z-10 h-5 w-5 accent-[#007185] cursor-pointer" />}
      <Link to={`/products/${product.slug}`} className="amazon-cart-image">
        <ProductImage src={image} alt={product.name || "Product"} loading="lazy" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg"; }} />
      </Link>
      </div>
      <div className="amazon-cart-details">
        <Link to={`/products/${product.slug}`} className="amazon-cart-product-title">{product.name}</Link>
        <p className={cn("amazon-cart-stock", outOfStock ? "text-[#b12704]" : "text-[#007600]")}><T>{outOfStock ? "Currently unavailable" : product.stock <= 5 ? `Only ${product.stock} left in stock` : "In stock"}</T></p>
        {product.category?.name && <p className="amazon-cart-category">{product.category.name}</p>}
        <p className="amazon-cart-unit-price">{formatPrice(product.price)} each</p>
        {!compact && (
          <div className="amazon-cart-product-info">
            {product.description && <p className="amazon-cart-description">{product.description}</p>}
            <dl className="amazon-cart-facts">
              <div><dt>Quantity</dt><dd>{item.quantity} {item.quantity === 1 ? "unit" : "units"}</dd></div>
              <div><dt>Item subtotal</dt><dd>{formatPrice(Number(product.price) * item.quantity)}</dd></div>
            </dl>
          </div>
        )}
        <div className="amazon-cart-item-actions">
          <div className="amazon-cart-quantity" role="group" aria-label={`Quantity for ${product.name}`}>
            <Button variant="ghost" size="icon" onClick={() => onQuantityChange(productId, item.quantity - 1)} disabled={item.quantity <= 1 || busy || outOfStock} aria-label={`Decrease quantity of ${product.name}`}><Minus size={14} /></Button>
            <span aria-live="polite">{item.quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => onQuantityChange(productId, item.quantity + 1)} disabled={busy || outOfStock || item.quantity >= product.stock} aria-label={`Increase quantity of ${product.name}`}><Plus size={14} /></Button>
          </div>
          <Button variant="link" size="xs" className="amazon-cart-delete" onClick={() => onRemove(productId)} disabled={busy} aria-label={`Delete ${product.name} from cart`}><T>{"Delete"}</T></Button>
          {!compact && <Link to={`/products/${product.slug}`} className="amazon-cart-detail-link">View details</Link>}
        </div>
      </div>
      <div className="amazon-cart-line-price">
        {compact ? formatPrice(Number(product.price) * item.quantity) : (
          <PriceDisplay price={product.price} mrp={product.originalPrice} discountPercent={product.discountPercent} size="lg" />
        )}
        {!compact && item.quantity > 1 && <span className="amazon-cart-line-total">Item total: {formatPrice(Number(product.price) * item.quantity)}</span>}
      </div>
    </li>
  );
}

