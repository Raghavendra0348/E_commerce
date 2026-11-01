import { QueryClient } from "@tanstack/react-query";
import { REFRESH_INTERVAL } from "./dataSync";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => error.response?.status !== 429 && failureCount < 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      refetchInterval: REFRESH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  },
});
