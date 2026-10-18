const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DATA_DIR = __dirname;

// Small CSV parser that supports quoted fields, escaped quotes, commas and newlines.
function parseCsv(fileName) {
  const input = fs.readFileSync(path.join(DATA_DIR, fileName), "utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field.length === 0) quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") {
      row.push(field); field = "";
      if (row.some((v) => v.length > 0)) rows.push(row);
      row = [];
    } else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])));
}

function required(value, label) {
  if (value === undefined || value === null || value === "") throw new Error(`Missing ${label}`);
  return value;
}
function int(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n)) throw new Error(`Invalid integer for ${label}: ${value}`);
  return n;
}
function decimal(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount for ${label}: ${value}`);
  return n.toFixed(2);
}

async function main() {
  console.log("Importing CSV seed data (existing records will not be deleted)...");

  // 1. Categories
  const categoryBySlug = new Map();
  for (const row of parseCsv("categories.csv")) {
    const category = await prisma.category.upsert({
      where: { slug: required(row.slug, "category.slug") },
      update: {}, // preserve existing category fields
      create: { slug: row.slug, name: required(row.name, "category.name") },
    });
    categoryBySlug.set(row.slug, category);
  }

  // 2. Products
  const productBySlug = new Map();
  for (const row of parseCsv("products.csv")) {
    const category = categoryBySlug.get(required(row.categorySlug, "product.categorySlug"));
    if (!category) throw new Error(`Unknown categorySlug "${row.categorySlug}" for product ${row.slug}`);
    const data = {
      name: required(row.name, "product.name"),
      slug: required(row.slug, "product.slug"),
      description: required(row.description, "product.description"),
      price: decimal(row.price, "product.price"),
      stock: int(row.stock, "product.stock"),
      categoryId: category.id,
    };
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {}, // preserve existing product data
      create: data,
    });
    productBySlug.set(row.slug, product);
  }

  // 3. Users. Hash passwords only for newly created seed users; never overwrite existing credentials/roles.
  const userByEmail = new Map();
  for (const row of parseCsv("users.csv")) {
    const email = required(row.email, "user.email");
    const existing = await prisma.user.findUnique({ where: { email } });
    let user = existing;
    if (!existing) {
      const passwordHash = await bcrypt.hash(required(row.password, "user.password"), 12);
      user = await prisma.user.create({
        data: {
          name: required(row.name, "user.name"),
          email,
          password: passwordHash,
          phone: row.phone || null,
          role: row.role === "ADMIN" ? "ADMIN" : "USER",
        },
      });
    }
    userByEmail.set(email, user);
  }

  // 4. Product images (no unique constraint in the schema, so check before create).
  for (const row of parseCsv("product_images.csv")) {
    const product = productBySlug.get(required(row.productSlug, "image.productSlug"));
    if (!product) throw new Error(`Unknown productSlug for image: ${row.productSlug}`);
    const url = required(row.url, "image.url");
    const found = await prisma.productImage.findFirst({ where: { productId: product.id, url } });
    if (!found) await prisma.productImage.create({
      data: { productId: product.id, url, altText: row.altText || null },
    });
  }

  // 5. Addresses
  for (const row of parseCsv("addresses.csv")) {
    const user = userByEmail.get(required(row.userEmail, "address.userEmail"));
    if (!user) throw new Error(`Unknown address userEmail: ${row.userEmail}`);
    const exists = await prisma.address.findFirst({
      where: { userId: user.id, address: row.address, postalCode: row.postalCode },
    });
    if (!exists) await prisma.address.create({
      data: {
        userId: user.id, name: row.name, phone: row.phone, address: row.address,
        city: row.city, state: row.state, postalCode: row.postalCode, country: row.country || "India",
      },
    });
  }

  // 6. Carts and cart items
  const cartByEmail = new Map();
  for (const row of parseCsv("carts.csv")) {
    const user = userByEmail.get(required(row.userEmail, "cart.userEmail"));
    if (!user) throw new Error(`Unknown cart userEmail: ${row.userEmail}`);
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    cartByEmail.set(row.userEmail, cart);
  }
  for (const row of parseCsv("cart_items.csv")) {
    const cart = cartByEmail.get(required(row.userEmail, "cart item userEmail"));
    const product = productBySlug.get(required(row.productSlug, "cart item productSlug"));
    if (!cart || !product) throw new Error(`Unknown cart/product reference in cart_items.csv: ${JSON.stringify(row)}`);
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      update: {},
      create: { cartId: cart.id, productId: product.id, quantity: int(row.quantity, "cart item quantity") },
    });
  }

  // 7. Orders and their items; orderRef is a CSV-only key, not a database column.
  const orderByRef = new Map();
  const orderRows = parseCsv("orders.csv");
  const itemRows = parseCsv("order_items.csv");
  const paymentRows = parseCsv("payments.csv");
  const itemsByOrder = new Map();
  for (const row of itemRows) {
    if (!itemsByOrder.has(row.orderRef)) itemsByOrder.set(row.orderRef, []);
    itemsByOrder.get(row.orderRef).push(row);
  }

  for (const row of orderRows) {
    const user = userByEmail.get(required(row.userEmail, "order.userEmail"));
    if (!user) throw new Error(`Unknown order userEmail: ${row.userEmail}`);
    const orderItems = itemsByOrder.get(row.orderRef) || [];
    if (!orderItems.length) throw new Error(`Order ${row.orderRef} has no items`);
    const computedTotal = orderItems.reduce((sum, item) => sum + Number(item.price) * int(item.quantity, "order item quantity"), 0);
    if (Math.abs(computedTotal - Number(row.totalAmount)) > 0.02) {
      throw new Error(`Order total mismatch for ${row.orderRef}: CSV ${row.totalAmount}, calculated ${computedTotal.toFixed(2)}`);
    }

    // There is no orderRef column in Prisma Order. For repeatability, identify a seeded order
    // by user, exact amount, status and createdAt timestamp. Existing unrelated orders are untouched.
    const createdAt = new Date(row.createdAt);
    let order = await prisma.order.findFirst({
      where: { userId: user.id, totalAmount: decimal(row.totalAmount, "order.totalAmount"), status: row.status, createdAt },
    });
    if (!order) {
      order = await prisma.order.create({
        data: {
          userId: user.id,
          totalAmount: decimal(row.totalAmount, "order.totalAmount"),
          status: row.status,
          paymentStatus: row.paymentStatus,
          createdAt,
        },
      });
      for (const item of orderItems) {
        const product = productBySlug.get(required(item.productSlug, "order item productSlug"));
        if (!product) throw new Error(`Unknown productSlug in order_items.csv: ${item.productSlug}`);
        await prisma.orderItem.create({
          data: {
            orderId: order.id, productId: product.id,
            quantity: int(item.quantity, "order item quantity"),
            price: decimal(item.price, "order item price"),
          },
        });
      }
    }
    orderByRef.set(row.orderRef, order);
  }

  // 8. Payments
  for (const row of paymentRows) {
    const order = orderByRef.get(required(row.orderRef, "payment.orderRef"));
    if (!order) throw new Error(`Unknown payment orderRef: ${row.orderRef}`);
    const existing = await prisma.payment.findUnique({ where: { orderId: order.id } });
    if (!existing) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: decimal(row.amount, "payment.amount"),
          status: row.status,
          provider: row.provider || "SIMULATED",
          transactionId: row.transactionId || null,
        },
      });
    }
  }

  // 9. Wishlists and reviews
  for (const row of parseCsv("wishlists.csv")) {
    const user = userByEmail.get(required(row.userEmail, "wishlist.userEmail"));
    const product = productBySlug.get(required(row.productSlug, "wishlist.productSlug"));
    if (!user || !product) throw new Error(`Unknown wishlist reference: ${JSON.stringify(row)}`);
    await prisma.wishlist.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      update: {},
      create: { userId: user.id, productId: product.id },
    });
  }
  for (const row of parseCsv("reviews.csv")) {
    const user = userByEmail.get(required(row.userEmail, "review.userEmail"));
    const product = productBySlug.get(required(row.productSlug, "review.productSlug"));
    const rating = int(row.rating, "review.rating");
    if (!user || !product) throw new Error(`Unknown review reference: ${JSON.stringify(row)}`);
    if (rating < 1 || rating > 5) throw new Error(`Review rating must be 1-5: ${rating}`);
    await prisma.review.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      update: {},
      create: { userId: user.id, productId: product.id, rating, comment: row.comment || null },
    });
  }

  console.log("Seed CSV import complete. Existing records were not deleted.");
}

main()
  .catch((error) => {
    console.error("Seed CSV import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
