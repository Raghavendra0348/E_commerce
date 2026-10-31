import { useState, useRef } from "react";
import { toast } from "sonner";
import { ShieldCheck, CreditCard, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orderService, paymentService } from "@/services";
import { formatPrice } from "@/lib/utils";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentButton({
  addressId,
  paymentMethod = "ONLINE",
  user,
  amount = 0,
  onSuccess,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const pendingOrder = useRef(null);
  const attemptInProgress = useRef(false);

  const handlePlaceOrder = async () => {
    if (!addressId) {
      toast.error("Please select a delivery address");
      return;
    }

    if (attemptInProgress.current) return;
    attemptInProgress.current = true;
    setLoading(true);

    try {
      // 1. Place order in backend transaction
      let order = pendingOrder.current?.order;
      if (order && (pendingOrder.current.addressId !== addressId || pendingOrder.current.paymentMethod !== paymentMethod)) {
        throw new Error("An order was already created. Open your orders to review it before changing checkout details.");
      }
      if (!order) {
        const orderRes = await orderService.placeOrder({ addressId, paymentMethod });
        order = orderRes.data?.data;
        if (order) pendingOrder.current = { order, addressId, paymentMethod };
      }
      if (!order) {
        throw new Error("Order creation failed");
      }

      // If COD, we are done! Order is placed directly.
      if (paymentMethod === "COD") {
        toast.success("Order placed successfully with Cash on Delivery!");
        if (onSuccess) onSuccess(order.id);
        attemptInProgress.current = false;
        setLoading(false);
        return;
      }

      // 2. If ONLINE, initiate Razorpay order
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const rzpOrderRes = await paymentService.createOrder(order.id);
      const rzpData = rzpOrderRes.data?.data;

      const razorpayKey =
        rzpData?.key || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey || !rzpData?.razorpayOrderId || !Number.isFinite(Number(rzpData.amount)) || Number(rzpData.amount) <= 0) {
        throw new Error("Payment setup is incomplete. Please try again from your order details.");
      }

      const options = {
        key: razorpayKey,
        amount: rzpData.amount, // in paise
        currency: rzpData.currency || "INR",
        name: "Amazon India Clone",
        description: `Payment for Order #${order.id}`,
        order_id: rzpData.razorpayOrderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#FF9900",
        },
        handler: async (response) => {
          try {
            if (response.razorpay_order_id !== rzpData.razorpayOrderId || !response.razorpay_payment_id || !response.razorpay_signature) {
              throw new Error("Payment response is incomplete or does not match your order. Check your order status before paying again.");
            }
            // Verify HMAC signature in backend
            await paymentService.verify({
              orderId: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment verified! Order placed successfully.");
            if (onSuccess) onSuccess(order.id);
          } catch (verifyErr) {
            toast.error(
              verifyErr.response?.data?.message || verifyErr.message || "Payment verification failed"
            );
            if (onError) onError(verifyErr);
          } finally {
            attemptInProgress.current = false;
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment window closed. Order remains pending.");
            attemptInProgress.current = false;
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", (failedRes) => {
        toast.error(
          failedRes.error?.description || "Payment failed. Please try again."
        );
        attemptInProgress.current = false;
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Checkout failed");
      if (onError) onError(err);
      attemptInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      disabled={loading || !addressId}
      onClick={handlePlaceOrder}
      className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-sm shadow-xs border border-[#FCD200]"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#0F1111]" />
          Processing Order...
        </span>
      ) : paymentMethod === "COD" ? (
        <span className="flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          Place Order with Cash on Delivery ({formatPrice(amount)})
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Pay & Place Order ({formatPrice(amount)})
        </span>
      )}
    </Button>
  );
}
