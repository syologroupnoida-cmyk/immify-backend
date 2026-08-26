ALTER TABLE "subscription_plans"
  ADD COLUMN "offerPriceInPaise" INTEGER,
  ADD COLUMN "trialDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "includedCredits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "priorityWeight" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "displayContent" JSONB NOT NULL DEFAULT '{"badgeText":null,"ribbonText":null,"iconUrl":"","themeColor":"#2563EB","ctaButtonText":"Choose Plan","features":[]}',
  ADD COLUMN "rules" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "vendor_subscriptions"
  ADD COLUMN "offerPriceInPaiseSnapshot" INTEGER,
  ADD COLUMN "includedCreditsSnapshot" INTEGER NOT NULL DEFAULT 0;

ALTER TYPE "CreditTransactionType" ADD VALUE 'SUBSCRIPTION_CREDIT';
ALTER TABLE "vendor_credit_transactions" ADD COLUMN "subscriptionId" TEXT;
CREATE UNIQUE INDEX "vendor_credit_transactions_subscriptionId_key" ON "vendor_credit_transactions"("subscriptionId");
ALTER TABLE "vendor_credit_transactions" ADD CONSTRAINT "vendor_credit_transactions_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "vendor_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscription_plans" DROP CONSTRAINT "subscription_plans_values_check";
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_values_check" CHECK (
  "priceInPaise" >= 0
  AND ("offerPriceInPaise" IS NULL OR ("offerPriceInPaise" >= 0 AND "offerPriceInPaise" <= "priceInPaise"))
  AND "durationDays" > 0 AND "trialDays" >= 0 AND "includedCredits" >= 0
  AND "directLeadCreditPrice" > 0 AND "priorityWeight" >= 0
  AND ("maxPublicServices" IS NULL OR "maxPublicServices" > 0)
  AND ("maxJobPosts" IS NULL OR "maxJobPosts" > 0)
);
