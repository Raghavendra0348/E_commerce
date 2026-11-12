CREATE TYPE "RefundAttemptStatus" AS ENUM ('SUBMITTING', 'PENDING', 'PROCESSED', 'FAILED', 'UNKNOWN');
ALTER TABLE "Payment" ADD COLUMN "cashCollectedAt" TIMESTAMP(3), ADD COLUMN "cashCollectedBy" INTEGER;
CREATE TABLE "RefundAttempt" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "requestKey" TEXT NOT NULL,
    "gatewayRefundId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "RefundAttemptStatus" NOT NULL DEFAULT 'SUBMITTING',
    "requestedById" INTEGER NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RefundAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RefundAttempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RefundAttempt_requestKey_key" ON "RefundAttempt"("requestKey");
CREATE UNIQUE INDEX "RefundAttempt_gatewayRefundId_key" ON "RefundAttempt"("gatewayRefundId");
CREATE UNIQUE INDEX "RefundAttempt_paymentId_attemptNumber_key" ON "RefundAttempt"("paymentId", "attemptNumber");
