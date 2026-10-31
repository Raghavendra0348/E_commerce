import { useNavigate } from "react-router-dom";
import { LockKeyhole, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartSummary({ subtotal = 0, itemCount = 0, onCheckout, isProceeding = false }) {
  const navigate = useNavigate();
  return (
    <aside id="cart-checkout-summary" className="amazon-cart-summary" aria-label="Cart subtotal and checkout">
      <div className="amazon-cart-summary-note"><PackageCheck size={21} aria-hidden="true" /><p>Ready when you are.<span>Review your address and payment options at checkout.</span></p></div>
      <p className="amazon-cart-summary-subtotal">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"}): <strong>{formatPrice(subtotal)}</strong></p>
      <Button variant="buynow" className="amazon-cart-checkout" disabled={!itemCount || isProceeding} onClick={onCheckout || (() => navigate("/checkout"))}>{isProceeding ? "Proceeding..." : "Proceed to Buy"}</Button>
      <div className="amazon-cart-summary-security"><LockKeyhole size={14} aria-hidden="true" /><span>Continue to checkout to review your order.</span></div>
    </aside>
  );
}
