// Development-only fixtures. This entry is not part of the production build.
// All API calls stay in this adapter; no real account, cart or order is changed.
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../src/App";
import api from "../src/api/axios";
import { useAuthStore } from "../src/store/useAuthStore";
import { useCartStore } from "../src/store/useCartStore";
import "../src/index.css";
import "../src/styles/responsive.css";
import "../src/styles/mobile-storefront.css";

const params = new URLSearchParams(location.search);
const route = params.get("route") || "/";
const action = params.get("action");
const user = { id: 9001, name: "Alexandra Long Customer Name", email: "long.customer.name@example.test", phone: "9876543210", role: "ADMIN", createdAt: "2026-01-01" };
useAuthStore.setState({ user, accessToken: "fixture-only", refreshToken: null, isAuthenticated: true, isInitializing: false,
  // Do not let form interactions in this fixture persist anything to browser storage.
  setAuth: state => useAuthStore.setState(state), setTokens: state => useAuthStore.setState(state), setUser: value => useAuthStore.setState({ user: value }), logout: () => useAuthStore.setState({ isAuthenticated: false, user: null, accessToken: null }) });
const categories = ["home-kitchen", "fashion", "office-products", "beauty-personal-care", "furniture", "audio", "gaming", "wearables"].map((slug, index) => ({ id: index + 1, slug, name: slug.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" & ") }));
const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f6f5ef"/><rect x="85" y="48" width="130" height="190" rx="18" fill="#627a89"/><rect x="99" y="67" width="102" height="139" rx="8" fill="#dce9de"/><circle cx="150" cy="221" r="6" fill="#fafafa"/></svg>');
const products = categories.flatMap(category => Array.from({ length: 4 }, (_, i) => ({ id: category.id * 10 + i, slug: `sample-product-${category.id}-${i}`, name: `${category.name} premium everyday product with a longer descriptive name ${i + 1}`, description: "A detailed description with features and specifications. Long product names and prices exercise small-screen layouts without hiding content.", price: i ? 1299.99 : 99999.99, stock: i ? 20 : 3, categoryId: category.id, category, avgRating: 4.5, reviewCount: 12345, images: [{ id: i + 1, url: image }] })));
const address = { id: 1, name: user.name, phone: user.phone, address: "Apartment 1204, Long Building Name, Example Residential Layout", city: "Visakhapatnam", state: "Andhra Pradesh", postalCode: "530001", country: "India" };
const items = products.slice(0, 3).map((product, index) => ({ id: index + 1, productId: product.id, product, quantity: index + 1, price: product.price }));
const cart = { id: 1, items };
const order = { id: 42, user, userId: user.id, createdAt: "2026-10-25T12:00:00Z", totalAmount: 106499.94, status: "CONFIRMED", paymentStatus: "PENDING", payment: { provider: "COD" }, shippingAddress: address, items };
useCartStore.setState({ cart, itemCount: 6, isLoading: false, isDrawerOpen: action === "cart-drawer" });
const list = data => ({ success: true, data, pagination: { page: 1, total: 125, totalPages: 13, limit: 10 } });
api.defaults.adapter = async config => {
  if ((config.method || "get") !== "get") throw new Error("Fixture mode: writes are disabled");
  const path = config.url;
  let data;
  if (path === "/categories") data = { data: categories };
  else if (path === "/cart") data = { data: cart };
  else if (path === "/addresses") data = { data: [address, { ...address, id: 2, name: "Office delivery" }] };
  else if (path === "/wishlist") data = { data: { items } };
  else if (path === "/products") data = list(products.filter(product => !config.params?.categoryId || product.categoryId === Number(config.params.categoryId)).slice(0, config.params?.limit || 10));
  else if (path.includes("/products/slug/")) data = { data: products[0] };
  else if (path.endsWith("/reviews/mine")) data = { data: null };
  else if (path.endsWith("/reviews")) data = { data: { reviews: [{ id: 1, user: { id: 2, name: "Another Customer With A Long Name" }, rating: 5, comment: "Helpful product with a detailed customer review.", createdAt: "2026-10-25" }], totalReviews: 25, averageRating: 4.5, ratingDistribution: { 5: 20, 4: 5 }, pagination: { totalPages: 3 } } };
  else if (path === "/orders" || path === "/orders/admin/all") data = list([order, { ...order, id: 43, status: "SHIPPED" }]);
  else if (path.startsWith("/orders/")) data = { data: order };
  else if (path === "/admin/stats") data = { data: { totalRevenue: 12345678.99, totalOrders: 125, totalProducts: 221, totalUsers: 500, ordersByStatus: { CONFIRMED: 25, SHIPPED: 40 } } };
  else if (path === "/admin/products/low-stock") data = { data: products.slice(0, 3) };
  else if (path === "/admin/users") data = list([user, { ...user, id: 9002, role: "USER" }]);
  else if (path.startsWith("/admin/users/")) data = { data: { ...user, addresses: [address], orders: [order] } };
  else if (path.startsWith("/health/")) data = { success: true, database: { status: "connected", latencyMs: 12 }, memory: { heapUsedMb: 125, heapTotalMb: 250, rssMb: 150 }, uptimeSeconds: 1234567, nodeVersion: "v22" };
  else data = { data: user };
  return { data, status: 200, statusText: "OK", headers: {}, config };
};
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchInterval: false, refetchOnWindowFocus: false } } });
history.replaceState({}, "", route);
createRoot(document.getElementById("root")).render(<QueryClientProvider client={client}><App /></QueryClientProvider>);

function clickButton(text) {
  const button = [...document.querySelectorAll("button")].find(item => item.textContent.trim().includes(text));
  button?.click();
  return !!button;
}
function visible(element) { return !!element.getClientRects().length; }
function clippedByAncestor(element) {
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(parent).overflowX)) return true;
  }
  return false;
}
async function inspect() {
  await document.fonts.ready;
  if (action === "address-dialog") clickButton("Add Address");
  if (action === "product-dialog") clickButton("Add Product");
  if (action === "admin-menu") document.querySelector('[aria-label="Open admin navigation"]')?.click();
  if (action === "checkout-payment" || action === "checkout-review") {
    clickButton("Continue");
    await new Promise(resolve => setTimeout(resolve, 100));
    if (action === "checkout-review") clickButton("Use this payment method");
  }
  await new Promise(resolve => setTimeout(resolve, 250));
  const viewport = document.documentElement.clientWidth;
  const width = document.documentElement.scrollWidth;
  const offenders = [...document.querySelectorAll("#root *, [data-slot='dialog-content'] *, [data-slot='sheet-content'] *")].filter(element => {
    if (!visible(element) || clippedByAncestor(element)) return false;
    const rect = element.getBoundingClientRect();
    return rect.right > viewport + 1 || rect.left < -1;
  }).slice(0, 8).map(element => ({ tag: element.tagName, className: String(element.className).slice(0, 110), text: element.textContent.slice(0, 70) }));
  const report = { route, action, viewport, documentWidth: width, pass: width <= viewport + 1 && offenders.length === 0, offenders };
  document.documentElement.dataset.layoutReport = JSON.stringify(report);
  parent.postMessage({ type: "responsive-report", ...report }, location.origin);
}
let readyTicks = 0;
const ready = setInterval(() => {
  if (!document.querySelector("#main-content, #admin-main-content") || client.isFetching()) return;
  if (++readyTicks < 3) return;
  clearInterval(ready);
  void inspect();
}, 150);
