import { T } from "@/components/common/Translation";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/common/Pagination";
import OrderCard from "@/components/account/OrderCard";
import { useOrders } from "@/hooks/useOrders";
import { useCart } from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

export default function Orders() {
  useDocumentTitle("Your Orders");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("ALL");
  const [buyingAgainId, setBuyingAgainId] = useState(null);

  const status = activeTab === "ALL" ? undefined : activeTab === "IN_PROGRESS" ? "PENDING,CONFIRMED,PROCESSING,SHIPPED" : activeTab;
  const { data, isLoading, error, refetch } = useOrders({ page, limit: 10, status });
  const { addItem } = useCart();

  const orders = data?.orders || [];
  const pagination = data?.pagination || { totalPages: 1 };

  const handleBuyAgain = async (item) => {
    setBuyingAgainId(item.id);
    await addItem(item.product.id, 1, item.product.name);
    setBuyingAgainId(null);
  };

  return (
    <div className="min-h-screen bg-[#EAEDED] py-6 sm:py-8">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#565959]">
          <Link to="/account/profile" className="hover:text-[#C7511F] hover:underline">
            <T>{"Your Account"}</T>
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0F1111] font-semibold"><T>{"Your Orders"}</T></span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1111]"><T>{"Your Orders"}</T></h1>
          <p className="text-sm text-[#565959] mt-0.5">
            Review past orders, download invoices, track packages, and re-order
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#D5D9D9] overflow-x-auto pb-px">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "IN_PROGRESS", label: "In Progress" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-[#FF9900] text-[#0F1111]"
                  : "border-transparent text-[#565959] hover:text-[#0F1111]"
              )}
            >
              <T>{tab.label}</T>
            </button>
          ))}
        </div>

        {/* Orders List */}
        {error ? (
          <div id="orders-error" role="alert" className="bg-white p-8 space-y-3">
            <p>Could not load your orders. Please try again.</p>
            <Button onClick={() => refetch()}><T>{"Try again"}</T></Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-[#EDEDED] p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#EDEDED] p-12 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#888C8C]">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F1111]">No orders found</h2>
              <p className="text-xs text-[#565959] mt-1 max-w-sm mx-auto">
                {activeTab === "ALL"
                  ? "You haven't placed any orders yet. Discover today's deals."
                  : `You don't have any orders categorized under "${activeTab.toLowerCase().replace('_', ' ')}".`}
              </p>
            </div>
            <Button asChild className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs">
              <Link to="/products"><T>{"Start Shopping"}</T></Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onBuyAgain={handleBuyAgain}
                isBuyingAgainId={buyingAgainId}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
