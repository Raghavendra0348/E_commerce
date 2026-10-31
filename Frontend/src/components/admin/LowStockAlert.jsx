import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

export default function LowStockAlert({ lowStock = [], isLoading = false }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#FFF8E7] text-[#B7791F]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F1111]">Low Stock Inventory Alerts</h2>
            <p className="text-xs text-[#565959]">Products with 10 or fewer units remaining</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="text-xs">
          <Link to="/admin/products">
            Inventory Manager <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : lowStock.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#565959] bg-gray-50 rounded-lg">
          ✅ All products currently maintain healthy inventory levels (&gt;10 units in stock).
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F0F2F2] text-[#565959] uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock Left</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lowStock.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#0F1111] max-w-xs truncate">
                    {prod.name}
                  </td>
                  <td className="px-4 py-3 text-[#565959]">
                    {prod.category?.name || "Uncategorized"}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#0F1111]">
                    {formatPrice(prod.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        prod.stock <= 3
                          ? "bg-[#FCE8EC] text-[#CC0C39]"
                          : "bg-[#FFF8E7] text-[#B7791F]"
                      }`}
                    >
                      {prod.stock === 0 ? "Out of Stock" : `${prod.stock} units`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                      <Link to="/admin/products">Restock</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
