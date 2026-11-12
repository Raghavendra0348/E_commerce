ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order" ADD COLUMN "checkoutKey" TEXT;
ALTER TABLE "Order" ADD COLUMN "checkoutRequestHash" TEXT;
CREATE UNIQUE INDEX "Order_userId_checkoutKey_key" ON "Order"("userId", "checkoutKey");

ALTER TABLE "Payment" ADD COLUMN "razorpayOrderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "razorpayPaymentId" TEXT;

-- Retain the legacy transactionId for API/backward compatibility.
UPDATE "Payment" SET "razorpayOrderId" = "transactionId"
WHERE "provider" = 'razorpay' AND "transactionId" LIKE 'order\_%';
UPDATE "Payment" SET "razorpayPaymentId" = "transactionId"
WHERE "provider" = 'razorpay' AND "transactionId" LIKE 'pay\_%';

CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");
