-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "canViewFinance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canViewProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewSettings" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whatsappConnectionOk" BOOLEAN,
ADD COLUMN     "whatsappLastTestedAt" TIMESTAMP(3),
ADD COLUMN     "whatsappWabaId" TEXT;

-- CreateTable
CREATE TABLE "MenuView" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuView_storeId_createdAt_idx" ON "MenuView"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "MenuView" ADD CONSTRAINT "MenuView_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
