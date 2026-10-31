import { Plus, Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AddressSelector({
  addresses = [],
  selectedId,
  onSelect,
  onAddNew,
  onProceed,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#0F1111] flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#FF9900]" />
          Select a delivery address
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddNew}
          className="text-xs border-[#D5D9D9] hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add new address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-6 text-center space-y-3">
          <p className="text-sm text-[#565959]">You don't have any saved addresses yet.</p>
          <Button
            onClick={onAddNew}
            className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
          >
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => {
            const isSelected = selectedId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => onSelect(addr.id)}
                className={cn(
                  "rounded-lg border p-4 cursor-pointer transition-all relative flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  isSelected
                    ? "bg-[#FFF8E7] border-[#FF9900] shadow-xs"
                    : "bg-white border-[#D5D9D9] hover:border-gray-400"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-1",
                      isSelected
                        ? "border-[#FF9900] bg-[#FF9900]"
                        : "border-[#888C8C] bg-white"
                    )}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>

                  <div className="text-xs text-[#0F1111] space-y-0.5 leading-relaxed">
                    <p className="font-bold text-sm text-[#0F1111]">{addr.name}</p>
                    <p>{addr.address}</p>
                    <p>
                      {addr.city}, {addr.state} - <span className="font-semibold">{addr.postalCode}</span>
                    </p>
                    <p>{addr.country || "India"}</p>
                    <p className="text-[#565959] pt-0.5">Phone number: {addr.phone}</p>
                  </div>
                </div>

                {isSelected && onProceed && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onProceed();
                    }}
                    className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs shrink-0 self-start sm:self-auto"
                  >
                    Deliver to this address
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
