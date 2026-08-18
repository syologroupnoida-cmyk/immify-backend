-- Lead marketplace enums
CREATE TYPE "LeadType" AS ENUM ('GLOBAL', 'DIRECT');
CREATE TYPE "LeadStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'REJECTED', 'EXPIRED', 'CLOSED');
CREATE TYPE "LeadPurchaseStatus" AS ENUM ('COMPLETED', 'REFUNDED');
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'LEAD_UNLOCK', 'REFUND', 'ADMIN_ADJUSTMENT');

ALTER TABLE "vendor_profiles" ADD COLUMN "creditBalance" INTEGER NOT NULL DEFAULT 0;

-- Preserve historical leads when catalog rows are retired.
ALTER TABLE "services" DROP CONSTRAINT "services_categoryId_fkey";
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "vendor_category_offerings" (
  "vendorUserId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vendor_category_offerings_pkey" PRIMARY KEY ("vendorUserId", "categoryId")
);

CREATE TABLE "vendor_service_offerings" (
  "vendorUserId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPubliclyListed" BOOLEAN NOT NULL DEFAULT false,
  "title" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vendor_service_offerings_pkey" PRIMARY KEY ("vendorUserId", "serviceId")
);

CREATE TABLE "leads" (
  "id" TEXT NOT NULL,
  "type" "LeadType" NOT NULL DEFAULT 'GLOBAL',
  "status" "LeadStatus" NOT NULL DEFAULT 'PENDING',
  "clientUserId" TEXT,
  "categoryId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "directVendorUserId" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "country" TEXT,
  "state" TEXT,
  "city" TEXT,
  "message" TEXT,
  "metadata" JSONB,
  "creditCost" INTEGER,
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "expiresAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "leads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "leads_global_direct_target_check" CHECK (
    ("type" = 'GLOBAL' AND "directVendorUserId" IS NULL) OR
    ("type" = 'DIRECT' AND "directVendorUserId" IS NOT NULL)
  ),
  CONSTRAINT "leads_credit_cost_check" CHECK ("creditCost" IS NULL OR "creditCost" > 0),
  CONSTRAINT "leads_active_global_price_check" CHECK (
    "type" <> 'GLOBAL' OR "status" <> 'ACTIVE' OR "creditCost" > 0
  )
);

CREATE TABLE "lead_purchases" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "creditsSpent" INTEGER NOT NULL,
  "status" "LeadPurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "refundedAt" TIMESTAMP(3),
  CONSTRAINT "lead_purchases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lead_purchases_credits_check" CHECK ("creditsSpent" > 0)
);

CREATE TABLE "vendor_credit_transactions" (
  "id" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "leadPurchaseId" TEXT,
  "type" "CreditTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_credit_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vendor_credit_balance_check" CHECK ("balanceAfter" >= 0)
);

CREATE INDEX "services_categoryId_isActive_idx" ON "services"("categoryId", "isActive");
CREATE INDEX "vendor_category_offerings_categoryId_isActive_idx" ON "vendor_category_offerings"("categoryId", "isActive");
CREATE INDEX "vendor_service_offerings_serviceId_isActive_idx" ON "vendor_service_offerings"("serviceId", "isActive");
CREATE INDEX "vendor_service_offerings_vendorUserId_isPubliclyListed_isActive_idx" ON "vendor_service_offerings"("vendorUserId", "isPubliclyListed", "isActive");
CREATE INDEX "leads_type_status_categoryId_createdAt_idx" ON "leads"("type", "status", "categoryId", "createdAt");
CREATE INDEX "leads_type_status_serviceId_createdAt_idx" ON "leads"("type", "status", "serviceId", "createdAt");
CREATE INDEX "leads_directVendorUserId_status_createdAt_idx" ON "leads"("directVendorUserId", "status", "createdAt");
CREATE INDEX "leads_clientUserId_createdAt_idx" ON "leads"("clientUserId", "createdAt");
CREATE INDEX "leads_expiresAt_idx" ON "leads"("expiresAt");
CREATE UNIQUE INDEX "lead_purchases_leadId_vendorUserId_key" ON "lead_purchases"("leadId", "vendorUserId");
CREATE INDEX "lead_purchases_vendorUserId_purchasedAt_idx" ON "lead_purchases"("vendorUserId", "purchasedAt");
CREATE INDEX "lead_purchases_leadId_status_idx" ON "lead_purchases"("leadId", "status");
CREATE UNIQUE INDEX "vendor_credit_transactions_leadPurchaseId_key" ON "vendor_credit_transactions"("leadPurchaseId");
CREATE INDEX "vendor_credit_transactions_vendorUserId_createdAt_idx" ON "vendor_credit_transactions"("vendorUserId", "createdAt");

ALTER TABLE "vendor_category_offerings" ADD CONSTRAINT "vendor_category_offerings_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_category_offerings" ADD CONSTRAINT "vendor_category_offerings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_service_offerings" ADD CONSTRAINT "vendor_service_offerings_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_service_offerings" ADD CONSTRAINT "vendor_service_offerings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_directVendorUserId_fkey" FOREIGN KEY ("directVendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_credit_transactions" ADD CONSTRAINT "vendor_credit_transactions_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_credit_transactions" ADD CONSTRAINT "vendor_credit_transactions_leadPurchaseId_fkey" FOREIGN KEY ("leadPurchaseId") REFERENCES "lead_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
