import { CartIcon, ProductCardParts as Card } from "./ProductCardParts";

export function StorefrontProductCard({ product }) {
  return <Card.Root product={product}>
    <Card.WishlistToggle />
    <Card.Image />
    <Card.Body>
      <Card.Details />
      <Card.Price />
      <Card.Stock />
      <Card.AddToCart><CartIcon /></Card.AddToCart>
    </Card.Body>
  </Card.Root>;
}

export function CatalogProductCard({ product }) {
  return <Card.Root product={product} className="catalog-product-card">
    <Card.WishlistToggle />
    <Card.Image />
    <Card.Body>
      <Card.Category />
      <Card.Details />
      <Card.Summary />
      <div className="product-card-purchase">
        <div className="product-card-purchase-meta">
          <Card.Price size="xl" />
          <Card.Availability />
        </div>
        <Card.Stock />
        <div className="product-card-actions">
          <Card.AddToCart variant="buynow" />
          <Card.BuyNow />
        </div>
      </div>
    </Card.Body>
  </Card.Root>;
}

export function WishlistProductCard({ product, onRemove, busy = false }) {
  return <Card.Root product={product}>
    <Card.WishlistRemove onRemove={onRemove} busy={busy} />
    <Card.Image />
    <Card.Body>
      <Card.Details />
      <Card.Price />
      <Card.Stock />
      <Card.AddToCart><CartIcon /></Card.AddToCart>
    </Card.Body>
  </Card.Root>;
}

// Compatibility for existing consumers; new layouts use explicit exports above.
export default function ProductCard({ product, variant = "default" }) {
  return variant === "catalog" ? <CatalogProductCard product={product} /> : <StorefrontProductCard product={product} />;
}
