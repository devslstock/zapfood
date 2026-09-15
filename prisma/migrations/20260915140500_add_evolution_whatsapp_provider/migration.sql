-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "whatsappProvider" TEXT NOT NULL DEFAULT 'META',
ADD COLUMN     "evolutionInstanceName" TEXT,
ADD COLUMN     "evolutionWebhookToken" TEXT,
ADD COLUMN     "evolutionRiskAcceptedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Store_evolutionInstanceName_key" ON "Store"("evolutionInstanceName");
