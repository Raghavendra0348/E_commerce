# 📒 E-Commerce Backend — Project Notes

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | PostgreSQL 18 |
| **ORM** | Prisma |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **Validation** | Zod |
| **File Upload** | Multer (memory storage) |
| **Image Storage** | Cloudinary (with local fallback) |
| **Security** | Helmet, CORS, Rate Limiter |
| **Logging** | Morgan |

---

## 📁 Folder Structure

```
Backend/
├── prisma/
│   ├── schema.prisma        ← All DB models defined here
│   ├── migrations/          ← Auto-generated migration files
│   └── seed.js              ← Seed data
├── src/
│   ├── app.js               ← Express app setup, middleware & routes
│   ├── server.js            ← HTTP server entry point
│   ├── config/
│   │   └── database.js      ← Prisma client instance
│   ├── controllers/         ← Handle req/res, call services
│   ├── services/            ← Business logic, DB queries
│   ├── routes/              ← Express route definitions
│   ├── middleware/          ← Auth, validation, upload, error, rate limit
│   ├── validators/          ← Zod schemas
│   └── utils/               ← Helper functions (ApiError, JWT, response, slug, cloudinary)
├── uploads/                 ← Local image fallback (if Cloudinary not configured)
└── .env                     ← Environment variables
```

---

## ⚙️ Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://postgres:rgukt123@localhost:5432/ecommerce_db"
PORT=5000
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="1d"

# Optional — if not set, images save locally to /uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BASE_URL=http://localhost:5000
```

---

## 🗄️ Database Schema (Prisma)

### Models built

| Model | Purpose |
|---|---|
| `User` | Stores users — role: USER or ADMIN |
| `Category` | Product categories (has slug) |
| `Product` | Products (price, stock, slug, categoryId) |
| `ProductImage` | Multiple images per product |
| `Cart` | One cart per user (lazy-created) |
| `CartItem` | Items inside a cart (productId + quantity) |
| `Address` | Delivery addresses per user |
| `Order` | Placed orders (status, totalAmount) |
| `OrderItem` | Snapshot of product + price at order time |
| `Payment` | Payment record linked to an order |
| `Wishlist` | User's saved/liked products |

### Enums
```
UserRole      → USER, ADMIN
OrderStatus   → PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
PaymentStatus → PENDING, PAID, FAILED, REFUNDED
```

---

## 🔌 Middleware Stack (in order — `app.js`)

```
1. Morgan        → logs every HTTP request in terminal
2. Helmet        → adds security HTTP headers automatically
3. CORS          → allows cross-origin requests (open for now)
4. /api/health   → health check (before rate limiter, never blocked)
5. Rate Limiter  → protects API from spam/abuse
6. Body Parser   → parses JSON and URL-encoded body
7. /uploads      → serves local images as static files
8. API Routes    → actual business routes
9. 404 Handler   → catches unknown routes
10. Error Handler → global error response formatter
```

---

## ✅ Modules Built So Far

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Access | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create new user account, returns JWT |
| POST | `/api/auth/login` | Public | Login with email + password, returns JWT |
| GET | `/api/auth/profile` | User | Get logged-in user's profile |
| PUT | `/api/auth/profile` | User | Update name/phone |
| PUT | `/api/auth/change-password` | User | Change password (verifies old one first) |

**Key details:**
- Passwords hashed with **bcrypt (12 salt rounds)**
- JWT issued on both register and login
- Password never returned in any response (uses Prisma `select`)

---

### 🗂️ Categories — `/api/categories`

| Method | Endpoint | Access | What it does |
|---|---|---|---|
| GET | `/api/categories` | Public | List all categories |
| GET | `/api/categories/:id` | Public | Single category + its products |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

**Key details:**
- Auto-generates **slug** from category name
- Slug is unique in DB

---

### 📦 Products — `/api/products`

| Method | Endpoint | Access | What it does |
|---|---|---|---|
| GET | `/api/products` | Public | List products (paginated + filters) |
| GET | `/api/products/slug/:slug` | Public | Get product by slug |
| GET | `/api/products/:id` | Public | Get product by ID |
| POST | `/api/products` | Admin | Create product (with images) |
| PUT | `/api/products/:id` | Admin | Update product details |
| POST | `/api/products/:id/images` | Admin | Add more images |
| DELETE | `/api/products/:id/images/:imageId` | Admin | Delete one image |
| DELETE | `/api/products/:id` | Admin | Delete product + all images |

**Query filters for GET `/api/products`:**
```
?page=1&limit=10
&search=shirt          ← searches name + description
&categoryId=3
&minPrice=100&maxPrice=500
&inStock=true
```

**Key details:**
- Images uploaded via **Multer** (stored in memory as Buffer)
- Then sent to **Cloudinary** (or saved locally if Cloudinary not configured)
- Slug auto-generated from product name, unique-checked
- Price snapshot stored in `OrderItem` at purchase time

---

## 🛡️ Middleware Files

### `auth.middleware.js`
- Reads `Authorization: Bearer <token>` header
- Verifies JWT
- Attaches `req.user = { userId, role }` for downstream use

### `admin.middleware.js`
- Checks `req.user.role === "ADMIN"`
- Throws 403 if not admin

### `validate.middleware.js`
- Takes a **Zod schema**
- Validates `req.body`, `req.query`, `req.params`
- Replaces them with parsed/sanitized values
- Returns **400 with field-level errors** if validation fails

### `upload.middleware.js`
- Uses **Multer** with `memoryStorage` (no disk write)
- Only allows image MIME types
- Max file size: **5 MB**
- Used as: `upload.array("images", 5)` — up to 5 images

### `rateLimiter.middleware.js`
- Limits requests per IP to prevent abuse

### `error.middleware.js`
- Global Express error handler (last middleware)
- Handles `ApiError`, Prisma errors, Zod errors
- Returns consistent JSON error format

---

## 🧱 Key Utility Files

### `ApiError.js`
Custom error class with static factory methods:
```js
ApiError.badRequest("message")   // 400
ApiError.unauthorized("message") // 401
ApiError.forbidden("message")    // 403
ApiError.notFound("message")     // 404
ApiError.conflict("message")     // 409
```

### `response.utils.js`
Standard response helpers:
```js
success(res, 200, "message", data)
paginated(res, "message", data, pagination)
```

### `jwt.utils.js`
```js
generateAccessToken(userId, role) // creates JWT
```

### `slug.utils.js`
```js
generateSlug("Batman Shirt") // → "batman-shirt"
```

### `cloudinary.utils.js`
```js
uploadImage(buffer, fileName, folder) // → { url, publicId }
deleteImage(publicId)                 // removes from Cloudinary
```
Falls back to local `/uploads` folder if Cloudinary env vars not set.

---

## 🔄 Request Flow (how a request travels)

```
Client Request
     ↓
