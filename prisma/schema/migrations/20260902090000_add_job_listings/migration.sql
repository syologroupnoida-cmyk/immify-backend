CREATE TYPE "JobListingReviewStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE "job_listings" (
  "id" TEXT NOT NULL,
  "vendorUserId" TEXT,
  "subscriptionId" TEXT,
  "country" TEXT NOT NULL,
  "cityRegion" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "industry" TEXT NOT NULL,
  "qualification" TEXT,
  "experience" TEXT,
  "indicativeSalary" TEXT,
  "employmentType" TEXT NOT NULL,
  "visaWorkPermit" TEXT,
  "sourceStatus" TEXT,
  "description" TEXT,
  "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "requiredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "vacancyCount" INTEGER NOT NULL DEFAULT 1,
  "applicationEmail" TEXT,
  "applicationUrl" TEXT,
  "applicationDeadline" TIMESTAMP(3),
  "dynamicData" JSONB,
  "reviewStatus" "JobListingReviewStatus" NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByAdminId" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isVisible" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_listings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_listings_vacancy_count_check" CHECK ("vacancyCount" > 0)
);

CREATE INDEX "job_listings_reviewStatus_submittedAt_idx" ON "job_listings"("reviewStatus", "submittedAt");
CREATE INDEX "job_listings_isPublished_isVisible_publishedAt_idx" ON "job_listings"("isPublished", "isVisible", "publishedAt");
CREATE INDEX "job_listings_country_cityRegion_industry_idx" ON "job_listings"("country", "cityRegion", "industry");
CREATE INDEX "job_listings_vendorUserId_createdAt_idx" ON "job_listings"("vendorUserId", "createdAt");
CREATE INDEX "job_listings_subscriptionId_reviewStatus_idx" ON "job_listings"("subscriptionId", "reviewStatus");

ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "vendor_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
