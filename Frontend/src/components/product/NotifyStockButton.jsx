import { useId } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function NotifyStockButton({ product, className = "" }) {
  const id = useId();
  if (!(product.stock <= 0)) return null;

  return (
    <Button
      id={`notify-stock-${id}`} type="button" variant="outline" size="sm"
      className={className} aria-label={`Notify me about ${product.name}`}
      onClick={() => toast.info(`Demo notification: ${product.name}`, {
        description: "This is a demo only. No restock alert has been registered or sent.",
        id: `demo-stock-${product.id}`,
      })}
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      Notify me
    </Button>
  );
}
