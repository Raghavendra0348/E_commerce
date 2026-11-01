import DataSync from "@/components/common/DataSync";
import { queryClient } from "@/lib/queryClient";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App.jsx";
import AuthSession from "@/components/common/AuthSession";
import LanguageSync from "@/components/common/LanguageSync";
import "./index.css";
import "./styles/responsive.css";
import "./styles/mobile-storefront.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageSync />
      <AuthSession>
        <DataSync />
        <App />
      </AuthSession>
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
