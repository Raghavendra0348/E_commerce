# Skullet product-grid trial

Implemented: 7 November 2026

The catalog at `/products` now uses **Skullet 0.0.3**, pinned in the frontend package and lockfile. Only `ProductGrid` uses this new loader; existing skeleton components elsewhere remain available.

## How it works

- Skullet measures the existing `CatalogProductCard` layout using local sample products during initial loading.
- The default sample count remains 20, matching the catalog's requested page size. Samples use an inline SVG, with no remote image requests.
- A grid-scoped light theme draws gray shimmer shapes for the image, text, prices and purchase controls. The provider uses a whole-grid reveal.
- Skullet marks loading content busy, hides samples from screen readers and makes their controls inert. The existing product cards and purchase behavior render after the response arrives.
- The existing empty state appears when a successful response contains no products. API-error display remains handled by the catalog page.

Sample values approximate the eventual layout. Text length, optional discounts/ratings and a short final page can change the height on reveal. In particular, the browser fixture intentionally returned six products after showing 20 samples, and Skullet reported the resulting grid-height difference. This integration does not guarantee zero layout shift.

## Try it locally

1. Run the existing development servers and load the website with Network set to **No throttling**.
2. Open Developer Tools → Network and switch to **3G**.
3. Search for a new keyword or choose an unvisited category without refreshing the browser.
4. Watch the product grid shimmer while its API request is pending, then reveal the results.
5. Restore **No throttling** afterward.

Cached or very fast responses may skip the skeleton. A throttled hard reload also delays React's startup files; this loader cannot display before JavaScript starts. No artificial production API delay was added.

## Verification

- All **134 frontend tests** pass, including three new product-grid regressions for hidden/inert loading samples, loaded-card purchase navigation and the empty state.
- Production build passes. The Products route grows by approximately **20 kB gzipped**; Skullet stays in that lazy-loaded route.
- Real Edge browser checks with delayed mock product responses passed at **1440 px** and **390 px**: measured shimmer rectangles, 20 inert sample cards, no horizontal overflow, and enabled purchase controls after reveal.
- Loading and loaded screenshots are retained under `output/playwright/skullet-grid-{loading,loaded}-{1440,390}.png`. The local mock-data browser helper is `output/playwright/skullet-product-grid-qa.js`. No database products or real purchases were created for verification.

Implementation: [ProductGrid.jsx](../Frontend/src/components/product/ProductGrid.jsx). Tests: [ProductGrid.test.jsx](../Frontend/src/test/ProductGrid.test.jsx). Library reference: [official React documentation](https://github.com/lochie/skullet/blob/main/packages/skullet/README.md#react).
