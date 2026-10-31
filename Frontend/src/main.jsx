import DataSync from "@/components/common/DataSync";
import { REFRESH_INTERVAL } from "@/lib/dataSync";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => error.response?.status !== 429 && failureCount < 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      refetchInterval: REFRESH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DataSync />
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
          },
        }}
        richColors
      />
    </QueryClientProvider>
  </StrictMode>
);
