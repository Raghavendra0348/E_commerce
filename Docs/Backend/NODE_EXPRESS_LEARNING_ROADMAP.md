# Node.js + Express.js Learning Roadmap
## Learn by Understanding the E-Commerce Backend

**Goal:** Understand the Node.js and Express concepts behind this repository well enough to explain, debug, test, and extend the backend yourself.

**Recommended duration:** 8 weeks, about 1.5–2 hours a day, 6 days a week. Move faster or slower based on understanding, not the calendar.

**Style:** JavaScript/CommonJS, not TypeScript. Learn each concept, locate it in this backend, then build or test a small change.

**Repository:** https://github.com/Raghavendra0348/E_Commerce/tree/main/Backend

---

## How to study each day

1. **Learn (25–35 min):** Read about one concept and write a short explanation in your own words.
2. **Trace (20–30 min):** Find where it appears in this repository. Follow imports and function calls.
3. **Practice (30–45 min):** Write a tiny example or implement a small safe change.
4. **Verify (10–15 min):** Run the endpoint or tests and inspect the result.
5. **Recall (5 min):** Close the code and explain what happens, step by step.

For every topic, answer:
- What problem does it solve?
- What would happen without it?
- What inputs does it receive and what output/side effect does it produce?
- What errors can happen?
- How do I prove it works?

Do not study by copying whole files. Read one function, predict what it does, run it, and compare your prediction.

---

# Phase 0 — Set up and map the project
**Time:** 1–2 days

### Learn
- What backend servers do
- HTTP request/response and JSON
- npm, packages, `package.json`, `package-lock.json`
- Environment variables and `.env`
- Development vs production
- Git branches and small commits

### Read in this repository
- `Backend/package.json`
- `Backend/.env.example`
- `Backend/src/server.js`
- `Backend/src/app.js`

### Tasks
- From the Backend directory, run `npm install`.
- Copy the example environment file to a local `.env` and fill in values for your own development environment; never commit real credentials.
- Run `npm run dev`.
- Call `GET /api/health` and confirm the server responds.
- Run `npm test` only with a deliberately configured test database; tests that write to PostgreSQL must never point at production data.
- Draw the current folder structure and describe the job of each folder.

### Checkpoint
Explain the difference between starting a server in `server.js` and configuring the Express app in `app.js`.

---

# Phase 1 — JavaScript essentials for backend development
**Time:** Week 1

Do not re-learn all frontend JavaScript. Focus on the parts used heavily by servers.

### Topics
- `const`, `let`, scope, truthy/falsy, equality
- Function declarations, function expressions, arrow functions
- Objects, arrays, destructuring, spread/rest
- Modules: `require()`, `module.exports`
- Callbacks and higher-order functions
- Promises, `async`/`await`, `try/catch`
- `map`, `filter`, `find`, `reduce`, `Promise.all`, `Promise.allSettled`
- Exceptions and rethrowing errors
- JSON and Buffer basics

### Locate examples
- CommonJS imports/exports throughout `src/`
- `Promise.all` in `src/services/product.service.js`
- Async operations in controllers and services
- `try/catch` and `next(error)` in `src/controllers/auth.controller.js`
- `Promise.allSettled` in the product image cleanup logic

### Practice
1. Write a function that calculates a cart subtotal from an array of `{ price, quantity }` values.
2. Convert a callback example into a Promise, then into `async/await`.
3. Write a function that throws an error for an invalid product quantity and handle it with `try/catch`.
4. Explain why `await` is used before a Prisma query.
5. Explain the difference between `Promise.all` and `Promise.allSettled`.

### Checkpoint
You can trace asynchronous code without guessing when a value becomes available and where errors go.

---

# Phase 2 — Node.js fundamentals
**Time:** Week 2

### Topics
- Node.js as a JavaScript runtime
- V8 and the role of libuv (high-level)
- Process, environment variables, working directory
- Event loop: call stack, queues, asynchronous I/O
- Blocking vs non-blocking operations
- Node built-ins: `fs`, `path`, `crypto`, `process`
- Buffers and raw request bodies
- Modules and dependency loading
- Process signals, shutdown, exit codes
- Unhandled promise rejections and uncaught exceptions

### Read in this repository
- `src/server.js`: process handlers, `SIGINT`, `SIGTERM`, server close, Prisma disconnect
- `src/app.js`: Node's `path` module and static upload path
- `src/services/payment.service.js`: Node's `crypto` module and HMAC signatures
- `src/routes/webhook.routes.js` and `src/controllers/webhook.controller.js`: raw body flow

