# Software Requirements Specification

## E-Commerce Web Application

| Submission detail | Value |
| --- | --- |
| Student name(s) | [To be filled] |
| Register / roll number(s) | [To be filled] |
| Programme and department | [To be filled] |
| College / university | [To be filled] |
| Project guide | [To be filled] |
| Academic year | [To be filled] |
| Document version | 0.3 |
| Date | 7 November 2026 |
| Status | Working draft for college submission |

This working draft uses the introduction, overall description, specific requirements and supporting appendices approach described by the installed `srs-documentation` skill. It groups specific requirements into Sections 3–8 for readability. Requirements are proposed for review; their inclusion does not mean they have passed acceptance testing. Replace bracketed placeholders before submission. No formal standards certification is claimed.

### Revision history

| Version | Date | Description | Author |
| --- | --- | --- | --- |
| 0.1 | 4 November 2026 | Initial outline, introduction and requirement examples | [Student name] |
| 0.2 | 7 November 2026 | Applied SRS skill guidance; expanded requirements, interfaces and review workflow using current project sources | [Student name] |
| 0.3 | 7 November 2026 | Expanded use cases, data rules, quality criteria, state model and complete draft requirement traceability | [Student name] |

### Contents

1. Introduction
2. Overall Description
3. Functional Requirements
4. External Interface Requirements
5. Non-Functional Requirements
6. Data Requirements
7. Use Cases and System Models
8. Acceptance Criteria and Traceability
9. Open Decisions and Completion Checklist

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the expected behaviour and quality requirements of the E-Commerce Web Application. It describes the facilities provided to guests, registered customers and administrators, together with the system's external interfaces, data requirements and constraints. The document provides a common reference for project evaluation, development and testing.

### 1.2 Project Scope

The E-Commerce Web Application provides a browser-based platform through which customers can discover products, manage a shopping cart and wishlist, maintain delivery addresses, place orders and view order progress. Customers can choose online payment through Razorpay or Cash on Delivery. Administrators manage the product catalog, inventory, orders and user roles through a restricted administration area.

The draft scope includes:

- Account registration, sign-in, profile management and password changes.
- Product browsing, search, category and price filters, sorting and product details.
- Product images, selling prices, original prices and applicable discounts.
- Shopping cart quantities and selection of items for checkout.
- Saved delivery addresses and a separate delivery PIN location lookup.
- Online payment, Cash on Delivery, order history and eligible order cancellation.
- Wishlists, product reviews and rating summaries.
- Administrative catalog, stock, order, user and system-health functions.

Proposed exclusions to confirm with the project guide: a multi-vendor seller portal, live courier GPS tracking, customer wallets and native Android/iOS applications. A responsive website is included.

### 1.3 Intended Audience

The intended readers are the student project team, project guide, academic evaluators, developers and testers.

### 1.3.1 Objectives and Document Overview

The project aims to let customers purchase selected catalog items, preserve accurate order and stock records, and let administrators maintain the catalog and fulfil orders. Sections 1–2 explain the scope and environment. Sections 3–6 specify behaviour, interfaces, quality and data requirements. Sections 7–8 connect user workflows to acceptance checks. Section 9 records decisions required before submission.

### 1.4 Definitions and Abbreviations

| Term | Meaning |
| --- | --- |
| SRS | Software Requirements Specification |
| FR | Functional Requirement: behaviour the system must provide |
| NFR | Non-Functional Requirement: a quality or constraint the system must meet |
| COD | Cash on Delivery |
| INR | Indian Rupee |
| API | Application Programming Interface |
| PIN | Postal Index Number used for Indian postal locations |
| Acceptance criterion | An observable condition used to decide whether a requirement is satisfied |
| TBD | To be determined before the document is finalised |

### 1.5 Project References

- [Project memory and current decisions](../AGENTS.md).
- [Frontend plan](FRONTEND_PLAN.md).
- [Original backend plan](Backend/ecommerce_backend_plan.md).
- Current application source under `Frontend/src`, `Backend/src` and `Backend/prisma/schema.prisma`.

Historical plans may describe older behaviour. Check the current project decisions and relevant source before turning a feature into a final requirement. Source inspection alone does not establish that a requirement has passed testing.

## 2. Overall Description

### 2.1 Product Perspective

The application consists of a responsive web storefront, a restricted administration interface, a backend API and a relational database. It integrates with external services for online payments, image storage and postal PIN lookup.

### 2.2 User Classes

| User class | Main responsibilities / capabilities |
| --- | --- |
| Guest | Browse and search products, view product information and create an account or sign in |
| Customer | Manage their own profile, cart, wishlist, addresses, orders and reviews |
| Administrator | Manage catalog information, inventory, order processing, user roles and operational information |

Razorpay, Cloudinary and the postal lookup provider are external systems rather than human user roles.

### 2.3 Operating Environment

The current project uses React and Vite for the frontend, Node.js and Express for the backend, and PostgreSQL with Prisma for data storage. The customer interface is in English and prices are displayed in INR. Supported browser versions, deployment hardware and the final evaluation environment are TBD.

### 2.4 Assumptions and Dependencies

