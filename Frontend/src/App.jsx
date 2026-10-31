import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layout & Common
import PageLayout from "@/components/layout/PageLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AdminRoute from "@/components/common/AdminRoute";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AdminLayout from "@/components/admin/AdminLayout";

// Code-Split Pages via React.lazy
const Home = lazy(() => import("@/pages/Home"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Cart = lazy(() => import("@/pages/Cart"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderSuccess = lazy(() => import("@/pages/OrderSuccess"));
const Profile = lazy(() => import("@/pages/Profile"));
const Addresses = lazy(() => import("@/pages/Addresses"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminSystemHealth = lazy(() => import("@/pages/admin/AdminSystemHealth"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public Routes inside PageLayout */}
            <Route element={<PageLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Customer Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success/:id" element={<OrderSuccess />} />
                <Route path="/account/profile" element={<Profile />} />
                <Route path="/account/addresses" element={<Addresses />} />
                <Route path="/account/orders" element={<Orders />} />
                <Route path="/account/orders/:id" element={<OrderDetail />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Routes with dedicated AdminLayout */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/system" element={<AdminSystemHealth />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

