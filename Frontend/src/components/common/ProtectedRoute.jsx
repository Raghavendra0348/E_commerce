import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <Outlet />;
}
