import { isRateLimited } from "@/lib/rateLimit";
// Only resource names are broadcast; account data and tokens stay in their stores.
export const DATA_CHANGE_EVENT = "storefront:data-changed";
export const REFRESH_INTERVAL = 180_000;
const resources = {
  products: ["products", "product", "searchSuggestions", "reviews", "myReview", "adminProducts", "adminStats", "adminLowStock", "wishlist"],
  categories: ["categories", "products", "product", "adminProducts"],
  orders: ["orders", "order", "adminOrders", "adminStats", "adminUserDetail", "products", "product", "adminProducts", "adminLowStock"],
  payments: ["orders", "order", "adminOrders", "adminStats", "adminUserDetail"],
  wishlist: ["wishlist"],
  addresses: ["addresses"],
  reviews: ["reviews", "myReview", "product", "products"],
  admin: ["adminUsers", "adminUserDetail", "adminStats", "adminOrders", "orders", "order"],
  cart: [],
};

export function notifyServerChange(config = {}) {
  if (!["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) return;
  let path;
  try { path = new URL(config.url, window.location.origin).pathname.replace(/^\/api\//, "/"); } catch { return; }
  const resource = path.split("/").filter(Boolean)[0];
  if (!resources[resource]) return;
  window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT, { detail: resource }));
}

export function startDataSync({ queryClient, refreshCart, canRefreshCart }) {
  let channel;
  let stopped = false;
  let lastCartRefresh = 0;
  const visible = () => document.visibilityState !== "hidden" && navigator.onLine !== false;
  const updateCart = (force = false) => {
    if (stopped || !visible() || isRateLimited() || !canRefreshCart()) return;
    if (!force && Date.now() - lastCartRefresh < REFRESH_INTERVAL) return;
    lastCartRefresh = Date.now();
    void refreshCart();
  };
  const refreshStaleCart = () => updateCart();
  const apply = (resource, remote = false) => {
    const keys = resources[resource];
    if (!keys) return;
    void queryClient.invalidateQueries({ predicate: query => keys.includes(query.queryKey[0]), refetchType: visible() && !isRateLimited() ? "active" : "none" });
    if (["products", "orders", "payments"].includes(resource) || (remote && resource === "cart")) updateCart(true);
  };
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("storefront-data-sync-v1");
      channel.onmessage = event => apply(event.data, true);
    }
  } catch { /* Polling remains available in browsers without channel support. */ }
  const onChange = event => {
    apply(event.detail);
    try { if (resources[event.detail]) channel?.postMessage(event.detail); } catch { /* Keep local updates working. */ }
  };
  window.addEventListener(DATA_CHANGE_EVENT, onChange);
  window.addEventListener("focus", refreshStaleCart);
  window.addEventListener("online", refreshStaleCart);
  document.addEventListener("visibilitychange", refreshStaleCart);
  const timer = window.setInterval(refreshStaleCart, REFRESH_INTERVAL);
  return () => {
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener(DATA_CHANGE_EVENT, onChange);
    window.removeEventListener("focus", refreshStaleCart);
    window.removeEventListener("online", refreshStaleCart);
    document.removeEventListener("visibilitychange", refreshStaleCart);
    channel?.close();
  };
}
