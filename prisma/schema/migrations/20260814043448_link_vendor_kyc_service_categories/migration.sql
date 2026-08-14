/*
  Warnings:

  - You are about to drop the column `services` on the `vendor_kyc` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vendor_kyc" DROP COLUMN "services";

-- CreateTable
CREATE TABLE "vendor_kyc_service_categories" (
    "vendorUserId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "vendor_kyc_service_categories_pkey" PRIMARY KEY ("vendorUserId","categoryId")
);

-- AddForeignKey
ALTER TABLE "vendor_kyc_service_categories" ADD CONSTRAINT "vendor_kyc_service_categories_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_kyc"("vendorUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_kyc_service_categories" ADD CONSTRAINT "vendor_kyc_service_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