- Users need a network connection to retrieve current catalog data and perform account, cart and order operations.
- Online payment depends on Razorpay availability and valid configuration.
- Cloudinary image uploads depend on configured credentials; the project also supports local upload storage.
- Delivery PIN lookup depends on the postal provider. A resolved postal location does not establish courier serviceability.
- Administrative functions require an authenticated account with the administrator role.

### 2.5 Constraints and Operations

- The delivery region is India; the interface language is English and monetary values use INR.
- The initial release is a responsive browser application with customer and administrator interfaces.
- The project uses React, Node.js/Express, PostgreSQL and Prisma. These are existing implementation constraints rather than customer-facing requirements.
- No dedicated scanner, printer or other specialist hardware interface is required. Invoice printing uses browser facilities.
- Local development supports separate frontend/backend processes and a root development startup command. Deployment also includes Docker configuration.
- Hardware capacity, supported browser versions, backup schedule and recovery responsibilities require agreement before final approval.

## 3. Functional Requirements

### 3.1 Writing Convention

Give each requirement a unique ID and write it as an observable statement beginning with **"The system shall..."**. Keep one main behaviour per requirement. For each requirement, add its actor, preconditions, inputs, expected result, failure behaviour and acceptance criteria. These starter statements must be expanded and reviewed before submission.

### 3.2 Functional Requirement Register

All entries are **Draft**, with proposed **Must Have** priority for the current release. Acceptance checks describe expected results, not completed verification. Requirement IDs are retained across the register and worked examples.

| ID | Module | Draft requirement |
| --- | --- | --- |
| FR-01 | Registration | The system shall allow a guest to register an account using valid registration details and an email address not already registered. |
| FR-02 | Authentication | The system shall allow a registered user to sign in using valid credentials. |
| FR-03 | Catalog | The system shall return products matching the customer's search and supported filter selections. |
| FR-04 | Product details | The system shall display the selected product's stored description, images, price and availability. |
| FR-05 | Cart | The system shall allow a customer to update a cart item's quantity within available stock limits. |
| FR-06 | Selected checkout | The system shall create an order containing only the cart items selected by the customer for checkout. |
| FR-07 | Addresses | The system shall allow a customer to save a delivery address associated with their own account. |
| FR-08 | Online payment | The system shall verify an online payment with the configured payment gateway before marking the order as paid. |
| FR-09 | Order history | The system shall allow a customer to view orders belonging to their own account. |
| FR-10 | Wishlist | The system shall allow a customer to save a product to their wishlist. |
| FR-11 | Reviews | The system shall allow an authenticated customer to submit at most one review per product, with an integer rating from 1 to 5. |
| FR-12 | Administration | The system shall restrict administrative operations to authenticated administrators. |
| FR-13 | Delivery location | The system shall apply a delivery PIN location only after a successful postal lookup. |

The detailed register below expands operations absent from the initial starter list. FR-06 is detailed in Section 3.4.

