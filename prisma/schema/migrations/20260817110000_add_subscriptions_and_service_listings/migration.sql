CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "VendorSubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PAYMENT_FAILED');
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "SubscriptionBillingPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

CREATE TABLE "subscription_plans" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT,
  "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'DRAFT', "priceInPaise" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR', "billingPeriod" "SubscriptionBillingPeriod" NOT NULL DEFAULT 'MONTHLY',
  "durationDays" INTEGER NOT NULL, "maxPublicServices" INTEGER, "maxJobPosts" INTEGER,
  "jobPortalAccess" BOOLEAN NOT NULL DEFAULT false, "directLeadCreditPrice" INTEGER NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0, "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "createdByAdminId" TEXT NOT NULL, "updatedByAdminId" TEXT, "activatedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_plans_values_check" CHECK ("priceInPaise" >= 0 AND "durationDays" > 0 AND "directLeadCreditPrice" > 0 AND ("maxPublicServices" IS NULL OR "maxPublicServices" > 0) AND ("maxJobPosts" IS NULL OR "maxJobPosts" > 0))
);
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");
CREATE INDEX "subscription_plans_status_displayOrder_idx" ON "subscription_plans"("status", "displayOrder");

CREATE TABLE "subscription_plan_categories" (
  "planId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_plan_categories_pkey" PRIMARY KEY ("planId", "categoryId")
);
CREATE INDEX "subscription_plan_categories_categoryId_idx" ON "subscription_plan_categories"("categoryId");

CREATE TABLE "vendor_subscriptions" (
  "id" TEXT NOT NULL, "vendorUserId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "status" "VendorSubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT', "startsAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3), "cancellationReason" TEXT, "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  "planNameSnapshot" TEXT NOT NULL, "priceInPaiseSnapshot" INTEGER NOT NULL, "currencySnapshot" TEXT NOT NULL,
  "maxPublicServicesSnapshot" INTEGER, "maxJobPostsSnapshot" INTEGER, "jobPortalAccessSnapshot" BOOLEAN NOT NULL,
  "directLeadCreditPriceSnapshot" INTEGER NOT NULL, "durationDaysSnapshot" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vendor_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_subscriptions_vendorUserId_status_expiresAt_idx" ON "vendor_subscriptions"("vendorUserId", "status", "expiresAt");
CREATE INDEX "vendor_subscriptions_planId_status_idx" ON "vendor_subscriptions"("planId", "status");

CREATE TABLE "vendor_subscription_categories" (
  "subscriptionId" TEXT NOT NULL, "categoryId" TEXT NOT NULL,
  CONSTRAINT "vendor_subscription_categories_pkey" PRIMARY KEY ("subscriptionId", "categoryId")
);
CREATE INDEX "vendor_subscription_categories_categoryId_idx" ON "vendor_subscription_categories"("categoryId");

CREATE TABLE "subscription_payments" (
  "id" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL, "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'CREATED',
  "provider" TEXT NOT NULL DEFAULT 'MANUAL', "providerOrderId" TEXT, "providerPaymentId" TEXT,
  "amountInPaise" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'INR', "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3), "refundedAt" TIMESTAMP(3), "providerResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subscription_payments_providerOrderId_key" ON "subscription_payments"("providerOrderId");
CREATE UNIQUE INDEX "subscription_payments_providerPaymentId_key" ON "subscription_payments"("providerPaymentId");
CREATE INDEX "subscription_payments_subscriptionId_status_idx" ON "subscription_payments"("subscriptionId", "status");

CREATE TABLE "vendor_service_listings" (
  "id" TEXT NOT NULL, "vendorUserId" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "serviceId" TEXT,
  "title" TEXT NOT NULL, "description" TEXT, "dynamicData" JSONB, "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isVisible" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "vendor_service_listings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_service_listings_vendorUserId_isPublished_isVisible_idx" ON "vendor_service_listings"("vendorUserId", "isPublished", "isVisible");
CREATE INDEX "vendor_service_listings_categoryId_isPublished_isVisible_idx" ON "vendor_service_listings"("categoryId", "isPublished", "isVisible");

ALTER TABLE "leads" ADD COLUMN "serviceListingId" TEXT;
CREATE INDEX "leads_serviceListingId_createdAt_idx" ON "leads"("serviceListingId", "createdAt");

ALTER TABLE "subscription_plan_categories" ADD CONSTRAINT "subscription_plan_categories_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_plan_categories" ADD CONSTRAINT "subscription_plan_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_subscription_categories" ADD CONSTRAINT "vendor_subscription_categories_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "vendor_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_subscription_categories" ADD CONSTRAINT "vendor_subscription_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "vendor_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_service_listings" ADD CONSTRAINT "vendor_service_listings_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_service_listings" ADD CONSTRAINT "vendor_service_listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_service_listings" ADD CONSTRAINT "vendor_service_listings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_serviceListingId_fkey" FOREIGN KEY ("serviceListingId") REFERENCES "vendor_service_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
