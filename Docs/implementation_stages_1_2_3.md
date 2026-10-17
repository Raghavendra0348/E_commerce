# 🛠️ Implementation Guide — Stage 1, 2 & 3

> Follow this file top-to-bottom. Each stage is self-contained.
> All code follows the same patterns as your existing `product.service.js` / `category.controller.js`.

---

## ✅ Pre-flight Checklist

- [x] PostgreSQL running
- [x] Prisma migrations done (`Cart`, `CartItem`, `Wishlist`, `Address`, `Order`, `OrderItem` models exist)
- [x] `npm run dev` running

---

## 📦 Stage 1 — Cart & Wishlist

### Files to create (7 total)

```
src/validators/cart.validator.js
src/services/cart.service.js
src/controllers/cart.controller.js
src/routes/cart.routes.js

src/services/wishlist.service.js
src/controllers/wishlist.controller.js
src/routes/wishlist.routes.js
```

---

### 1.1 `src/validators/cart.validator.js`

```js
const { z } = require("zod");

const addToCartSchema = z.object({
    body: z.object({
        productId: z.number({ required_error: "productId is required" }).int().positive(),
        quantity: z.number().int().min(1).max(100).default(1)
    })
});

const updateCartItemSchema = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/, "productId must be a number")
    }),
    body: z.object({
        quantity: z.number({ required_error: "quantity is required" }).int().min(1).max(100)
    })
});

const cartProductParamSchema = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/, "productId must be a number")
    })
});

module.exports = { addToCartSchema, updateCartItemSchema, cartProductParamSchema };
```

---

### 1.2 `src/services/cart.service.js`

```js
const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Get or create a cart for the user (lazy creation).
 */
const getOrCreateCart = async (userId) => {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
    }
    return cart;
};

/**
 * Get the user's full cart with all items and product details.
 */
const getCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true, name: true, slug: true, price: true, stock: true,
                            images: { select: { url: true, altText: true }, take: 1 }
                        }
                    }
                }
            }
        }
    });

    if (!cart) return { items: [], totalItems: 0, totalPrice: "0.00" };

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items
        .reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0)
        .toFixed(2);

    return { ...cart, totalItems, totalPrice };
};

/**
 * Add item to cart. If already exists, increment quantity.
 */
const addToCart = async (userId, productId, quantity = 1) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");
    if (product.stock < quantity) throw ApiError.badRequest(`Only ${product.stock} units in stock`);

    const cart = await getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } }
    });

    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (product.stock < newQty) throw ApiError.badRequest(`Only ${product.stock} units in stock`);
        await prisma.cartItem.update({
            where: { cartId_productId: { cartId: cart.id, productId } },
            data: { quantity: newQty }
        });
    } else {
        await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
    }

    return getCart(userId);
};

/**
 * Update quantity of a specific cart item.
 */
const updateCartItem = async (userId, productId, quantity) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");
    if (product.stock < quantity) throw ApiError.badRequest(`Only ${product.stock} units in stock`);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw ApiError.notFound("Cart not found");

    const item = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } }
    });
    if (!item) throw ApiError.notFound("Item not in cart");

    await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity }
    });

    return getCart(userId);
};

/**
 * Remove a single item from cart.
 */
const removeCartItem = async (userId, productId) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw ApiError.notFound("Cart not found");

    const item = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } }
    });
    if (!item) throw ApiError.notFound("Item not in cart");

    await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
    return getCart(userId);
};

/**
 * Clear all items from the cart.
 */
const clearCart = async (userId) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
```

---

### 1.3 `src/controllers/cart.controller.js`

```js
const cartService = require("../services/cart.service");
const { success } = require("../utils/response.utils");

const getCart = async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req.user.userId);
        return success(res, 200, "Cart fetched successfully", cart);
    } catch (error) { next(error); }
};

const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await cartService.addToCart(req.user.userId, productId, quantity);
        return success(res, 200, "Item added to cart", cart);
    } catch (error) { next(error); }
};

const updateCartItem = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const cart = await cartService.updateCartItem(req.user.userId, productId, req.body.quantity);
        return success(res, 200, "Cart item updated", cart);
    } catch (error) { next(error); }
};

const removeCartItem = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const cart = await cartService.removeCartItem(req.user.userId, productId);
        return success(res, 200, "Item removed from cart", cart);
    } catch (error) { next(error); }
};

const clearCart = async (req, res, next) => {
    try {
        await cartService.clearCart(req.user.userId);
        return success(res, 200, "Cart cleared");
    } catch (error) { next(error); }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
```

