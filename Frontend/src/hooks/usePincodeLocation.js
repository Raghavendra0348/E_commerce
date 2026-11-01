import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { useDebounce } from "./useDebounce";

export function usePincodeLocation(pincode, enabled = true) {
  const debounced = useDebounce(pincode, 300);
  const valid = /^[1-9]\d{5}$/.test(pincode);
  const settled = debounced === pincode;
  const result = useQuery({
    queryKey: ["pincodeLocation", debounced],
    queryFn: async ({ signal }) => {
      const response = await api.get(`/locations/pincode/${debounced}`, { signal });
      const location = response.data?.data;
      if (location?.pincode !== debounced || !location.city || !location.state) throw new Error("PIN lookup returned incomplete details. Please try again.");
      return location;
    },
    enabled: enabled && valid && settled,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  return { ...result, data: valid && settled ? result.data : undefined, isChecking: enabled && valid && (!settled || result.isFetching), isError: valid && settled && result.isError };
}