| ID | Actor / operation | Requirement | Acceptance criterion / failure behaviour |
| --- | --- | --- | --- |
| FR-14 | Account holder / logout | The system shall terminate the current authenticated session when the account holder signs out. | Protected operations require sign-in after logout; account-specific cart and cached private data are cleared from the interface. |
| FR-15 | Customer / profile | The system shall allow an authenticated customer to update their own supported profile fields. | Valid name/phone changes persist; invalid fields produce a validation message. Another customer's record cannot be changed. |
| FR-16 | Account holder / password | The system shall allow an account holder to change their password after verifying their current password. | A new password requires at least eight characters, an uppercase letter and a number; an incorrect current password is rejected. Existing sessions are revoked on success. |
| FR-17 | Guest or customer / catalog order | The system shall paginate catalog results using supported sorting choices. | Name, price and creation-date ordering follow the selected direction; page changes retain active filters. |
| FR-18 | Customer / add cart item | The system shall add a requested product quantity to the customer's cart when sufficient stock exists. | The cart count and totals update; a quantity exceeding stock is rejected without a partial cart write. |
| FR-19 | Customer / remove cart item | The system shall remove the selected product from the customer's cart. | The product no longer appears and totals reflect the remaining items. |
| FR-20 | Customer / address update | The system shall allow a customer to edit an address belonging to their own address book. | Valid changes persist; attempts to update another account's address are rejected. |
| FR-21 | Customer / address deletion | The system shall allow a customer to delete an address from their own address book. | The address is unavailable for future checkout while earlier order address snapshots remain intact. |
| FR-22 | Customer / COD checkout | The system shall accept Cash on Delivery as a supported checkout method. | A successful COD order is confirmed with payment pending; Razorpay checkout is not required. |
| FR-23 | Customer / payment retry | The system shall permit retrying payment for an eligible unpaid online order. | An incomplete or failed payment does not appear as paid; a retry uses the eligible existing application order. |
| FR-24 | Customer / cancellation | The system shall allow a customer to cancel their own PENDING or CONFIRMED order. | Other fulfilment states reject customer cancellation; successful cancellation restores reserved stock once. |
| FR-25 | Administrator / refund initiation | The system shall allow an administrator to initiate a refund for an eligible cancelled paid online order. | The attempt is recorded and remains pending until gateway confirmation; failed or uncertain submission is not shown as a completed refund. |
| FR-26 | Payment provider / refund confirmation | The system shall reconcile refund status from authenticated gateway notifications. | A confirmed completion updates refund/payment records; duplicate or delayed notifications do not reverse completed state. Invalid signatures are rejected. |
| FR-27 | Administrator / COD collection | The system shall allow an administrator to record cash collection for an eligible delivered COD order. | Collection marks payment paid and records the collection time and administrator; repeated collection does not record a second payment. |
| FR-28 | Customer / wishlist removal | The system shall remove a saved product from the customer's wishlist on request. | The product disappears from the wishlist and saved indicators refresh. |
| FR-29 | Customer / review retrieval | The system shall display product reviews with pagination and aggregate ratings. | Review pages belong to the selected product; rating counts cover all its reviews rather than only the visible page. |
| FR-30 | Administrator / catalog maintenance | The system shall allow an administrator to create and update product records. | Valid names, descriptions, category assignments, prices and stock persist; invalid inputs return field errors. |
| FR-31 | Administrator / product deletion | The system shall allow product deletion only when historical data constraints permit it. | A product referenced by order history cannot be silently removed from that history; a blocked deletion gives a useful error. |
| FR-32 | Administrator / image management | The system shall allow an administrator to upload supported product images. | Accepted files become product image references; unsupported or excessive uploads return validation errors. |
| FR-33 | Administrator / categories | The system shall allow an administrator to maintain catalog categories. | Category names and slugs follow uniqueness rules; invalid references do not leave orphan products. |
| FR-34 | Administrator / fulfilment | The system shall restrict order status changes to permitted transitions. | Invalid transitions are rejected; unpaid online orders cannot advance through paid-order fulfilment. |
| FR-35 | Administrator / user directory | The system shall provide a paginated user directory to administrators. | Customer sessions cannot retrieve the directory; supported role changes affect subsequent authorization. |
| FR-36 | Administrator / operational overview | The system shall display order, revenue, user, product and low-stock information. | Values come from stored records; failures appear as actionable errors rather than invented zero values. |
| FR-37 | Customer / order search | The system shall allow customers to search and filter their own order history. | Product-name or order-number searches, date presets and supported status filters retain account isolation. |
| FR-38 | Customer / order details | The system shall display a customer's order items, total, address snapshot, fulfilment state and payment state. | The two status types are distinct; another customer's order identifier cannot expose private details. |
| FR-39 | Customer / buy again | The system shall allow a customer to add an available previously ordered product to their current cart. | Current stock and price apply; the historic order is unchanged. |

### 3.3 Acceptance Criteria for Initial Requirements

| Requirement | Inputs / trigger | Expected result and failure behaviour |
| --- | --- | --- |
| FR-01 | Name, email, password, optional phone | A valid unique account is created; duplicate email and invalid fields are rejected. Password rules are defined by FR-16. |
| FR-02 | Registered email and password | Valid credentials establish an authenticated session; invalid credentials do not expose private data. |
| FR-03 | Search text, category, price and stock filters | Returned products satisfy the requested criteria; no matches produce an explicit empty state. |
| FR-04 | Product slug | Stored product information appears; an unknown slug produces a not-found state and unavailable images use a fallback. |
| FR-05 | Product and positive integer quantity | The quantity and subtotal update within stock limits; invalid/excess quantities are rejected. |
| FR-07 | Recipient, phone, address, city, state, PIN and country | A valid address is stored for the signed-in account; missing/invalid required values are rejected. |
| FR-08 | Application order and Razorpay verification values | Only valid gateway/order/amount verification can mark payment paid; a duplicate confirmation does not duplicate stock or payment effects. |
| FR-09 | Signed-in customer and history request | Paginated results contain only that customer's orders; guests require authentication. |
| FR-10 | Product identifier | The item is saved once per account; a repeated toggle updates the saved state without duplicates. |
| FR-11 | Product, rating and optional comment | A rating must be an integer from 1 to 5; a second review by the same account for that product is rejected. |
| FR-12 | Administrative request | An authenticated administrator is authorized; guests and customer roles are rejected. |
| FR-13 | Six-digit Indian PIN | Apply is enabled after a successful lookup; invalid codes and provider failures give an error. Postal validity does not imply shipping serviceability. |

### 3.4 Worked Example: FR-06 — Selected Cart Checkout

| Field | Specification |
| --- | --- |
| Actor | Customer |
| Preconditions | The customer is signed in, has cart items and has a saved delivery address. |
| Inputs | Selected cart item IDs, delivery address and payment method |
| Trigger | The customer submits the checkout order. |
| Expected result | An order is created from the selected items using server-side selling prices. |
| Cart effect | Purchased rows are removed; unchecked rows remain in the cart. |
| Stock effect | Stock is reduced only for ordered quantities. |
| Failure behaviour | An empty selection, invalid selection, invalid address or insufficient selected-item stock is rejected without completing an order. |

Proposed acceptance criteria:

1. Given cart products A and B, when only A is selected and ordered, the new order contains A and excludes B.
2. B remains in the cart and its stock is unchanged.
3. The order total equals the sum of the selected quantities multiplied by their server-side selling prices.
4. With no items selected, the interface disables checkout and an explicit empty selection sent to the API is rejected.
5. If selected stock becomes insufficient, no order or partial inventory reduction is committed.

