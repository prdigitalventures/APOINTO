-- AlterTable
ALTER TABLE "Business" ADD COLUMN "uniqueCode" TEXT;
ALTER TABLE "Business" ADD COLUMN "contactPhone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Business_uniqueCode_key" ON "Business"("uniqueCode");
