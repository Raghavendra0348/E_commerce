---
activation: model-decision
description: Amazon India-style e-commerce frontend rules. Covers tech stack decisions, coding conventions, design system, API integration patterns, and implementation workflow.
---

# Amazon India E-Commerce Frontend — Detailed Agent Rules

> Load this rule when working on any Frontend/ code, UI components, pages, styling, or API integration.

---

## 1. Tech Stack Decisions (Locked)

- **Framework:** React 19 + Vite 6 (JavaScript, NOT TypeScript)
- **Styling:** Tailwind CSS v4 + shadcn/ui + Radix UI
- **Routing:** React Router v7
- **Server-State:** TanStack Query v5 (React Query)
- **Client-State:** Zustand v5 (auth, cart, UI)
- **API:** Axios with JWT auto-refresh interceptor
- **Forms:** React Hook Form + Zod validation
- **Notifications:** Sonner toasts
- **Carousels:** Embla Carousel
- **Icons:** Lucide React

Do NOT introduce additional libraries without explicit user approval.

---

## 2. File & Folder Conventions

- All frontend code lives in `Frontend/src/`
- Path alias: `@/` → `Frontend/src/` (configured in vite.config.js + jsconfig.json)
- Component files: PascalCase (`ProductCard.jsx`)
- Hook files: camelCase with `use` prefix (`useAuth.js`)
- Service files: camelCase with `.service` suffix (`auth.service.js`)
- Store files: camelCase with `Store` suffix (`authStore.js`)
- Page files: PascalCase (`ProductDetail.jsx`)
- shadcn/ui components go in `src/components/ui/` (lowercase filenames)

---

## 3. Component Rules

- Every component must have a unique `id` on its root element for testing
- Use shadcn/ui primitives for: Button, Input, Dialog, Sheet, Select, Badge, Card, Skeleton, Tooltip, Dropdown
- Do NOT create custom implementations of UI primitives that shadcn/ui already provides
- Wrap API data fetching in TanStack Query hooks (`useQuery`, `useMutation`)
- Use Zustand stores only for client-side state (cart items, auth tokens, drawer open/close)
- Do NOT mix TanStack Query and Zustand for the same data — pick one source of truth per data type

---

## 4. API Integration Patterns

### Axios Instance (`src/services/api.js`)
```js
// Base URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
// Request interceptor: attach Bearer token from authStore
// Response interceptor: on 401, attempt silent refresh, queue failed requests
```

### Service Layer Pattern
```js
// src/services/product.service.js
import api from './api';

export const getProducts = (params) => api.get('/products', { params });
export const getProductBySlug = (slug) => api.get(`/products/slug/${slug}`);
```

### TanStack Query Hook Pattern
```js
// src/hooks/useProducts.js
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services/product.service';

export const useProducts = (params) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params).then(res => res.data),
  });
};
```

---

## 5. Authentication Flow

1. **Login/Register** → Backend returns `{ accessToken, refreshToken, user }`
2. **Store:** `accessToken` in Zustand (memory only), `refreshToken` in localStorage
3. **Every request:** Axios interceptor attaches `Authorization: Bearer <accessToken>`
4. **On 401:** Interceptor calls `POST /api/auth/refresh` → new token pair → retry failed request
5. **On refresh failure:** Clear auth state → redirect to `/login`
6. **Logout:** Call `POST /api/auth/logout` → clear localStorage + Zustand

**NEVER store accessToken in localStorage.** It belongs only in Zustand memory.

---

## 6. Styling Guidelines

- Use the Amazon.in-inspired design system from `docs/DESIGN_SYSTEM.md`
- Base font size: 14px (Amazon standard)
- Primary CTA: `bg-amazon-orange` (#FF9900), text dark
- Top navbar: `bg-amazon-dark` (#131921), text white
- Sub-nav: `bg-amazon-dark-alt` (#232F3E)
- Links: `text-amazon-blue` (#007185), hover: `text-amazon-blue-hover` (#C7511F)
- Product grid: 2→3→4→5 columns as viewport grows
- Always display prices in INR (₹) with Indian locale formatting
- Skeleton loaders for all async content (not spinners)

---

## 7. Image Handling

Product images may come from two sources:
1. **Cloudinary:** Full HTTPS URL (e.g., `https://res.cloudinary.com/...`)
2. **Local uploads:** Relative path (e.g., `/uploads/product-1.jpg`)

Build a helper that resolves both:
```js
export const getImageUrl = (url) => {
  if (!url) return '/images/placeholder.png';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${url}`;
};
```

---

## 8. Price Formatting

```js
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
```

---

## 9. Error Handling

- API errors: Catch in TanStack Query `onError` → show Sonner toast
- Form validation errors: Display inline under fields (React Hook Form + Zod)
- 404 pages: Custom `NotFound.jsx` with "Continue Shopping" CTA
- Network errors: Show a top banner "Connection lost" with retry button
- Auth errors (401 after refresh fail): Redirect to `/login` with toast

---

## 10. Performance Rules

- Lazy-load all page components with `React.lazy()` + `Suspense`
- Product images: `loading="lazy"` attribute
- Debounce search input: 300ms minimum
- TanStack Query stale time: 5 minutes for product lists, 1 minute for cart
- Don't import entire icon libraries — import individual icons from `lucide-react`

---

## 11. Reference Documents

- **Full Frontend Plan:** `docs/FRONTEND_PLAN.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Implementation Status:** `docs/IMPLEMENTATION_STATUS.md`
- **Backend API Spec:** `Docs/Backend/ecommerce_backend_plan.md`
- **Backend Stage Plan:** `Docs/Backend/next_stage_plan.md`
- **Database Schema:** `Backend/prisma/schema.prisma`
