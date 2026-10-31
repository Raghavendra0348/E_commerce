import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";
import { useCart } from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { addressService } from "@/services";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import AddressSelector from "@/components/checkout/AddressSelector";
import AddressForm from "@/components/checkout/AddressForm";
import OrderReview from "@/components/checkout/OrderReview";
import PaymentButton from "@/components/checkout/PaymentButton";
import { formatPrice, cn } from "@/lib/utils";

export default function Checkout() {
  useDocumentTitle("Amazon.in Checkout");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { cart, items, subtotal, itemCount, fetchCart } = useCart();

  const [currentStep, setCurrentStep] = useState(0); // 0 = Address, 1 = Payment, 2 = Review
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE"); // ONLINE or COD

  // Fetch saved addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await addressService.getAll();
      return res.data?.data || [];
    },
  });

  // Auto-select first address if available
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Handle saving new address directly in checkout
  const handleSaveNewAddress = async (formData) => {
    setSavingAddress(true);
    try {
      const res = await addressService.create(formData);
      const newAddress = res.data?.data;
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      if (newAddress?.id) {
        setSelectedAddressId(newAddress.id);
      }
      setShowAddressForm(false);
      toast.success("Delivery address saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // If cart is empty, redirect
  if (!items || items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#EAEDED] py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-[#0F1111]">Your cart is currently empty</h2>
          <p className="text-xs text-[#565959]">
            Add items to your cart before proceeding to checkout.
          </p>
          <Button
            asChild
            className="w-full bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
          >
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleOrderSuccess = async (orderId) => {
    await fetchCart();
    navigate(`/order-success/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      {/* Checkout Minimal Top Header */}
      <header className="bg-[#131921] text-white py-3 px-4 border-b border-white/10">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between">
          <Link to="/" className="flex items-center text-xl font-bold">
            amazon<span className="text-[#FF9900]">.in</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-300">
            <Lock className="h-3.5 w-3.5 text-[#067D62]" />
            <span className="font-semibold text-white">100% Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="bg-white border-b border-[#D5D9D9] shadow-2xs">
        <CheckoutStepper currentStep={currentStep} />
      </div>

      {/* Main Checkout Area */}
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Steps Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* ─── STEP 0: Address Selection ──────────────────────────────── */}
            {currentStep === 0 && (
              <div className="space-y-4">
                {showAddressForm ? (
                  <AddressForm
                    onSubmit={handleSaveNewAddress}
                    onCancel={() => setShowAddressForm(false)}
                    isSubmitting={savingAddress}
                  />
                ) : (
                  <AddressSelector
                    addresses={addresses}
                    selectedId={selectedAddressId}
                    onSelect={(id) => setSelectedAddressId(id)}
                    onAddNew={() => setShowAddressForm(true)}
                    onProceed={() => {
                      if (!selectedAddressId) {
                        toast.error("Please select a delivery address");
                        return;
                      }
                      setCurrentStep(1);
                    }}
                    isLoading={addressesLoading}
                  />
                )}

                {!showAddressForm && addresses.length > 0 && (
                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        if (!selectedAddressId) {
                          toast.error("Please select a delivery address");
                          return;
                        }
                        setCurrentStep(1);
                      }}
                      className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-xs border border-[#FCD200]"
                    >
                      Use this address & Continue
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 1: Payment Method ─────────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#D5D9D9]">
                  <h2 className="text-base font-bold text-[#0F1111] flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#FF9900]" />
                    Select a payment method
                  </h2>
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-0.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Change Address
                  </button>
                </div>

                {/* Selected Address Preview */}
                <div className="bg-white rounded-lg border border-[#D5D9D9] p-3 text-xs text-[#565959] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#0F1111]">
                      Shipping to: {selectedAddress?.name}
                    </span>{" "}
                    — {selectedAddress?.address}, {selectedAddress?.city}{" "}
                    {selectedAddress?.postalCode}
                  </div>
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium ml-2"
                  >
                    Change
                  </button>
                </div>

                {/* Payment Options Radio Group */}
                <div className="space-y-3">
                  {/* Option 1: Razorpay Online */}
                  <label
                    onClick={() => setPaymentMethod("ONLINE")}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all",
                      paymentMethod === "ONLINE"
                        ? "bg-[#FFF8E7] border-[#FF9900] shadow-xs"
                        : "bg-white border-[#D5D9D9] hover:border-gray-400"
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={() => setPaymentMethod("ONLINE")}
                      className="mt-1 text-[#FF9900] focus:ring-[#FF9900]"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-sm text-[#0F1111]">
                        <CreditCard className="h-4 w-4 text-[#FF9900]" />
                        Credit Card / Debit Card / Net Banking / UPI
                      </div>
                      <p className="text-[#565959]">
                        Pay securely with Razorpay. Supports Visa, MasterCard, RuPay, UPI (GPay,
                        PhonePe, Paytm), and major Net Banking providers.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Cash on Delivery */}
                  <label
                    onClick={() => setPaymentMethod("COD")}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all",
                      paymentMethod === "COD"
                        ? "bg-[#FFF8E7] border-[#FF9900] shadow-xs"
                        : "bg-white border-[#D5D9D9] hover:border-gray-400"
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 text-[#FF9900] focus:ring-[#FF9900]"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-sm text-[#0F1111]">
                        <Banknote className="h-4 w-4 text-[#067D62]" />
                        Cash on Delivery (COD) / Pay on Delivery
                      </div>
                      <p className="text-[#565959]">
                        Pay using cash or scan QR upon delivery at your doorstep.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-xs border border-[#FCD200]"
                  >
                    Use this payment method & Continue
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(0)}
                    className="text-xs"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Review & Place Order ───────────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#D5D9D9]">
                  <h2 className="text-base font-bold text-[#0F1111]">
                    Review your order & place it
                  </h2>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-0.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back to Payment
                  </button>
                </div>

                <OrderReview
                  items={items}
                  shippingAddress={selectedAddress}
                  paymentMethod={paymentMethod}
                  onEditAddress={() => setCurrentStep(0)}
                  onEditPayment={() => setCurrentStep(1)}
                />
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Place Order CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-[#D5D9D9] p-5 space-y-4 shadow-xs sticky top-20">
              <h3 className="text-sm font-bold text-[#0F1111]">Order Summary</h3>

              <div className="space-y-2 text-xs text-[#0F1111]">
                <div className="flex justify-between">
                  <span className="text-[#565959]">
                    Items ({itemCount} {itemCount === 1 ? "item" : "items"}):
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#565959]">Delivery / Shipping:</span>
                  <span className="text-[#067D62] font-semibold">FREE</span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between text-base font-bold text-[#B12704]">
                  <span>Order Total:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* Action Button: In Step 2 it is PaymentButton, otherwise step advancement */}
              {currentStep === 2 ? (
                <div className="pt-2">
                  <PaymentButton
                    addressId={selectedAddressId}
                    paymentMethod={paymentMethod}
                    user={user}
                    amount={subtotal}
                    onSuccess={handleOrderSuccess}
                  />
                  <p className="text-[10px] text-[#565959] text-center mt-2">
                    By placing your order, you agree to Amazon&apos;s conditions of use & privacy notice.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    if (currentStep === 0) {
                      if (!selectedAddressId) {
                        toast.error("Please select a delivery address");
                        return;
                      }
                      setCurrentStep(1);
                    } else if (currentStep === 1) {
                      setCurrentStep(2);
                    }
                  }}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-xs border border-[#FCD200]"
                >
                  Continue
                </Button>
              )}

              {/* Security info */}
              <div className="pt-2 border-t border-[#EDEDED] flex items-center gap-2 text-[11px] text-[#565959]">
                <ShieldCheck className="h-4 w-4 text-[#067D62] shrink-0" />
                <span>Safe and Secure Payments. Easy returns.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
