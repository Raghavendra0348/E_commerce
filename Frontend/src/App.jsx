// lazy  → Load page code only when the user visits that route (code-splitting)
// Suspense → Show a spinner fallback while a lazy page is being downloaded
import { lazy, Suspense } from "react";

// BrowserRouter → Enables client-side URL navigation without full page reloads (SPA)
// Routes        → Container that matches the current URL to the correct <Route>
// Route         → Maps a URL path to a page component (e.g. /cart → <Cart />)
// Navigate      → Auto-redirects the user to a different URL
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ── Eagerly loaded (normal imports) ─────────────────────────────────────────
// These are needed on EVERY page from the very first render,
// so lazy-loading them would only add a delay with no benefit.

// PageLayout     → Store shell: dark navbar + footer + cart drawer (wraps all customer pages)
import PageLayout from "./components/layout/PageLayout";
// ProtectedRoute → Guard: redirects to /login if the user is not authenticated
import ProtectedRoute from "./components/common/ProtectedRoute";
// AdminRoute     → Stricter guard: requires login + ADMIN role
import AdminRoute from "./components/common/AdminRoute";
// ErrorBoundary  → Crash safety net: catches any React error and shows a friendly fallback
import ErrorBoundary from "./components/common/ErrorBoundary";
// LoadingSpinner → The spinner shown inside <Suspense> while lazy pages download
import LoadingSpinner from "./components/common/LoadingSpinner";
// AdminLayout    → Admin shell: sidebar + admin header (wraps all admin pages)
import AdminLayout from "./components/admin/AdminLayout";

// ── Lazy-loaded pages (code-split) ──────────────────────────────────────────
// Each page is bundled into its own small JS file by Vite.
// The code is only downloaded when the user navigates to that route.

// Public storefront pages (anyone can visit)
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Customer pages (require login)
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Profile = lazy(() => import("./pages/Profile"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));

// Admin pages (require login + ADMIN role)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSystemHealth = lazy(() => import("./pages/admin/AdminSystemHealth"));

// ── Loading fallback ────────────────────────────────────────────────────────
// Centered spinner displayed while a lazy-loaded page is still downloading.
function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// ── Main App Component ──────────────────────────────────────────────────────
// This is the root routing structure of the entire application.
export default function App() {
  return (
    // ErrorBoundary wraps everything → catches any crash anywhere in the app
    <ErrorBoundary>
      {/* BrowserRouter → enables /url-based SPA navigation */}
      <BrowserRouter>
        {/* Suspense → shows the spinner while any lazy page is loading */}
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>

            {/* ─── Customer-facing routes (with Navbar + Footer) ─────── */}
            <Route element={<PageLayout />}>

              {/* Public routes — no login required */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — must be logged in, else redirect to /login */}
              <Route element={<ProtectedRoute />}>
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success/:id" element={<OrderSuccess />} />
                <Route path="/account/profile" element={<Profile />} />
                <Route path="/account/addresses" element={<Addresses />} />
                <Route path="/account/orders" element={<Orders />} />
                <Route path="/account/orders/:id" element={<OrderDetail />} />
              </Route>

              {/* 404 — any unmatched URL shows the Not Found page */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* ─── Admin routes (with Sidebar + Admin Header) ────────── */}
            {/* AdminRoute guard → must be logged in AND have ADMIN role */}
            <Route element={<AdminRoute />}>
              {/* AdminLayout → replaces PageLayout with admin sidebar + header */}
              <Route element={<AdminLayout />}>
                {/* /admin auto-redirects to /admin/dashboard */}
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