### Practice
- Write a tiny script demonstrating synchronous code, `setTimeout`, a resolved Promise, and `process.nextTick`; explain observed order for your runtime.
- Use `process.env.NODE_ENV` in a local script.
- Use `path.join()` to build an absolute upload path.
- Explain what happens when the server receives Ctrl+C.
- Explain why payment webhook signature verification needs the exact raw bytes/body.

### Checkpoint
Explain why waiting for a database or network call usually does not mean the JavaScript thread must sit idle.

---

# Phase 3 — Express.js and the HTTP request lifecycle
**Time:** Week 3

### Topics
- Express app vs Node HTTP server
- Routes and HTTP methods: GET, POST, PUT, PATCH, DELETE
- Route parameters, query parameters, request body
- `req`, `res`, `next`
- Middleware and middleware order
- `express.Router()` and route mounting
- JSON/urlencoded body parsing
- Status codes and response headers
- 404 handling and centralized error middleware
- CORS, Helmet, request logging
- REST conventions and resource naming

### Main files to trace
- `src/server.js`
- `src/app.js`
- `src/routes/product.routes.js`
- `src/controllers/product.controller.js`
- `src/utils/response.utils.js`
- `src/utils/ApiError.js`
- `src/middleware/error.middleware.js`

### Draw this request path
Browser/API client → request ID → HTTP logger → security headers → CORS → rate limit → body parser → sanitization → route → validation/auth middleware → controller → service → Prisma/PostgreSQL → response or error handler.

Note that the real order differs for some endpoints: health routes and webhook routes are mounted before the global limiter/body parser. This is intentional; inspect the comments in `app.js`.

### Practice
- Create a temporary `GET /api/hello` route returning JSON.
- Add a route parameter such as `/api/hello/:name`.
- Read query parameters from `/api/hello?name=...`.
- Create a small middleware that logs the method and URL, then calls `next()`.
- Trigger a deliberately missing route and follow it into the 404/error middleware.
- Explain why error middleware must be registered after routes.

### Checkpoint
Given any endpoint, you can identify which middleware runs before its controller and how the response gets returned.

---

# Phase 4 — API architecture, validation, and errors
**Time:** Week 4

### Topics
- Separation of routes, controllers, services, utilities
- Single responsibility and dependency boundaries
- Input validation vs sanitization
- Zod schemas, parsing, coercion, optional fields
- Authentication middleware vs authorization middleware
- Custom error classes and error status codes
- API response consistency
- Pagination, filtering, sorting, search
- HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500

### Read in this repository
- `src/validators/product.validator.js`
- `src/middleware/validate.middleware.js`
- `src/middleware/sanitize.middleware.js`
- `src/utils/ApiError.js`
- `src/middleware/error.middleware.js`
- `src/utils/response.utils.js`
- Product route, controller and service files

### Practice
- Trace `GET /api/products?page=1&limit=10&search=phone` through validation to Prisma.
- Test invalid page/limit values and explain the error response.
- Add a new filter only after documenting its validation, service query, and test.
- Ensure client errors don't expose stack traces or secrets in production.
- Explain why data coming from `req.body` should never be trusted just because a frontend validates it.

### Checkpoint
You can add an endpoint in the existing architecture without putting database queries or all business rules inside the route file.

---

# Phase 5 — PostgreSQL, Prisma, and asynchronous business logic
**Time:** Week 5

Node/Express handle requests; Prisma is the database access layer; PostgreSQL stores durable data.

### Topics
- Relational tables, primary/foreign keys, unique constraints, indexes
- Prisma schema, generated client, migrations and seed scripts
- CRUD: `findMany`, `findUnique`, `create`, `update`, `delete`
- Relations and `include` vs `select`
- Query filters and pagination
- Transactions: why multiple writes may need to succeed or fail together
- Database uniqueness and race conditions
- Connection management and clean shutdown
- Decimal values and money calculations

### Read in this repository
- `prisma/schema.prisma`
- `src/config/database.js`
- `prisma/seed.js`
- `src/services/product.service.js`
- `src/services/cart.service.js`
- `src/services/order.service.js`

### Practice
- Use Prisma Studio to inspect a few products and categories.
- Trace product list filtering from query parameters to Prisma's `where`, `orderBy`, `skip`, and `take`.
- Explain how a `CartItem` points to both a cart and a product.
- Add a transaction to a small, non-payment practice flow that needs multiple related database writes.
- Test a duplicate email or duplicate cart item and identify which database constraint stops it.
- Use a separate test database before running any test that creates, updates, or deletes records.

