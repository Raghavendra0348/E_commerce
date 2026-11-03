import { useState } from "react";
import { toast } from "sonner";

export function useDeliveryLocation() {
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("amazon_delivery_location") || "null");
      return saved?.verified && /^[1-9]\d{5}$/.test(saved.pincode) && saved.city && saved.state ? saved : null;
    } catch { return null; }
  });
  const handleLocationSelect = location => {
    setDeliveryLocation(location);
    try { localStorage.setItem("amazon_delivery_location", JSON.stringify(location)); } catch { /* Selection still works in memory. */ }
    toast.success(`Delivery location updated to ${location.city} ${location.pincode}`);
  };
  return { deliveryLocation, locationModalOpen, setLocationModalOpen, handleLocationSelect };
}
