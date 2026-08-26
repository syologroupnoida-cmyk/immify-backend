ALTER TABLE "leads"
ADD COLUMN "maxUnlocks" INTEGER,
ADD COLUMN "unlockCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "leads"
ADD CONSTRAINT "leads_unlock_limit_check"
CHECK (
  "maxUnlocks" IS NULL
  OR ("maxUnlocks" > 0 AND "unlockCount" >= 0 AND "unlockCount" <= "maxUnlocks")
);
