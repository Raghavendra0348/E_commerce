import { ShoppingCart, Search, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const iconMap = {
  cart: ShoppingCart,
  search: Search,
  wishlist: Heart,
  orders: Package,
  default: ShoppingCart,
};

export default function EmptyState({
  icon = "default",
  title = "Nothing here yet",
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  const Icon = iconMap[icon] || iconMap.default;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#F5F5F5]">
        <Icon className="h-12 w-12 text-[#BBBFBF]" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-[#0F1111]">{title}</h2>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-[#565959]">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Button asChild>
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
