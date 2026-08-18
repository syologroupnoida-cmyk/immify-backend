-- Collapse VendorType from {TRAVEL_AGENT, PROPERTY_OWNER} to a single
-- CONSULTANCY value. What a vendor offers is captured per-vendor via
-- ServiceCategory selection on their KYC, not via this enum. Existing rows
-- (any TRAVEL_AGENT/PROPERTY_OWNER) are remapped to CONSULTANCY, no data lost.

CREATE TYPE "VendorType_new" AS ENUM ('CONSULTANCY');

ALTER TABLE "vendor_profiles" ALTER COLUMN "vendorType" DROP DEFAULT;

ALTER TABLE "vendor_profiles"
  ALTER COLUMN "vendorType" TYPE "VendorType_new"
  USING (
    CASE
      WHEN "vendorType"::text IN ('TRAVEL_AGENT', 'PROPERTY_OWNER') THEN 'CONSULTANCY'
      ELSE "vendorType"::text
    END
  )::"VendorType_new";

DROP TYPE "VendorType";
ALTER TYPE "VendorType_new" RENAME TO "VendorType";

ALTER TABLE "vendor_profiles" ALTER COLUMN "vendorType" SET DEFAULT 'CONSULTANCY';
