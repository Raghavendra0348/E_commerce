# Amazon reference redesign

Implemented on 2 November 2026 using the public [Amazon.in SiteStyleGuide](https://sitestyleguide.com/amazon.in) and its [1440 px desktop screenshot](https://sitestyleguide.com/media/amazon.in/972/desktop.webp), captured on 31 October 2026.

## What changed

The storefront now uses the reference's compact desktop header, narrow tall festival cards, type and color system, and compact footer. The existing customer catalog, phone navigation and shopping flows continue through their existing API integrations.

| Area | Implementation |
| --- | --- |
| Reference tokens | `Frontend/src/styles/amazon-reference.css` records the extracted color palette, three gradients, font stacks, type scale, radii, shadows, breakpoint inventory and content-width inventory. Layouts apply relevant tokens rather than treating every extracted width as the width of the whole site. |
| Typography | Arial is the default body face at 14 px with 20 px line height. Heading stacks prefer available Ember faces and fall back to Arial. Main customer headings use the reference's 28/36 px scale on desktop and 24/32 px on phones. No remote font files were added. |
| Header | A 60 px desktop top row gives most width to search. Logo, account, orders, region and cart controls use compact spacing. Delivery selection remains available through the map-pin control; its tooltip identifies the selected city and PIN. |
| Category navigation | The All button opens the existing category drawer. Category links use actual API category IDs and have working search fallbacks before category data arrives. Deals and New Arrivals use supported sort parameters. A festival link uses the reference's right-aligned emphasis. |
| Carousel | Cards are approximately 268 by 429 px at a 1440 px viewport, with 8 px gaps, 16 px corners and large side controls. Existing artwork is retained. Its embedded arrow graphics now have corresponding real carousel controls instead of behaving as product links. |
| Collections | The existing festive and discovery sections remain below the hero. White panels, quieter borders, compact headings, neutral image surfaces and restrained gold price ribbons replace the large gold panel backgrounds. |
| Shopping pages | Product cards, prices, links, stock indicators, purchase panels, buttons and inputs share the reference styling. Search, filters, cart, wishlist, sign-in and payment logic retain their existing owners. |
| Footer | The large link columns are replaced by a Back to top strip, centered logo and fixed English/India badges, followed by a dark legal section. The badges are static because the app's supported interface language is fixed English. |
| Responsive layout | Desktop uses the dense single-row header. Tablets wrap search below the primary actions and use two-column collections. Phones retain the dark home header, compact inner-page headers, live search, verified delivery selector, horizontally browsable collections and five-item bottom navigation. |

## How it works

The new stylesheet loads after the existing responsive files, providing a named reference layer without changing API requests or duplicating component state. The main Tailwind theme and shared button/input primitives use the updated font, link and focus styling.

For example, clicking All opens the existing drawer. Selecting Books navigates to `/products?categoryId=6` and closes the drawer. The category ID comes from the category query, so the link follows the live catalog rather than relying on a label-only filter.

On a phone, typing `cotton` opens real product-name suggestions. Submitting it navigates to `/products?search=cotton`; selecting a result opens the corresponding product page. An unsigned shopper pressing Add to Cart is directed to sign-in with the product return destination preserved. Styling changes do not create a second cart or wishlist state store.

Back to top uses smooth scrolling normally and immediate scrolling when reduced motion is requested. Narrow layouts maintain bottom-navigation clearance. Existing carousel artwork is reused as supplied; promotional words embedded in that artwork are not new backend offers or checkout guarantees.

## Reference coverage

The reference is an unofficial extraction from a desktop homepage capture. Its middle area was partially loaded and it does not supply complete product, cart, checkout or mobile page designs. Those areas are adaptations of the shared style system using this application's existing working layouts and catalog data.

Exact artwork, product content and Ember font rendering therefore differ from the capture. No dependency, backend endpoint, database schema or payment behavior was added for the redesign. Existing footer legal-link destinations remain as before; this work does not add legal-policy pages.

## Verification

| Check | Result |
| --- | --- |
| Frontend regression suite | 92 tests passed across 26 files |
| Production build | Passed without build warnings |
| Desktop geometry at 1440 px | Header 60 px tall; first festival card approximately 268 by 429 px |
| Responsive browser checks | Reviewed 1440, 768, 390 and 320 px widths; no horizontal page overflow observed |
| Search | Live cotton suggestions, search submission and product navigation verified |
| Category drawer | All opened the drawer; selecting Books navigated to the live category ID and closed it |
| Guest cart action | Redirected to sign-in with the product return URL preserved |
| Carousel artwork controls | Phone previous-arrow control moved the carousel while keeping the homepage route |
| Footer | Compact desktop and phone region rows inspected; Back to top exercised |
| Font downloads | No Google Fonts links remain in the page |

Browser verification used an isolated Playwright session against the existing local development server. No account was changed and no order or payment was placed. The browser logged transient Vite reconnect messages while development files were being edited; no application exception was observed in the checked flows.

Saved screenshots are under the ignored `output/playwright/` directory:

- `reference-desktop.png` and `reference-desktop-footer.png`
- `reference-tablet.png`
- `reference-phone.png`, `reference-phone-small.png` and `reference-phone-footer.png`
- `reference-phone-search.png`, `reference-phone-catalog.png` and `reference-phone-product.png`

The existing backend and frontend development servers were reused and left running. Reopen or refresh the local storefront to view the redesign.

### Festival card alignment correction

The generated cards previously split their height into fixed percentage rows. Footer content exceeded its allocation, pushing the Shop now button behind the image panel and the final line into the decorative lights. Content-sized text rows now reserve enough room for headings and footer controls; the image panel fills the remaining space. Two-line heading and subtitle slots align the four cards even when their text wraps differently.

Desktop (1440px) and phone (320px) browser checks confirmed aligned panels, visible CTA text and clear bottom labels. At 320px every promo card has 8px between the image and adjacent text sections and 22px of bottom clearance. All 92 existing frontend tests and the production build pass. Screenshots: output/playwright/festival-alignment-desktop.png and festival-alignment-phone.png.

### Reproducible guide import

The public token blocks and referenced assets are now extracted locally by scripts/scrape-amazon-reference.mjs. Runtime colors, type sizes and radii resolve through the generated --ssg- variables; the extracted ICO is the favicon. The guide misidentifies delivery/returns artwork as its logo, so the current wordmark remains. Font records do not include Ember binaries. Full provenance, implementation flow, grid adaptations and verification: [AMAZON_STYLE_GUIDE_IMPORT.md](AMAZON_STYLE_GUIDE_IMPORT.md).

### Four-card desktop layout

At user request, desktop festival slides now fill one quarter of the carousel width after subtracting the three 8px gaps. Exactly four complete cards fit at desktop widths; tablet and phone overrides remain. Verified at 1000, 1440 and 1920px, with the phone layout checked at 390px. Production build passes. This supersedes the original narrow five-card reference layout described above.

### Expanded reference footer

The user-supplied footer image supersedes the earlier compact layout. Four desktop columns now provide Get to Know Us, Connect with Us, Make Money with Us and Let Us Help You. A divided logo/English/India row sits above a darker seven-service grid and the legal row. Both grids become two columns on narrow screens, retaining phone bottom-navigation clearance.

Your Account opens the existing application account route. External reference links open official Amazon/service or social destinations in a new tab; legal links now point to Amazon resources instead of returning to this clone homepage. English and India remain static indicators. Source-specific footer destinations were checked against the public Amazon reading page at https://read.amazon.in/sample/B01MRFSO37. No account, checkout or backend behavior changed.

Verified the production build, 92 existing frontend tests, four desktop link groups, seven services, 33 links with nonempty destinations and no horizontal overflow at desktop or 320px phone width. QA captures: output/playwright/footer-reference-final.png and footer-reference-phone.png.