The API also supports legacy whole-cart checkout when item IDs are omitted. Distinguish this from an explicit empty selection when documenting interface behaviour.

## 4. External Interface Requirements

| Interface | What to document |
| --- | --- |
| Customer interface | Screens, navigation, form fields, validation, loading and error states, and responsive behaviour |
| Administration interface | Restricted screens and permitted actions for each administrative function |
| Backend API | Required input, authentication, output and error behaviour for important operations |
| Razorpay | Payment creation, verification, cancellation/failure handling and refund status confirmation |
| Cloudinary / local uploads | Supported image inputs, upload results and fallback behaviour |
| Postal PIN provider | Six-digit PIN input, resolved location, invalid PINs and provider failure behaviour |

### 4.1 Interface Contracts

| ID | Interface | Input / communication | Required response or failure handling |
| --- | --- | --- | --- |
| INT-01 | Browser storefront | Keyboard, pointer or touch interactions on public and account screens | Search, cart, checkout and account forms shall expose loading, empty and failure states. Private actions require sign-in. |
| INT-02 | Administration | Authenticated administrator navigation and validated form submissions | Unauthorized roles shall be rejected at the API as well as restricted in the interface. |
| INT-03 | Application API | JSON over HTTP in local development; HTTPS required for production access | Input validation shall report invalid requests; private operations shall require authentication and enforce ownership. |
| INT-04 | Image upload | Multipart file upload by an administrator | Supported files shall return stored image references; local upload fallback depends on deployment configuration. |
| INT-05 | Razorpay checkout | Gateway order creation, customer checkout callback and server verification | Failed, dismissed and incomplete payment attempts shall remain distinguishable from verified payment. |
| INT-06 | Razorpay webhook | Signed gateway event delivered to the configured webhook endpoint | Valid events shall reconcile payment/refund state idempotently; transient processing failures shall allow provider retry. |
| INT-07 | Postal lookup | Six-digit PIN through the backend location endpoint | Successful resolution shall provide city/district and state; timeout or invalid PIN shall not commit an unverified location. |

Detailed field schemas are maintained in `Backend/src/validators`. API examples and UI screenshots may be added as submission appendices after the requirement wording is reviewed.

## 5. Non-Functional Requirements

These are draft requirements to review and verify. Do not describe them as achieved merely because they appear in this document.

| ID | Quality | Draft requirement / target | Verification approach |
| --- | --- | --- | --- |
| NFR-01 | Security | The system shall reject unauthorised access to another customer's private account resources. | Attempt cross-account reads and writes for addresses, cart and orders. |
| NFR-02 | Security | The system shall reject administrative API requests made with a customer account. | Exercise administrative endpoints with a customer session. |
| NFR-03 | Data integrity | The system shall prevent inventory from falling below zero when competing orders request the same stock. | Submit concurrent orders against a controlled stock fixture. |
| NFR-04 | Error handling | The system shall display an actionable error when a customer operation fails. | Simulate validation, network and API failures for each main flow. |
| NFR-05 | Responsive usability | The system shall keep primary shopping controls usable at agreed phone and desktop viewport sizes. | Specify viewport sizes and inspect main flows; sizes are TBD. |
| NFR-06 | Performance | Response-time percentile, maximum response time, concurrent load and test environment are TBD. | Define a measurable target, then run a repeatable load test. |

### 5.1 Additional Quality Requirements

These requirements and evaluation conditions remain proposed until reviewed by the project guide. Numerical targets below are evaluation proposals, not measured application results.

| ID | Quality | Draft requirement / target | Verification approach |
| --- | --- | --- | --- |
| NFR-07 | Keyboard usability | The system shall expose primary search, cart, address, checkout and sign-in actions through keyboard-operable controls with visible focus. | Complete each main flow using Tab, Shift+Tab, Enter and Space; check focus returns after dialogs close. This is not a claim of full accessibility-standard compliance. |
| NFR-08 | Credential protection | The system shall exclude password values and reusable authentication tokens from ordinary application logs and public API responses. | Inspect representative responses/logs and stored credential representations using controlled test accounts. |
| NFR-09 | Transaction integrity | The system shall commit checkout order creation, selected-item removal and inventory reservation as one transaction. | Force a failure during checkout and confirm that all associated database changes roll back. |
| NFR-10 | Traceability of failures | The system shall attach a request identifier to backend request processing so a reported API failure can be correlated with its server log. | Trigger a controlled API failure and locate the corresponding log by request identifier. |
| NFR-11 | Compatibility | The system shall support the agreed browser matrix for the primary shopping and administrative workflows. | Proposed evaluation: Chrome, Edge and Firefox desktop; Chrome on Android. Record exact versions before evaluation. Support remains unapproved until confirmed. |
| NFR-12 | Recovery | The deployed system shall have a documented database backup and recovery procedure. | Agree backup owner, frequency, retention, maximum acceptable data loss and restoration time; perform and record a controlled restore before claiming readiness. |

For NFR-05, proposed evaluation widths are 390 CSS pixels for phones and 1440 CSS pixels for desktop, with readable content and no page-wide horizontal overflow. Product carousels may scroll within their own containers. These widths require review and do not replace evaluation on actual devices.

