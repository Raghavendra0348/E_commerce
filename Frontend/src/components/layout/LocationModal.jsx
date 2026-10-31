import { useState } from "react";
import { MapPin, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POPULAR_LOCATIONS = [
  { city: "Tirupati", pincode: "517619", state: "Andhra Pradesh" },
  { city: "Bengaluru", pincode: "560001", state: "Karnataka" },
  { city: "Hyderabad", pincode: "500001", state: "Telangana" },
  { city: "Chennai", pincode: "600001", state: "Tamil Nadu" },
  { city: "Mumbai", pincode: "400001", state: "Maharashtra" },
  { city: "Delhi", pincode: "110001", state: "Delhi" },
];

export default function LocationModal({
  open,
  onOpenChange,
  currentLocation,
  onLocationSelect,
}) {
  const [pincodeInput, setPincodeInput] = useState("");
  const [error, setError] = useState("");

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    const cleaned = pincodeInput.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      setError("Please enter a valid 6-digit Indian PIN code");
      return;
    }

    const matched = POPULAR_LOCATIONS.find((loc) => loc.pincode === cleaned);
    const newLocation = matched || {
      city: "India",
      pincode: cleaned,
      state: "",
    };

    onLocationSelect(newLocation);
    setPincodeInput("");
    setError("");
    onOpenChange(false);
  };

  const handleSelectPredefined = (loc) => {
    onLocationSelect(loc);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#0F1111] flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#FF9900]" />
            Choose your location
          </DialogTitle>
          <DialogDescription className="text-xs text-[#565959]">
            Select a delivery location to see product availability and delivery options
          </DialogDescription>
        </DialogHeader>

        {/* PIN code form */}
        <form onSubmit={handlePincodeSubmit} className="space-y-2 pt-2">
          <label className="text-xs font-bold text-[#0F1111]">
            Enter an Indian PIN code
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              maxLength={6}
              placeholder="e.g. 517619"
              value={pincodeInput}
              onChange={(e) => {
                setPincodeInput(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              className="h-9 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold shrink-0"
            >
              Apply
            </Button>
          </div>
          {error && <p className="text-xs text-[#CC0C39]">{error}</p>}
        </form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D5D9D9]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-[#565959] font-medium">
              or select a major city
            </span>
          </div>
        </div>

        {/* Popular Cities */}
        <div className="grid grid-cols-2 gap-2">
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected =
              currentLocation?.pincode === loc.pincode;
            return (
              <button
                key={loc.pincode}
                type="button"
                onClick={() => handleSelectPredefined(loc)}
                className={`flex items-center justify-between p-2 rounded border text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-[#FF9900] bg-[#FFF8E7] font-bold text-[#0F1111]"
                    : "border-[#D5D9D9] hover:bg-[#F7FAFA] text-[#0F1111]"
                }`}
              >
                <div>
                  <div className="font-semibold">{loc.city}</div>
                  <div className="text-[11px] text-[#565959]">{loc.pincode}</div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-[#FF9900]" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
