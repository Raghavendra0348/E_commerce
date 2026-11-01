import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, Package, MapPin, Clock } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import api from "@/api/axios";
import { paymentLabel } from "@/lib/orderPayment";

export default function OrderSuccess() {
  const { id } = useParams();

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return res.data?.data || null;
    },
    enabled: !!id,
  });

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
  const deliveryStr = estimatedDelivery.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return <div id="order-confirmation-error" role="alert" className="mx-auto max-w-2xl p-8 space-y-4">
      <h1 className="text-xl font-bold">Unable to load this order</h1>
      <p>We could not confirm the order status. Check your orders before placing another order.</p>
      <Button onClick={() => refetch()}><T>{"Try again"}</T></Button>
      <Link to="/account/orders" className="block text-[#007185]"><T>{"View My Orders"}</T></Link>
    </div>;
  }

  if (!["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)) {
    return <div id="order-confirmation-status" className="mx-auto max-w-2xl p-8 space-y-4">
      <h1 className="text-xl font-bold">{order.status === "CANCELLED" ? "Order cancelled" : "Order awaiting confirmation"}</h1>
      <p>{paymentLabel(order)}</p>
      <Button asChild><Link to={`/account/orders/${order.id}`}><T>{"View order details"}</T></Link></Button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#EAEDED] py-8">
      <div className="mx-auto max-w-2xl px-4 space-y-5">

        {/* Success Card */}
        <div className="bg-white rounded-lg border border-[#EDEDED] p-8 text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-[#E6F5F0] p-4">
              <CheckCircle className="h-12 w-12 text-[#067D62]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1111]"><T>{"Order Placed Successfully!"}</T></h1>
          <p className="text-[#565959] text-sm">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          {order && (
            <div className="inline-block bg-[#F5F5F5] rounded px-4 py-2 mt-2">
              <p className="text-sm text-[#565959]">Order ID</p>
              <p className="font-mono font-bold text-[#0F1111]">#{order.id}</p>
            </div>
          )}
        </div>

        {/* Delivery estimate */}
        <div className="bg-white rounded-lg border border-[#EDEDED] p-5 flex items-start gap-4">
          <Clock className="h-6 w-6 text-[#FF9900] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#0F1111]">
              Estimated Delivery: {deliveryStr}
            </p>
            <p className="text-sm text-[#565959] mt-0.5">
              {paymentLabel(order)}
            </p>
          </div>
        </div>

        {/* Order items */}
        {order?.items?.length > 0 && (
          <div className="bg-white rounded-lg border border-[#EDEDED] p-5">
            <h2 className="font-semibold text-[#0F1111] mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#FF9900]" />
              Items in Your Order
            </h2>
            <ul className="divide-y divide-[#EDEDED]">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <ProductImage
                    src={item.product?.images?.[0]?.url || item.product?.imageUrl || "/product-placeholder.svg"}
                    alt={item.product?.name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg"; }}
                    className="h-16 w-16 rounded border border-[#EDEDED] object-contain bg-white p-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F1111] line-clamp-2">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-[#565959] mt-0.5">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-1">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Separator className="my-3" />

            <div className="flex justify-between text-sm font-semibold">
              <span>Order Total</span>
              <span className="text-lg">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Shipping address */}
        {order?.shippingAddress && (
          <div className="bg-white rounded-lg border border-[#EDEDED] p-5">
            <h2 className="font-semibold text-[#0F1111] mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF9900]" />
              Shipping Address
            </h2>
            <div className="text-sm text-[#565959] space-y-0.5">
              <p className="font-medium text-[#0F1111]">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link to="/account/orders"><T>{"View My Orders"}</T></Link>
          </Button>
          <Button variant="secondary" asChild className="flex-1">
            <Link to="/products"><T>{"Continue Shopping"}</T></Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
