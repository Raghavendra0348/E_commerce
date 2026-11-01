import { T } from "@/components/common/Translation";
import { useEffect, useState } from "react";
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
import { usePincodeLocation } from "@/hooks/usePincodeLocation";



export default function LocationModal({
  open,
  onOpenChange,
  currentLocation,
  onLocationSelect,
}) {
  const [pincodeInput, setPincodeInput] = useState("");
  const [error, setError] = useState("");
  const { data: resolvedLocation, isChecking, isError, error: lookupError, refetch } = usePincodeLocation(pincodeInput, open);
  const formatError = pincodeInput.length === 6 && !/^[1-9]\d{5}$/.test(pincodeInput) ? "Please enter a valid 6-digit Indian PIN code" : "";
  const errorMessage = error || formatError || (isError ? lookupError?.response?.data?.message || lookupError?.message || "Could not verify this PIN code." : "");
  useEffect(() => {
    if (open) {
      setPincodeInput(currentLocation?.pincode || "");
      setError("");
    }
  }, [open, currentLocation?.pincode]);

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    const cleaned = pincodeInput.trim();
    if (!/^[1-9]\d{5}$/.test(cleaned)) {
      setError("Please enter a valid 6-digit Indian PIN code");
      return;
    }

    if (isChecking || !resolvedLocation || resolvedLocation.pincode !== cleaned) return;
    onLocationSelect({ ...resolvedLocation, verified: true });
    setPincodeInput("");
    setError("");
    onOpenChange(false);
  };

  const handleSelectPredefined = (loc) => {
    setPincodeInput(loc.pincode);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="delivery-location-dialog" className="sm:max-w-md bg-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#0F1111] flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#FF9900]" />
            <T>{"Choose your location"}</T>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#565959]">
            Enter your PIN code to automatically find your city or district and state.
          </DialogDescription>
        </DialogHeader>

        {/* PIN code form */}
        <form onSubmit={handlePincodeSubmit} className="space-y-2 pt-2">
          <label htmlFor="delivery-pincode" className="text-xs font-bold text-[#0F1111]">
            <T>{"Enter an Indian PIN code"}</T>
          </label>
          <div className="flex gap-2">
            <Input
              id="delivery-pincode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              aria-invalid={!!errorMessage}
              aria-describedby={errorMessage ? "delivery-pincode-error" : "delivery-pincode-help"}
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
              disabled={!resolvedLocation || isChecking || isError}
            >
              <T>{isChecking ? "Checking..." : "Apply"}</T>
            </Button>
          </div>
          <p id="delivery-pincode-help" className="text-xs text-[#565959]">Enter all 6 digits. City and state are filled after verification.</p>
          {errorMessage && <p id="delivery-pincode-error" role="alert" className="text-xs text-[#CC0C39]">{errorMessage}</p>}
          {isError && lookupError?.response?.status !== 404 && <Button type="button" variant="link" size="sm" onClick={() => refetch()}>Retry PIN lookup</Button>}
          {isChecking && <p role="status" className="text-xs text-[#565959]">Looking up your city and state...</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div><label htmlFor="delivery-city" className="text-xs font-semibold"><T>{"City / district"}</T></label><Input id="delivery-city" value={resolvedLocation?.city || ""} readOnly placeholder="Filled automatically" className="mt-1 bg-gray-50" /></div>
            <div><label htmlFor="delivery-state" className="text-xs font-semibold"><T>{"State"}</T></label><Input id="delivery-state" value={resolvedLocation?.state || ""} readOnly placeholder="Filled automatically" className="mt-1 bg-gray-50" /></div>
          </div>
        </form>

       
      </DialogContent>
    </Dialog>
  );
}