For NFR-06, the guide must approve a response-time percentile, load profile, dataset size, hardware/network configuration and treatment of third-party latency. Availability targets, maintenance windows and recovery thresholds are also open decisions; no uptime percentage or load-test result is asserted here.

## 6. Data Requirements

The main business data includes users, categories, products, product images, carts, cart items, addresses, orders, order items, payments, refund attempts, wishlists and reviews. Authentication also uses refresh-token records.

### 6.1 Initial Data Dictionary

| Entity | Important data | Required relationship / integrity rule |
| --- | --- | --- |
| User | Name, unique email, password hash, role, session version | Account ownership anchors private records; credentials shall not appear in public responses. |
| Category | Name, unique slug | Products reference an existing category. |
| Product | Name, slug, description, selling price, optional original price, discount, stock | Money uses decimal storage; inventory allocation shall not oversell stock. |
| ProductImage | URL and optional source/provenance metadata | Each image references a product. |
| Cart / CartItem | Account, product, quantity | One cart per user and one row per product within a cart. |
| Address | Recipient, phone, address lines, city, state, postal code, country | Each saved address belongs to one user. |
| Order / OrderItem | User, total, fulfilment state, payment state, delivery snapshot, ordered quantities/prices | Order-item prices and the shipping snapshot preserve purchase-time data. |
| Payment | Application order, amount, provider, payment status, gateway identifiers | One payment record per application order; gateway payment/order identifiers are unique when present. |
| RefundAttempt | Payment, attempt number, request key, gateway refund ID, amount, status | Attempts are recorded individually and do not become completed solely because submission was requested. |
| Wishlist | User and product | Each user/product pair is unique. |
| Review | User, product, rating, comment | Each user/product pair is unique; rating validation permits 1–5. |
| RefreshToken | Token hash, user, expiry and revocation metadata | Raw refresh tokens shall not be stored as database token values. |

### 6.2 Field Types and Business Rules

| Data / rule | Type or constraint | Required behaviour |
| --- | --- | --- |
| Identifiers and quantities | Integer identifiers; positive integer purchase quantities | Unrecognized/private identifiers shall not grant access; invalid quantities shall be rejected. |
| Product and transaction amounts | Decimal values with two stored fractional digits | Order totals shall be calculated from server-side selling prices and quantities. Browser-submitted totals are not authoritative. |
| Product name and description | Required strings | Catalog forms shall validate required values before a write is accepted. |
| Original price | Optional decimal | Crossed-out MRP and a discount label shall appear only when a valid original price exceeds the selling price. |
| Inventory | Integer stock | Allocation shall check available stock atomically; successful cancellation shall restore an allocation no more than once. |
| Customer address | Required recipient/contact/location fields as validated by the API | An order shall retain the address snapshot captured at checkout, even if the address book later changes. |
| Fulfilment and payment states | Separate enumerated states | An unpaid online order shall not be described as paid; fulfilment cancellation and refund completion shall remain distinct. |
| Reviews | Integer rating 1–5; optional comment | The user/product pair shall remain unique. |
| Gateway identifiers | Optional strings until supplied by the gateway | Once assigned, identifiers shall refer to the same application payment rather than being reused for unrelated orders. |
| Refund attempts | Payment reference, positive attempt number, request key and status | A submission attempt shall remain distinguishable from gateway-confirmed success. |

### 6.3 Ownership and Relationships

| Parent | Related records | Cardinality / ownership |
| --- | --- | --- |
| User | Cart | Zero or one cart per account; created when needed. |
| User | Addresses, orders, reviews, wishlist rows, refresh tokens | One user to many related records; private resources enforce account ownership. |
| Category | Products | One category to many products; each product has one category. |
| Product | Images, cart rows, order rows, reviews, wishlist rows | One product to many related records. Historical order references constrain deletion. |
| Cart | CartItem | One cart to many items; each product occurs once within that cart. |
| Order | OrderItem | One order to many purchased lines with quantity and price snapshots. |
| Order | Payment | Zero or one payment record per order. |
| Payment | RefundAttempt | One payment to many recorded submission attempts. |

This relationship table is the draft basis for an ER diagram. The diagram and detailed field lengths should be finalized against `Backend/prisma/schema.prisma` when preparing submission figures. Data-retention periods, account-erasure procedures and backup retention require a policy decision; no automatic deletion schedule is assumed.

## 7. Use Cases and System Models

The following use cases describe proposed observable behaviour. Preconditions and postconditions specify successful operation; alternative flows explain expected failures.

| ID | Use case | Primary actor |
| --- | --- | --- |
| UC-01 | Purchase selected cart items | Customer |
| UC-02 | Search and filter products | Guest / customer |
| UC-03 | Maintain a delivery address | Customer |
| UC-04 | Cancel an eligible order | Customer |
| UC-05 | Maintain product information | Administrator |
| UC-06 | Advance order fulfilment status | Administrator |
| UC-07 | Register, sign in and maintain an account | Guest / account holder |
| UC-08 | Manage a shopping cart | Customer |
| UC-09 | Maintain a wishlist | Customer |
| UC-10 | Read and submit product reviews | Guest / customer |
| UC-11 | View order history and buy again | Customer |
| UC-12 | Administer payments, users and operations | Administrator / payment provider |

