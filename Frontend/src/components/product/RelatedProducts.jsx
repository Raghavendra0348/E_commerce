import ProductCard from "@/components/product/ProductCard";

export default function RelatedProducts({
  products = [],
  title = "Customers also viewed",
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-8 bg-white rounded-lg border border-[#EDEDED] p-6 shadow-xs">
      <h2 className="text-lg font-bold text-[#0F1111] mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {products.map((prod) => (
          <div key={prod.id} className="w-48 shrink-0">
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
}
