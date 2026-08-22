-- AlterTable
ALTER TABLE "CrmContact" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN IF NOT EXISTS "birthday" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "CrmContact" ADD COLUMN IF NOT EXISTS "lastWorkNotes" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "photo" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "employeeCode" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "privileges" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Staff_employeeCode_key" ON "Staff"("employeeCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_userId_key" ON "Staff"("userId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "ShopMedia" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShopMedia_businessId_idx" ON "ShopMedia"("businessId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerMedia" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerMedia_ownerId_phone_idx" ON "CustomerMedia"("ownerId", "phone");

ALTER TABLE "ShopMedia" ADD CONSTRAINT "ShopMedia_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerMedia" ADD CONSTRAINT "CustomerMedia_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