### 7.1 UC-01 — Purchase Selected Cart Items

**Goal:** Place an order for the chosen cart items. **Preconditions:** The customer is signed in, has cart items and owns the selected delivery address. **Trigger:** The customer proceeds to checkout.

1. The customer selects cart items and chooses or creates a delivery address.
2. The customer chooses online payment or COD and reviews the selected items and total.
3. The server validates ownership, selections, current prices and available stock.
4. The server creates the order, reserves stock and removes only purchased cart items in one transaction.
5. For COD, the order is confirmed with payment pending.
6. For online payment, the application prepares a gateway order and opens Razorpay checkout. The order remains unpaid until verified payment is recorded.
7. The confirmation view reports the actual order and payment states.

**Alternatives:** An empty selection, unauthorized address or insufficient stock rejects checkout without partial database changes. Dismissed/failed online payment retains an unpaid application order for an eligible retry. A repeated checkout request with the same supported request key and identical inputs shall return the same order; different inputs with that key are rejected.

**Postconditions:** A successful application order stores item-price and address snapshots; unchecked items remain in the cart. Payment completion is recorded separately from order creation. **Requirements:** FR-06–08, FR-22–23; NFR-03 and NFR-09.

### 7.2 UC-02 — Search and Filter Products

**Goal:** Find products matching the shopper's criteria. **Preconditions:** The catalog is reachable. **Trigger:** A guest/customer enters search text, chooses filters or changes sorting.

1. The shopper submits search text or selects a supported category, price or stock filter.
2. The system requests the matching page using the selected sorting order.
3. The shopper navigates result pages and opens a product detail page.

**Alternatives:** No matches produces an empty state. An unknown product produces a not-found state. A network/rate-limit failure displays an error and a supported retry/recovery path. Missing images use a fallback.

**Postconditions:** The visible results and product information correspond to the selected request. **Requirements:** FR-03–04, FR-17; NFR-04–05.

### 7.3 UC-03 — Maintain a Delivery Address

**Goal:** Maintain addresses available for future checkout. **Preconditions:** The customer is signed in. **Trigger:** The customer opens the address book.

1. The system lists addresses owned by the current account.
2. The customer creates, edits or deletes an address.
3. The system validates the required fields and ownership, saves a valid change, and refreshes the address list.

**Alternatives:** Invalid fields are identified without accepting the write. A resource belonging to another account is rejected. A failed request leaves the customer able to correct or retry it.

**Postconditions:** Future checkout uses the updated address book; existing order snapshots retain purchase-time information. The navbar's verified PIN selection remains a separate display preference. **Requirements:** FR-07, FR-13, FR-20–21; NFR-01.

### 7.4 UC-04 — Cancel an Eligible Order

**Goal:** Cancel an order before the customer cancellation cutoff. **Preconditions:** The customer owns an order in PENDING or CONFIRMED state. **Trigger:** The customer confirms the cancellation action.

1. The system validates ownership and current order state.
2. The system cancels the order and restores reserved quantities once.
3. If an online payment has already been captured, the system records that a refund is pending.
4. The interface displays the current cancellation and payment/refund states.

**Alternatives:** Customer cancellation of PROCESSING, SHIPPED or DELIVERED orders is rejected. Repeating an already completed cancellation does not restore stock twice. A concurrent payment or administrator update is reconciled against the current order state.

**Postconditions:** A cancelled order cannot resume normal fulfilment. Refund initiation and gateway confirmation follow UC-12; cancellation alone does not establish completed repayment. **Requirements:** FR-24–26; NFR-03.

### 7.5 UC-05 — Maintain Product Information

**Goal:** Maintain accurate catalog entries. **Preconditions:** The actor is an authenticated administrator. **Trigger:** The administrator opens catalog maintenance.

1. The administrator selects a product or starts a new entry.
2. The administrator supplies product details, price, stock and category; supported images may be uploaded.
3. The server validates the request and persists the permitted changes.
4. The relevant catalog data refreshes after a successful write.

**Alternatives:** Invalid pricing/stock fields, unsupported images or invalid category references are rejected. Deleting a product referenced by order history is blocked with a useful error.

**Postconditions:** Authorized catalog changes are available to subsequent catalog requests; historical order price snapshots remain intact. **Requirements:** FR-12, FR-30–33.

### 7.6 UC-06 — Advance Order Fulfilment

**Goal:** Record an order's operational progress. **Preconditions:** The actor is an administrator and the requested order exists. **Trigger:** The administrator submits a status update.

1. The system displays the current fulfilment and payment states.
2. The administrator chooses a permitted next state.
3. The server verifies the transition and any required payment condition before saving it.
4. The order view reflects the resulting state.

**Alternatives:** Invalid transitions, unauthorized requests and attempts to advance unpaid online orders are rejected. Administrator cancellation follows the permitted state model and restores stock only once.

**Postconditions:** A valid transition is recorded without skipping the applicable guards. **Requirements:** FR-12, FR-34.

### 7.7 Supporting Use Cases