---

### 1.4 `src/routes/cart.routes.js`

```js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { addToCartSchema, updateCartItemSchema, cartProductParamSchema } = require("../validators/cart.validator");

router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/items", validate(addToCartSchema), cartController.addToCart);
router.patch("/items/:productId", validate(updateCartItemSchema), cartController.updateCartItem);
router.delete("/items/:productId", validate(cartProductParamSchema), cartController.removeCartItem);
router.delete("/", cartController.clearCart);

module.exports = router;
```

---

### 1.5 `src/services/wishlist.service.js`

```js
const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

const getWishlist = async (userId) => {
    return prisma.wishlist.findMany({
        where: { userId },
        include: {
            product: {
                select: {
                    id: true, name: true, slug: true, price: true, stock: true,
                    images: { select: { url: true, altText: true }, take: 1 }
                }
            }
        }
    });
};

/**
 * Toggle: add if not present, remove if already there.
 */
const toggleWishlist = async (userId, productId) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const existing = await prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } }
    });

    if (existing) {
        await prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
        return { action: "removed", productId };
    } else {
        await prisma.wishlist.create({ data: { userId, productId } });
        return { action: "added", productId };
    }
};

const removeFromWishlist = async (userId, productId) => {
    const item = await prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } }
    });
    if (!item) throw ApiError.notFound("Item not in wishlist");
    await prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
};

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
```

---

### 1.6 `src/controllers/wishlist.controller.js`

```js
const wishlistService = require("../services/wishlist.service");
const { success } = require("../utils/response.utils");

const getWishlist = async (req, res, next) => {
    try {
        const items = await wishlistService.getWishlist(req.user.userId);
        return success(res, 200, "Wishlist fetched successfully", items);
    } catch (error) { next(error); }
};

const toggleWishlist = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const result = await wishlistService.toggleWishlist(req.user.userId, productId);
        return success(res, 200, `Product ${result.action} wishlist`, result);
    } catch (error) { next(error); }
};

const removeFromWishlist = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        await wishlistService.removeFromWishlist(req.user.userId, productId);
        return success(res, 200, "Removed from wishlist");
    } catch (error) { next(error); }
};

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
```

---

### 1.7 `src/routes/wishlist.routes.js`

```js
const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", wishlistController.getWishlist);
router.post("/:productId", wishlistController.toggleWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);

module.exports = router;
```

---

### 1.8 Register in `app.js`

```js
const cartRoutes     = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");

app.use("/api/cart",     cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
```

---

### Stage 1 — API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | User | Get cart |
| POST | `/api/cart/items` | User | Add item |
| PATCH | `/api/cart/items/:productId` | User | Update qty |
| DELETE | `/api/cart/items/:productId` | User | Remove item |
| DELETE | `/api/cart` | User | Clear cart |
| GET | `/api/wishlist` | User | Get wishlist |
| POST | `/api/wishlist/:productId` | User | Toggle add/remove |
| DELETE | `/api/wishlist/:productId` | User | Remove from wishlist |

---

---

## 📦 Stage 2 — Address Management

### Files to create (4 total)

```
src/validators/address.validator.js
src/services/address.service.js
src/controllers/address.controller.js
src/routes/address.routes.js
```

---

### 2.1 `src/validators/address.validator.js`

```js
const { z } = require("zod");

const addressBody = z.object({
    name:       z.string().min(2).max(100),
    phone:      z.string().min(7).max(15),
    address:    z.string().min(5).max(255),
    city:       z.string().min(2).max(100),
    state:      z.string().min(2).max(100),
    postalCode: z.string().min(4).max(10),
    country:    z.string().min(2).max(100).default("India")
});

const createAddressSchema = z.object({ body: addressBody });

const updateAddressSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: addressBody.partial()
});

const addressIdSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) })
});

module.exports = { createAddressSchema, updateAddressSchema, addressIdSchema };
```

---

### 2.2 `src/services/address.service.js`

```js
const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

const getAddresses = async (userId) => {
    return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
};

const createAddress = async (userId, data) => {
    return prisma.address.create({ data: { ...data, userId } });
};

const updateAddress = async (userId, id, data) => {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw ApiError.notFound("Address not found");
    return prisma.address.update({ where: { id }, data });
};

const deleteAddress = async (userId, id) => {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw ApiError.notFound("Address not found");
    await prisma.address.delete({ where: { id } });
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };
```