Morgan (log)
     ↓
Helmet (security headers)
     ↓
CORS
     ↓
Rate Limiter
     ↓
Body Parser
     ↓
Route matched  →  validate() middleware (Zod check)
                       ↓
                  authenticate() (JWT check)
                       ↓
                  authorizeAdmin() (role check)
                       ↓
                  Controller (handles req/res)
                       ↓
                  Service (business logic + DB)
                       ↓
                  Prisma (PostgreSQL query)
                       ↓
                  Response sent back
```

---

## 🔲 What's NOT Built Yet (Next Stages)

| Stage | Module | Files Needed |
|---|---|---|
| 1 | Cart & Wishlist | cart.service/controller/routes/validator + wishlist |
| 2 | Addresses | address.service/controller/routes/validator |
| 3 | Orders | order.service/controller/routes/validator |
| 4 | Payments | payment.service/controller/routes (Razorpay) |
| 5 | Admin APIs | admin.service/controller/routes |
| 6 | Reviews | Schema + review service/controller/routes |
| 7 | Hardening | Refresh tokens, Winston logging, env validation |
| 8 | Frontend | Next.js app |

> See `implementation_stages_1_2_3.md` for complete ready-to-use code for stages 1, 2, 3.

---

## 🚀 Running the Project

```powershell
# Start dev server (auto-restarts on file change)
cd Backend
npm run dev

# Run DB migrations
npx prisma migrate dev

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Seed database
node prisma/seed.js
```

**Server runs on:** `http://localhost:5000`

---

## 📬 Quick API Test (with curl)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Batman","email":"batman@gotham.com","password":"bruce1234"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"batman@gotham.com","password":"bruce1234"}'

# Get all products
curl http://localhost:5000/api/products

# Get products with filters
curl "http://localhost:5000/api/products?page=1&limit=5&inStock=true"
```