| Use case | Preconditions / trigger | Main flow | Alternative and postcondition |
| --- | --- | --- | --- |
| UC-07 | Guest opens registration/sign-in, or account holder opens settings | Submit validated registration/credentials; manage supported profile fields, password and sign-out. | Duplicate email, invalid credentials or incorrect current password are rejected. Password change revokes existing sessions; sign-out clears the current session. |
| UC-08 | Customer chooses cart actions | Add products, change quantity and remove items; totals and selection state update. | Insufficient stock or invalid quantities reject the write; an empty cart cannot produce a selected checkout. |
| UC-09 | Customer selects a wishlist control | Save or remove the chosen product; update saved indicators. | Unauthorized private actions require sign-in; repeated toggles do not create duplicate rows. |
| UC-10 | Shopper opens product reviews | Read review pages and aggregate ratings; a signed-in customer may submit a 1–5 rating with optional comment. | Duplicate user/product reviews and invalid ratings are rejected; reading another review page does not change full-product aggregate counts. |
| UC-11 | Customer opens order history | Search/filter owned orders, inspect details and add an available previous item to the current cart. | A private order belonging to someone else is not disclosed. Reordering uses current stock and selling price. |
| UC-12 | Administrator opens payment/user/operations controls; provider sends a signed event | Submit eligible refunds, reconcile gateway results, record delivered COD collection, review users/roles and operational summaries. | Invalid signatures, customer-role requests and ineligible payment actions are rejected. Refund submission is not reported as completed repayment; repeated confirmed events do not duplicate effects. |

### 7.8 Fulfilment State Model

| Current state | Permitted next states | Conditions |
| --- | --- | --- |
| PENDING | CONFIRMED, CANCELLED | Online confirmation requires verified paid status. Customer cancellation is permitted. |
| CONFIRMED | PROCESSING, CANCELLED | Customer cancellation is permitted before progression. |
| PROCESSING | SHIPPED, CANCELLED | Cancellation at this stage is an administrator operation. |
| SHIPPED | DELIVERED | Customer cancellation is unavailable. |
| DELIVERED | None | Delivered COD orders can have their payment collection recorded separately. |
| CANCELLED | None | Refund/payment reconciliation may continue; fulfilment does not reopen. |

This table describes fulfilment only. Payment and refund states are separate. A use-case figure, ER diagram and checkout activity/DFD can be added when the department confirms the required diagram types; the relationship and transition tables above supply their source content.

## 8. Acceptance Criteria and Traceability

Traceability links each requirement to a use case and an observable acceptance check. All rows below have status **Not assessed for this SRS**. Historical automated test results do not automatically approve these document requirements; record dated evidence separately after evaluation.