---

### 2.3 `src/controllers/address.controller.js`

```js
const addressService = require("../services/address.service");
const { success } = require("../utils/response.utils");

const getAddresses = async (req, res, next) => {
    try {
        const addresses = await addressService.getAddresses(req.user.userId);
        return success(res, 200, "Addresses fetched successfully", addresses);
    } catch (error) { next(error); }
};

const createAddress = async (req, res, next) => {
    try {
        const address = await addressService.createAddress(req.user.userId, req.body);
        return success(res, 201, "Address created successfully", address);
    } catch (error) { next(error); }
};

const updateAddress = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const address = await addressService.updateAddress(req.user.userId, id, req.body);
        return success(res, 200, "Address updated successfully", address);
    } catch (error) { next(error); }
};

const deleteAddress = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await addressService.deleteAddress(req.user.userId, id);
        return success(res, 200, "Address deleted successfully");
    } catch (error) { next(error); }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };
```

---

### 2.4 `src/routes/address.routes.js`

```js
const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createAddressSchema, updateAddressSchema, addressIdSchema } = require("../validators/address.validator");

router.use(authenticate);

router.get("/", addressController.getAddresses);
router.post("/", validate(createAddressSchema), addressController.createAddress);
router.put("/:id", validate(updateAddressSchema), addressController.updateAddress);
router.delete("/:id", validate(addressIdSchema), addressController.deleteAddress);

module.exports = router;
```

---

### 2.5 Register in `app.js`

```js
const addressRoutes = require("./routes/address.routes");
app.use("/api/addresses", addressRoutes);
```

---

### Stage 2 — API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/addresses` | User | List saved addresses |
| POST | `/api/addresses` | User | Add new address |
| PUT | `/api/addresses/:id` | User | Update address |
| DELETE | `/api/addresses/:id` | User | Delete address |

---

---

## 📦 Stage 3 — Orders

### Files to create (4 total)

```
src/validators/order.validator.js
src/services/order.service.js
src/controllers/order.controller.js
src/routes/order.routes.js
```

---

### 3.1 `src/validators/order.validator.js`

```js
const { z } = require("zod");

const placeOrderSchema = z.object({
    body: z.object({
        addressId: z.number({ required_error: "addressId is required" }).int().positive()
    })
});

const orderIdSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) })
});

const updateOrderStatusSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: z.object({
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    })
});

module.exports = { placeOrderSchema, orderIdSchema, updateOrderStatusSchema };
```

---

### 3.2 `src/services/order.service.js`

```js
const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Place a new order from the user's current cart.
 * Atomic transaction: validate stock → create order → deduct stock → clear cart.
 */
const placeOrder = async (userId, addressId) => {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw ApiError.notFound("Address not found");

    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) throw ApiError.badRequest("Your cart is empty");

    // Validate stock
    for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
            throw ApiError.badRequest(
                `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}`
            );
        }
    }

    const totalAmount = cart.items.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0
    );

    return prisma.$transaction(async (tx) => {
        // Create order with items (price snapshot)
        const order = await tx.order.create({
            data: {
                userId,
                totalAmount,
                items: {
                    create: cart.items.map((item) => ({
                        productId: item.productId,
                        quantity:  item.quantity,
                        price:     item.product.price
                    }))
                }
            },
            include: {
                items: { include: { product: { select: { id: true, name: true, slug: true } } } }
            }
        });

        // Deduct stock
        for (const item of cart.items) {
            await tx.product.update({
                where: { id: item.productId },
                data:  { stock: { decrement: item.quantity } }
            });
        }

        // Clear cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return order;
    });
};

/**
 * Paginated order history for a user.
 */
const getUserOrders = async (userId, query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const [total, orders] = await Promise.all([
        prisma.order.count({ where: { userId } }),
        prisma.order.findMany({
            where: { userId }, skip, take: limit, orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, slug: true, images: { take: 1 } } }
                    }
                }
            }
        })
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

/**
 * Single order — user can only access their own.
 */
const getOrderById = async (userId, orderId) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
            items: {
                include: {
                    product: { select: { id: true, name: true, slug: true, images: { take: 1 } } }
                }
            },
            payment: true
        }
    });
    if (!order) throw ApiError.notFound("Order not found");
    return order;
};

/**
 * Cancel order — only PENDING or CONFIRMED, rolls back stock.
 */
const cancelOrder = async (userId, orderId) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { items: true }
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw ApiError.badRequest(`Cannot cancel an order with status "${order.status}"`);
    }

    await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data:  { stock: { increment: item.quantity } }
            });
        }
    });
};

// ── Admin ────────────────────────────────────────────────────────────────────

const getAllOrders = async (query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip  = (page - 1) * limit;
    const where = {};
    if (query.status) where.status = query.status;

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where, skip, take: limit, orderBy: { createdAt: "desc" },
            include: {
                user:  { select: { id: true, name: true, email: true } },
                items: true
            }
        })
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const updateOrderStatus = async (orderId, status) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound("Order not found");
    return prisma.order.update({ where: { id: orderId }, data: { status } });
};

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
```

