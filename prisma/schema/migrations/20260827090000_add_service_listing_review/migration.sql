CREATE TYPE "ServiceListingReviewStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "vendor_service_listings"
  ALTER COLUMN "title" DROP NOT NULL,
  ADD COLUMN "includes" JSONB,
  ADD COLUMN "chargesIncludeGst" BOOLEAN,
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "overview" TEXT,
  ADD COLUMN "process" TEXT,
  ADD COLUMN "pricingDetails" TEXT,
  ADD COLUMN "termsAndConditions" TEXT,
  ADD COLUMN "reviewStatus" "ServiceListingReviewStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedByAdminId" TEXT,
  ADD COLUMN "rejectionReason" TEXT;

UPDATE "vendor_service_listings"
SET "reviewStatus" = 'APPROVED',
    "submittedAt" = "createdAt",
    "reviewedAt" = "updatedAt"
WHERE "isPublished" = TRUE;

CREATE INDEX "vendor_service_listings_reviewStatus_submittedAt_idx"
  ON "vendor_service_listings"("reviewStatus", "submittedAt");