| Requirement | Use case | Proposed acceptance check |
| --- | --- | --- |
| FR-01 | UC-07 | AT-F01: Register valid details; reject duplicate email and invalid fields. |
| FR-02 | UC-07 | AT-F02: Accept correct credentials; reject incorrect credentials. |
| FR-03 | UC-02 | AT-F03: Combine supported search/filter inputs and inspect matching results. |
| FR-04 | UC-02 | AT-F04: Open an existing and unknown product; inspect stored details and fallback states. |
| FR-05 | UC-08 | AT-F05: Update a valid cart quantity and reject an excessive quantity. |
| FR-06 | UC-01 | AT-F06: Order selected items while preserving unchecked items and their inventory. |
| FR-07 | UC-03 | AT-F07: Save a valid address under the current account only. |
| FR-08 | UC-01 | AT-F08: Verify a valid gateway payment; reject altered verification values. |
| FR-09 | UC-11 | AT-F09: List only the signed-in customer's orders. |
| FR-10 | UC-09 | AT-F10: Save a product and verify no duplicate wishlist row. |
| FR-11 | UC-10 | AT-F11: Submit a valid review; reject invalid ratings and a second review. |
| FR-12 | UC-05, UC-06, UC-12 | AT-F12: Compare administrator, customer and guest access to protected operations. |
| FR-13 | UC-03 | AT-F13: Resolve a valid PIN and reject invalid/failed lookup application. |
| FR-14 | UC-07 | AT-F14: Sign out and confirm private actions require authentication. |
| FR-15 | UC-07 | AT-F15: Save valid profile changes and reject another account's update. |
| FR-16 | UC-07 | AT-F16: Reject an incorrect current password; verify old sessions are revoked after a valid change. |
| FR-17 | UC-02 | AT-F17: Change supported sort orders and pages while retaining filters. |
| FR-18 | UC-08 | AT-F18: Add an available quantity; reject a quantity exceeding stock. |
| FR-19 | UC-08 | AT-F19: Remove an item and verify remaining totals. |
| FR-20 | UC-03 | AT-F20: Edit an owned address; reject unauthorized editing. |
| FR-21 | UC-03 | AT-F21: Delete a saved address and verify an earlier order snapshot is retained. |
| FR-22 | UC-01 | AT-F22: Place a COD order and verify confirmed fulfilment with payment pending. |
| FR-23 | UC-01 | AT-F23: Retry an eligible unpaid order without creating a second application order. |
| FR-24 | UC-04 | AT-F24: Cancel an eligible owned order, repeat the request and verify a single stock restoration. |
| FR-25 | UC-12 | AT-F25: Submit an eligible refund and verify a recorded pending attempt. |
| FR-26 | UC-12 | AT-F26: Reconcile valid repeated/refund events and reject an invalid signature. |
| FR-27 | UC-12 | AT-F27: Record collection for delivered COD; reject ineligible collection and duplicate payment effects. |
| FR-28 | UC-09 | AT-F28: Remove a saved product and verify saved indicators refresh. |
| FR-29 | UC-10 | AT-F29: Change review pages while preserving full-product rating counts. |
| FR-30 | UC-05 | AT-F30: Create/update valid product fields and reject invalid input. |
| FR-31 | UC-05 | AT-F31: Attempt to delete a historically ordered product without losing order references. |
| FR-32 | UC-05 | AT-F32: Upload a supported image and reject invalid upload input. |
| FR-33 | UC-05 | AT-F33: Maintain categories while preserving uniqueness and product references. |
| FR-34 | UC-06 | AT-F34: Accept a permitted status change and reject an invalid/unpaid advancement. |
| FR-35 | UC-12 | AT-F35: Browse user pages as administrator and verify role-change authorization takes effect. |
| FR-36 | UC-12 | AT-F36: Compare summaries to controlled stored records and expose API failures. |
| FR-37 | UC-11 | AT-F37: Search/filter owned order pages without exposing another customer's orders. |
| FR-38 | UC-11 | AT-F38: Inspect item/address snapshots and separate payment/fulfilment states. |
| FR-39 | UC-11 | AT-F39: Buy again using current stock/price while preserving the earlier order. |
| NFR-01 | UC-03, UC-08, UC-11 | AT-N01: Attempt cross-account private-resource reads and writes. |
| NFR-02 | UC-05, UC-06, UC-12 | AT-N02: Exercise administrative APIs with a customer account. |
| NFR-03 | UC-01, UC-04 | AT-N03: Submit competing purchases against controlled stock. |
| NFR-04 | UC-01–12 | AT-N04: Trigger representative validation/network/API failures and inspect recovery guidance. |
| NFR-05 | UC-01–12 | AT-N05: Inspect main workflows at approved phone and desktop widths. |
| NFR-06 | UC-02, UC-01 | AT-N06: Execute the approved load profile; record latency percentiles and environment. Target pending. |
| NFR-07 | UC-01, UC-02, UC-03, UC-07, UC-08 | AT-N07: Complete primary workflows by keyboard and inspect focus. |
| NFR-08 | UC-07, UC-12 | AT-N08: Inspect logs and responses for exposed credentials/tokens. |
| NFR-09 | UC-01 | AT-N09: Force a checkout failure and confirm complete transaction rollback. |
| NFR-10 | UC-01–12 | AT-N10: Correlate a controlled failed request with its request ID in server logs. |
| NFR-11 | UC-01–12 | AT-N11: Evaluate the approved browser/version matrix. Matrix pending approval. |
| NFR-12 | UC-12 | AT-N12: Restore a controlled backup using the agreed recovery procedure. Recovery thresholds pending. |

For executed checks, add an evidence record containing the acceptance-check ID, date, evaluator, application revision, environment, result and evidence location. Do not replace a pending target with a pass/fail claim until its acceptance condition is agreed.

## 9. Open Decisions and Completion Checklist

- [ ] Fill the college, student, guide and academic-year details.
- [ ] Confirm the final project title and submission/page-format instructions.
- [ ] Review the scope inclusions and proposed exclusions with the project guide.
- [ ] Expand every feature into uniquely numbered, testable requirements.
- [ ] Confirm cancellation eligibility and the complete refund workflow against current behaviour; requesting a refund is different from gateway-confirmed completion.
- [ ] Complete interfaces, the data dictionary, use cases and required diagrams.
- [ ] Agree measurable quality targets and the evaluation environment.
- [ ] Map each requirement to acceptance criteria and verification evidence.
- [ ] Resolve all TBD entries, review consistency and update the revision history.
- [ ] Prepare the final Word/PDF layout and table of contents when the content is ready.

### 9.1 Decision Register

| ID | Decision required | Current position | Suggested reviewer |
| --- | --- | --- | --- |
| OD-01 | Submission identity | Student, roll number, college, department, guide and academic year are placeholders. | Student / guide |
| OD-02 | Final scope and title | E-Commerce Web Application is the working title; confirm exclusions and proposed priorities. | Student / guide |
| OD-03 | College format | Standard outline is in use; chapter order, page limit and required diagram types need confirmation. | Guide |
| OD-04 | Quality evaluation | Phone/desktop widths and browser matrix are proposed; performance and availability targets remain unagreed. | Guide / project team |
| OD-05 | Data operations | Backup ownership, retention, restoration targets and account-erasure procedure require a policy. | Project team / deployment owner |
| OD-06 | Acceptance evidence | Requirement checks are specified but not assessed for this document. | Evaluator / project team |

### 9.2 Review and Approval

| Role | Name | Review date | Decision / signature |
| --- | --- | --- | --- |
| Student / project team | [To be filled] | [To be filled] | Pending |
| Project guide | [To be filled] | [To be filled] | Pending |
| Department reviewer, if required | [To be filled] | [To be filled] | Pending |

The document remains a working draft until the required reviewers approve its content and unresolved decisions are recorded.