---

### 3.3 `src/controllers/order.controller.js`

```js
const orderService = require("../services/order.service");
const { success, paginated } = require("../utils/response.utils");

const placeOrder = async (req, res, next) => {
    try {
        const order = await orderService.placeOrder(req.user.userId, req.body.addressId);
        return success(res, 201, "Order placed successfully", order);
    } catch (error) { next(error); }
};

const getUserOrders = async (req, res, next) => {
    try {
        const { orders, pagination } = await orderService.getUserOrders(req.user.userId, req.query);
        return paginated(res, "Orders fetched successfully", orders, pagination);
    } catch (error) { next(error); }
};

const getOrderById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const order = await orderService.getOrderById(req.user.userId, id);
        return success(res, 200, "Order fetched successfully", order);
    } catch (error) { next(error); }
};

const cancelOrder = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await orderService.cancelOrder(req.user.userId, id);
        return success(res, 200, "Order cancelled successfully");
    } catch (error) { next(error); }
};

const getAllOrders = async (req, res, next) => {
    try {
        const { orders, pagination } = await orderService.getAllOrders(req.query);
        return paginated(res, "Orders fetched successfully", orders, pagination);
    } catch (error) { next(error); }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const order = await orderService.updateOrderStatus(id, req.body.status);
        return success(res, 200, "Order status updated", order);
    } catch (error) { next(error); }
};

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
```

---

### 3.4 `src/routes/order.routes.js`

```js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeAdmin = require("../middleware/admin.middleware");
const validate = require("../middleware/validate.middleware");
const { placeOrderSchema, orderIdSchema, updateOrderStatusSchema } = require("../validators/order.validator");

// ── User Routes ───────────────────────────────────────────────────────────────
router.post("/", authenticate, validate(placeOrderSchema), orderController.placeOrder);
router.get("/", authenticate, orderController.getUserOrders);
router.get("/:id", authenticate, validate(orderIdSchema), orderController.getOrderById);
router.post("/:id/cancel", authenticate, validate(orderIdSchema), orderController.cancelOrder);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get("/admin/all", authenticate, authorizeAdmin, orderController.getAllOrders);
router.patch("/admin/:id/status", authenticate, authorizeAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
```

---

### 3.5 Register in `app.js`

```js
const orderRoutes = require("./routes/order.routes");
app.use("/api/orders", orderRoutes);
```

---

### Stage 3 — API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | User | Place order from cart |
| GET | `/api/orders` | User | Order history (paginated) |
| GET | `/api/orders/:id` | User | Single order detail |
| POST | `/api/orders/:id/cancel` | User | Cancel order |
| GET | `/api/orders/admin/all` | Admin | All orders |
| PATCH | `/api/orders/admin/:id/status` | Admin | Update order status |

---

## ✅ Final Checklist

```
Stage 1 — Cart & Wishlist
  [ ] cart.validator.js
  [ ] cart.service.js
  [ ] cart.controller.js
  [ ] cart.routes.js
  [ ] wishlist.service.js
  [ ] wishlist.controller.js
  [ ] wishlist.routes.js
  [ ] Registered /api/cart and /api/wishlist in app.js

Stage 2 — Addresses
  [ ] address.validator.js
  [ ] address.service.js
  [ ] address.controller.js
  [ ] address.routes.js
  [ ] Registered /api/addresses in app.js

Stage 3 — Orders
  [ ] order.validator.js
  [ ] order.service.js
  [ ] order.controller.js
  [ ] order.routes.js
  [ ] Registered /api/orders in app.js
```

> After completing Stage 3, test the full user flow:
> Register → Login → Browse Products → Add to Cart → Save Address → Place Order → Check Order Status
