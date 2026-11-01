import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import { Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, cn } from "@/lib/utils";

export default function ProductTable({
  products = [],
  isLoading = false,
  onEdit,
  onDelete,
}) {
  const getProductImage = (prod) => {
    const rawUrl =
      prod.images?.[0]?.url || prod.imageUrl || "/product-placeholder.svg";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs py-12 text-center text-xs text-[#565959]">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="font-semibold text-sm text-[#0F1111]">No products found</p>
        <p className="mt-1">Try adjusting your search or category filter</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto" role="region" aria-label="Product inventory, scroll horizontally for more columns" tabIndex={0}>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F0F2F2] text-[#565959] uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3"><T>{"Category"}</T></th>
              <th className="px-4 py-3"><T>{"Price"}</T></th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((prod) => (
              <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      src={getProductImage(prod)}
                      alt={prod.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg";
                      }}
                      className="h-10 w-10 rounded border border-gray-200 object-contain bg-white p-0.5 shrink-0"
                    />
                    <div className="min-w-0 max-w-xs">
                      <p className="font-semibold text-[#0F1111] truncate">{prod.name}</p>
                      <span className="text-[10px] text-gray-400 font-mono">ID #{prod.id}</span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-[#565959]">
                  {prod.category?.name || "—"}
                </td>

                <td className="px-4 py-3 font-semibold text-[#0F1111]">
                  {formatPrice(prod.price)}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded text-[11px] font-bold",
                      prod.stock === 0
                        ? "bg-[#FCE8EC] text-[#CC0C39]"
                        : prod.stock <= 5
                        ? "bg-[#FFF8E7] text-[#B7791F]"
                        : "bg-[#E6F5F0] text-[#067D62]"
                    )}
                  >
                    {prod.stock} in stock
                  </span>
                </td>

                <td className="px-4 py-3 text-[#565959]">
                  ★ {prod.avgRating ? Number(prod.avgRating).toFixed(1) : "0.0"} ({prod.reviewCount || 0})
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(prod)}
                      className="h-7 w-7 p-0 text-gray-600 hover:text-[#0F1111]"
                      title="Edit Product"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(prod)}
                      className="h-7 w-7 p-0 text-[#CC0C39] hover:text-[#A00A2D] hover:bg-[#CC0C39]/10"
                      title="Delete Product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
