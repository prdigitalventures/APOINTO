-- CreateTable
CREATE TABLE "CrmContact" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "statusOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmContact_ownerId_idx" ON "CrmContact"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_ownerId_phone_key" ON "CrmContact"("ownerId", "phone");

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
