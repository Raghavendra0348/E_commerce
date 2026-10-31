import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet connection restored", {
        description: "You are back online.",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("No internet connection", {
        description: "Please check your network settings.",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}

export default useNetworkStatus;
