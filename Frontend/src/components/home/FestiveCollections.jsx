import { T } from "@/components/common/Translation";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import ProductImage from "@/components/common/ProductImage";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const collections = [
  { slug: "home-kitchen", title: "Festive finds | Make yourself at home", search: "home" },
  { slug: "fashion", title: "Fashion & accessories | Celebrate in style", search: "fashion" },
  { slug: "office-products", title: "Work essentials | Everyday favourites", search: "office" },
  { slug: "beauty-personal-care", title: "Beauty & grooming | Upgrade your routine", search: "beauty" },
];

function FestiveCollection({ collection, category, categoriesLoading, categoriesError, retryCategories }) {
  // Share existing homepage queries rather than issuing a request per tile.
  const { data, isLoading, isError, refetch } = useProducts(
    { limit: 4, ...(category ? { categoryId: category.id } : {}), sortBy: "price", sortOrder: "asc" },
    { enabled: !!category }
  );
  const products = category ? data?.products || [] : [];
  const loading = categoriesLoading || (!!category && isLoading);
  const error = categoriesError || isError;
  const href = category ? `/products?categoryId=${category.id}` : `/products?search=${encodeURIComponent(collection.search)}`;

  return (
    <article id={`festive-collection-${collection.slug}`} className="festive-collection">
      <Link to={href} className="festive-collection-heading">
        <h2><T>{collection.title}</T></h2>
        <ChevronRight aria-hidden="true" strokeWidth={1.8} />
      </Link>
      {loading ? (
        <div className="festive-collection-tiles" aria-label={`Loading ${collection.title}`} aria-busy="true">
          {[0, 1, 2, 3].map(index => <div key={index}><Skeleton className="aspect-square rounded-xl bg-white/40" /><Skeleton className="mt-2 h-4 w-4/5 bg-white/40" /></div>)}
        </div>
      ) : error ? (
        <div className="festive-collection-message" role="alert">
          <p>These finds could not be loaded.</p>
          <Button variant="outline" size="sm" onClick={() => categoriesError ? retryCategories() : refetch()}><T>{"Try again"}</T></Button>
        </div>
      ) : products.length ? (
        <div className="festive-collection-tiles">
          {products.map(product => (
            <Link key={product.id} to={`/products/${product.slug}`} className="festive-collection-tile" title={product.name}>
              <div className="festive-collection-image">
                <ProductImage src={product.images?.[0]?.url || product.imageUrl} alt={product.name} loading="lazy" />
                <span className="festive-collection-price">{formatPrice(product.price)}</span>
              </div>
              <span className="festive-collection-label">{product.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="festive-collection-message"><p>New finds are on their way.</p><Link to={href}>Explore the collection <span aria-hidden="true">→</span></Link></div>
      )}
    </article>
  );
}

export default function FestiveCollections() {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();
  return (
    <section id="home-festive-collections" className="festive-collections" aria-label="Festive shopping collections">
      {collections.map(collection => (
        <FestiveCollection key={collection.slug} collection={collection} category={categories.find(category => category.slug === collection.slug)} categoriesLoading={isLoading} categoriesError={isError} retryCategories={refetch} />
      ))}
    </section>
  );
}
