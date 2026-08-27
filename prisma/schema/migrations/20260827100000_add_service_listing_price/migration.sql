ALTER TABLE "vendor_service_listings"
  ADD COLUMN "priceInPaise" INTEGER,
  ADD COLUMN "currency" TEXT DEFAULT 'INR';

ALTER TABLE "vendor_service_listings"
  ADD CONSTRAINT "vendor_service_listings_price_check"
  CHECK ("priceInPaise" IS NULL OR "priceInPaise" >= 0);
