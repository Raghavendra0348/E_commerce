import { T } from "../components/common/Translation";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import Pagination from "../components/common/Pagination";
import OrderCard from "../components/account/OrderCard";
import { useOrders } from "../hooks/useOrders";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { cn } from "../lib/utils";
import "../styles/orders.css";

const dateFromMonths = months => {
  if (!months) return undefined;
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
};

export default function Orders() {
  useDocumentTitle("Your Orders");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("ORDERS");
  const [buyingAgainId, setBuyingAgainId] = useState(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("3m");

  const status = activeTab === "NOT_SHIPPED" ? "PENDING,CONFIRMED,PROCESSING" : undefined;
  const dateFrom = useMemo(() => dateRange === "3m" ? dateFromMonths(3)
    : dateRange === "6m" ? dateFromMonths(6)
      : dateRange === "12m" ? dateFromMonths(12) : undefined, [dateRange]);
  const { data, isLoading, error, refetch } = useOrders({ page, limit: 10, status, dateFrom, search: searchTerm || undefined });
  const { addItem } = useCart();

  const orders = data?.orders || [];
  const visibleOrders = useMemo(() => activeTab === "BUY_AGAIN"
    ? orders.filter(order => order.items?.some(item => item.product?.id && item.product?.slug))
    : orders, [activeTab, orders]);
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const handleSearch = event => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchDraft.trim());
  };
  const handleTabChange = tab => {
    setActiveTab(tab);
    setPage(1);
  };
  const handleBuyAgain = async item => {
    setBuyingAgainId(item.id);
    try { await addItem(item.product.id, 1, item.product.name); }
    finally { setBuyingAgainId(null); }
  };

  return (
    <main id="orders-page" className="orders-page">
      <div className="orders-container">
        <nav aria-label="Breadcrumb" className="orders-breadcrumb">
          <Link to="/account/profile"><T>{"Your Account"}</T></Link>
          <ChevronRight aria-hidden="true" />
          <span><T>{"Your Orders"}</T></span>
        </nav>

        <div className="orders-heading-row">
          <h1><T>{"Your Orders"}</T></h1>
          <form className="orders-search" role="search" onSubmit={handleSearch}>
            <label className="orders-search-field">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={searchDraft}
                onChange={event => setSearchDraft(event.target.value)}
                placeholder="Search all orders"
                aria-label="Search all orders"
                maxLength={100}
              />
            </label>
            <Button type="submit" className="orders-search-button"><T>{"Search Orders"}</T></Button>
          </form>
        </div>

        <div className="orders-tabs" role="tablist" aria-label="Order views">
          {[
            { id: "ORDERS", label: "Orders" },
            { id: "BUY_AGAIN", label: "Buy Again" },
            { id: "NOT_SHIPPED", label: "Not Yet Shipped" },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn("orders-tab", activeTab === tab.id && "orders-tab-active")}
              onClick={() => handleTabChange(tab.id)}
            ><T>{tab.label}</T></button>
          ))}
        </div>

        <div className="orders-filter-row">
          <p><strong>{pagination.total || 0} orders</strong> placed in</p>
          <select
            aria-label="Order date range"
            value={dateRange}
            onChange={event => { setDateRange(event.target.value); setPage(1); }}
          >
            <option value="3m">past 3 months</option>
            <option value="6m">past 6 months</option>
            <option value="12m">past year</option>
            <option value="all">all orders</option>
          </select>
          {searchTerm && <button type="button" className="orders-clear-search" onClick={() => { setSearchDraft(""); setSearchTerm(""); setPage(1); }}>Clear search</button>}
        </div>

        {error ? (
          <div id="orders-error" role="alert" className="orders-message">
            <p>Could not load your orders. Please try again.</p>
            <Button onClick={() => refetch()}><T>{"Try again"}</T></Button>
          </div>
        ) : isLoading ? (
          <div className="orders-list" aria-label="Loading orders" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="orders-loading-card">
                <div className="orders-loading-header"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-48" /></div>
                <div className="orders-loading-body"><Skeleton className="h-32 w-32 rounded-md" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-48" /></div></div>
              </div>
            ))}
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="orders-message">
            <Package aria-hidden="true" />
            <h2>{searchTerm ? "No matching orders" : activeTab === "BUY_AGAIN" ? "No products available to buy again" : "No orders found"}</h2>
            <p>{searchTerm ? "Try another order number or product name." : "Try a different date range, or explore the catalog."}</p>
            <Button asChild><Link to="/products"><T>{"Start Shopping"}</T></Link></Button>
          </div>
        ) : (
          <div className="orders-list">
            {visibleOrders.map(order => (
              <OrderCard key={order.id} order={order} onBuyAgain={handleBuyAgain} isBuyingAgainId={buyingAgainId} />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </main>
  );
}