### Checkpoint
Explain when to use a transaction, why application-level checks alone do not prevent all concurrent duplicates, and why the database constraint matters.

---

# Phase 6 — Authentication, authorization, and application security
**Time:** Week 6

### Topics
- Registration vs login
- Password hashing with bcrypt (never store plaintext passwords)
- JWT access token basics and verification
- Access token vs refresh token
- Refresh token rotation, hashing at rest, revocation
- Authentication vs authorization
- Role-based access control
- Rate limiting and brute-force protection
- CORS is not authentication
- Helmet/security headers
- Secrets management, least privilege, safe logs
- File upload risks, file size limits, file signature checks
- Input validation and safe output serialization

### Read in this repository
- `src/services/auth.service.js`
- `src/controllers/auth.controller.js`
- `src/middleware/auth.middleware.js`
- `src/middleware/admin.middleware.js`
- `src/utils/jwt.utils.js`
- `src/middleware/rateLimiter.middleware.js`
- `src/middleware/upload.middleware.js`
- `tests/auth.test.js`

### Practice
- Trace registration: route → validation → controller → auth service → database → response.
- Trace a protected endpoint with no token, an invalid token, a valid user token, and an admin token.
- Explain what the refresh-token rotation tests verify.
- Add tests for missing, expired, malformed, and revoked tokens where practical.
- Check that password hashes and secrets never appear in API responses or logs.

### Security rule
Never commit actual `.env` files, live JWT secrets, database credentials, Razorpay secrets, or Cloudinary secrets. Use `.env.example` with placeholders. Rotate any credential that was accidentally exposed.

### Checkpoint
You can explain who the caller is, how the server identifies them, what they are allowed to do, and how that decision is enforced.

---

# Phase 7 — Real e-commerce workflows and concurrency
**Time:** Week 7

### Topics
- Cart calculations and server-side price authority
- Stock checks and inventory updates
- Order state transitions
- Transaction boundaries
- Concurrency/race conditions
- Idempotency: safe retries and duplicate requests
- Payments as an external system
- Webhook signature validation and raw body
- Payment/refund lifecycle
- File/image uploads and external services
- Compensating actions and failure cleanup

### Read in this repository
- `src/services/cart.service.js`
- `src/services/order.service.js`
- `src/services/payment.service.js`
- `src/routes/webhook.routes.js`
- `src/controllers/webhook.controller.js`
- `tests/order_concurrency.test.js`
- `tests/payment.test.js`

### Practice
- Draw the flow: cart → place order → reserve/decrement stock → create payment → verify payment/webhook → order status.
- Read the transaction code and write down every record it modifies.
- Explain how stock is restored on cancellation, and what prevents invalid status transitions.
- Explain why the client must not decide the final product price or payment success state.
- Simulate duplicate webhook events and check idempotency.
- Never use real payment credentials or real-money payment flows for practice; use test-mode credentials and test orders.

### Checkpoint
You can describe what happens if two people attempt to buy the last item at nearly the same time, and identify the database/application safeguards.

---

# Phase 8 — Testing, debugging, and observability
**Time:** Week 8

### Topics
- Unit tests vs integration tests
- Vitest, assertions, setup/teardown hooks
- Supertest for HTTP endpoint tests
- Test fixtures and cleanup
- Isolated test database
- Mocking external services where appropriate
- Testing success paths and failure paths
- Logs vs HTTP responses
- Request/correlation IDs
- Linting and repeatable scripts
- Debugging stack traces and inspecting async errors

### Read in this repository
- `vitest.config.mjs`
- `tests/auth.test.js`
- `tests/admin.test.js`
- `tests/order_concurrency.test.js`
- `tests/payment.test.js`
- `src/config/logger.js`
- `src/middleware/requestId.middleware.js`

### Practice
- Run `npm test` against a dedicated test database.
- Run `npm run lint`.
- Add tests for product list pagination, invalid product IDs, not-found cases, and unauthorized admin mutations.
- For every service change, add at least one positive test and one negative test.
- Learn to distinguish a failing assertion from a database setup/connection failure.
- Run the same request repeatedly and inspect status, response body, and logs.

### Checkpoint
A feature is not “done” just because it works manually; you can reproduce its expected behavior and important failures in tests.

---

# Optional Advanced Phase — After the eight weeks

Study these only after the core request/database/auth flow is clear:

- Caching and Redis (cache invalidation, TTL, cache stampede)
- Background jobs and queues
- Email/SMS notification services
- Search engines and advanced product search
- API versioning, OpenAPI/Swagger documentation
- Structured logging, metrics, tracing, health/readiness probes
- Deployment, reverse proxies, HTTPS, secure cookies, CORS configuration
- CI pipelines and automatic tests
- Load testing and performance profiling
- Database indexes and query plans
- Idempotency keys for checkout/payment APIs
- Rate limiting backed by shared storage in multi-instance deployments
- Graceful handling of external provider timeouts and retries

Do not introduce Redis, queues, microservices, or complex abstractions just to make the project look advanced. Add them when you can explain the problem they solve.

---

# Your file-by-file reading order

1. `src/server.js` — Node process and HTTP server lifecycle.
2. `src/app.js` — Express app, middleware order, route mounting, 404 and error handling.
3. `src/routes/health.routes.js` and `src/controllers/health.controller.js` — shortest request path.
4. `src/routes/product.routes.js` — route matching and middleware chains.
5. `src/validators/product.validator.js` + `src/middleware/validate.middleware.js` — request validation.
6. `src/controllers/product.controller.js` — HTTP layer.
7. `src/services/product.service.js` — business logic and Prisma calls.
8. `src/config/database.js` and `prisma/schema.prisma` — data access/model relationships.
9. `src/utils/ApiError.js` + `src/middleware/error.middleware.js` — failed request path.
10. `src/middleware/auth.middleware.js` + `src/middleware/admin.middleware.js` — protected routes.
11. `src/services/auth.service.js` + `tests/auth.test.js` — token lifecycle.
12. `src/services/order.service.js` + order concurrency tests — transactions and stock correctness.
13. `src/services/payment.service.js` + webhook files/tests — external events, raw bodies, signatures, idempotency.
14. Upload middleware and Cloudinary helpers — file handling and external service calls.

---

# Request lifecycle example: product listing

For `GET /api/products?page=1&limit=10`:

1. `server.js` starts the Node HTTP server and Express handles requests.
2. `app.js` middleware runs in registration order.
3. Express matches `/api/products` and selects the GET route.
4. Validation middleware checks/coerces query input using the product query schema.
5. `product.controller.js` receives the request and calls the service.
6. `product.service.js` builds a Prisma query, asks for records and count, and awaits the results.
7. The controller sends a JSON success response via the shared response utility.
8. If an error is passed to `next(error)`, the centralized error handler formats it.

When reading the actual implementation, verify every step in code instead of assuming the order.

---

# Weekly deliverables

| Week | Deliverable |
|---|---|
| 0 | Local setup works; folder diagram and server/app explanation |
| 1 | Small JavaScript async/functions exercises |
| 2 | Event-loop demo and shutdown explanation |
| 3 | Temporary Express routes and middleware demo |
| 4 | One endpoint traced from validation to error/response |
| 5 | Prisma relationship/transaction notes and a safe DB exercise |
| 6 | Auth flow diagram and negative token tests |
| 7 | Order/payment state diagram and concurrency explanation |
| 8 | Additional automated tests and lint passing |

---

# Reliable learning resources

Prefer official documentation, then return to the repository and find the same concept in code.

- Node.js Learn: https://nodejs.org/en/learn
- Node.js API documentation: https://nodejs.org/api/
- Express guide: https://expressjs.com/en/guide/routing.html
- Express middleware guide: https://expressjs.com/en/guide/using-middleware.html
- Express error handling: https://expressjs.com/en/guide/error-handling.html
- MDN HTTP overview: https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
- Prisma documentation: https://www.prisma.io/docs
- Vitest guide: https://vitest.dev/guide/
- Supertest repository: https://github.com/ladjs/supertest
- Zod documentation: https://zod.dev/

---

# Final self-assessment

You are ready to build backend features more independently when you can:

- Explain Node's async I/O and why a database call is awaited.
- Explain the difference between `server.js` and `app.js`.
- Trace a request through middleware, router, controller, service, database and response.
- Use `req.params`, `req.query`, `req.body`, and `req.user` correctly.
- Validate untrusted inputs and return appropriate status codes.
- Keep route/controller/service responsibilities separate.
- Explain JWT access/refresh tokens, role authorization, and safe password storage.
- Identify where database transactions and uniqueness constraints are required.
- Explain why payment webhooks need signature checks, raw bodies, and idempotency.
- Write tests for both success and failure cases.
- Debug from logs and errors without hiding them or leaking secrets.
- Implement a small feature, test it, and explain every important line.

**Most important rule:** Learn concepts in a small sandbox first, then trace the corresponding production-style implementation in this repository. Keep your current working code and database safe while practicing.
