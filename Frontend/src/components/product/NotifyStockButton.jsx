import { useId } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export default function NotifyStockButton({ product, className = "" }) {
  const id = useId();
  if (!(product.stock <= 0)) return null;

  return (
    <Button
      id={`notify-stock-${id}`}
      type="button"
      size="sm"
      className={cn(
        "bg-[#FF9900] hover:bg-[#E68A00] active:bg-[#CC7A00] text-[#0F1111] border border-[#D47E00] font-medium shadow-xs transition-colors",
        className
      )}
      aria-label={`Notify me about ${product.name}`}
      onClick={() =>
        toast.info(`Demo notification: ${product.name}`, {
          description: "This is a demo only. No restock alert has been registered or sent.",
          id: `demo-stock-${product.id}`,
        })
      }
    >
      <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
      Notify me
    </Button>
  );
}
