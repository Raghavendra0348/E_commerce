ALTER TABLE "Product"
ADD COLUMN "originalPrice" DECIMAL(10,2),
ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Product" ADD CONSTRAINT "Product_discount_bounds"
CHECK ("discountPercent" BETWEEN 0 AND 99);
