-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "receiptNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "paymentMode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_receiptNumber_key" ON "Booking"("receiptNumber");
