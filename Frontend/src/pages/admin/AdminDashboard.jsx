import { T } from "@/components/common/Translation";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services";
import { formatPrice } from "@/lib/utils";
import StatCard from "@/components/admin/StatCard";
import LowStockAlert from "@/components/admin/LowStockAlert";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AdminDashboard() {
  useDocumentTitle("Admin Dashboard");
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await adminService.getStats();
      return res.data?.data || {};
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: lowStock = [], isLoading: stockLoading } = useQuery({
    queryKey: ["adminLowStock"],
    queryFn: async () => {
      const res = await adminService.getLowStock();
      return res.data?.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const statCards = [
    {
      label: "Total Revenue (Paid)",
      value: stats?.totalRevenue ? formatPrice(stats.totalRevenue) : "₹0.00",
      icon: IndianRupee,
      color: "text-[#067D62]",
      bgColor: "bg-[#E6F5F0]",
      subtext: "From verified paid orders",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? "—",
      icon: ShoppingBag,
      color: "text-[#2B6CB0]",
      bgColor: "bg-[#EBF8FF]",
      subtext: "Across all pipelines",
    },
    {
      label: "Total Products",
      value: stats?.totalProducts ?? "—",
      icon: Package,
      color: "text-[#FF9900]",
      bgColor: "bg-[#FFF8E7]",
      subtext: "In active catalog",
    },
    {
      label: "Registered Users",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      color: "text-[#6B46C1]",
      bgColor: "bg-[#FAF5FF]",
      subtext: "Customer accounts",
    },
  ];

  const statusMap = [
    { key: "PENDING", label: "Pending", color: "bg-[#FFF8E7] text-[#B7791F] border-[#F6E05E]" },
    { key: "CONFIRMED", label: "Confirmed", color: "bg-[#EBF8FF] text-[#2B6CB0] border-[#90CDF4]" },
    { key: "PROCESSING", label: "Processing", color: "bg-[#FAF5FF] text-[#6B46C1] border-[#D6BCFA]" },
    { key: "SHIPPED", label: "Shipped", color: "bg-[#E6FFFA] text-[#234E52] border-[#81E6D9]" },
    { key: "DELIVERED", label: "Delivered", color: "bg-[#E6F5F0] text-[#067D62] border-[#A7F3D0]" },
    { key: "CANCELLED", label: "Cancelled", color: "bg-[#FCE8EC] text-[#CC0C39] border-[#FEB2B2]" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1111]">Dashboard Overview</h1>
          <p className="text-xs text-[#565959] mt-0.5">
            Real-time business performance and catalog health metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchStats()}
          className="text-xs self-start sm:self-auto border-gray-300 hover:bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Stats
        </Button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={i}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            bgColor={card.bgColor}
            subtext={card.subtext}
            isLoading={statsLoading}
          />
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0F1111]">Order Pipeline Status</h2>
            <p className="text-xs text-[#565959] mt-0.5">Current order distribution across fulfillment stages</p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/admin/orders">
              Manage Orders <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {statusMap.map((st) => {
            const count = stats?.ordersByStatus?.[st.key] || 0;
            return (
              <div
                key={st.key}
                className="bg-gray-50/70 border border-gray-200 rounded-lg p-3 text-center space-y-1.5 hover:border-gray-300 transition-colors"
              >
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${st.color}`}
                >
                  <T>{st.label}</T>
                </span>
                <p className="text-xl font-bold text-[#0F1111]">
                  {statsLoading ? "—" : count}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low Stock Alerts & Inventory Health */}
      <LowStockAlert lowStock={lowStock} isLoading={stockLoading} />
    </div>
  );
}
