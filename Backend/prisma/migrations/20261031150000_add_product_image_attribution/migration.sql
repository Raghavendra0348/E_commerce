ALTER TABLE "ProductImage"
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "photographer" TEXT,
  ADD COLUMN "photographerUrl" TEXT;

CREATE INDEX "ProductImage_sourceUrl_idx" ON "ProductImage"("sourceUrl");
