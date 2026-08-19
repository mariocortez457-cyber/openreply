-- CreateEnum
CREATE TYPE "LeadMagnetDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "LeadMagnetDelivery" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "sourceDmLogId" TEXT NOT NULL,
    "instagramMessageId" TEXT NOT NULL,
    "commenterId" TEXT NOT NULL,
    "commenterName" TEXT,
    "email" TEXT NOT NULL,
    "status" "LeadMagnetDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "emailSentAt" TIMESTAMP(3),
    "dmConfirmedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadMagnetDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadMagnetDelivery_sourceDmLogId_key" ON "LeadMagnetDelivery"("sourceDmLogId");

-- CreateIndex
CREATE INDEX "LeadMagnetDelivery_workspaceId_idx" ON "LeadMagnetDelivery"("workspaceId");

-- CreateIndex
CREATE INDEX "LeadMagnetDelivery_automationId_idx" ON "LeadMagnetDelivery"("automationId");

-- CreateIndex
CREATE INDEX "LeadMagnetDelivery_instagramAccountId_idx" ON "LeadMagnetDelivery"("instagramAccountId");

-- CreateIndex
CREATE INDEX "LeadMagnetDelivery_commenterId_idx" ON "LeadMagnetDelivery"("commenterId");

-- CreateIndex
CREATE INDEX "LeadMagnetDelivery_email_idx" ON "LeadMagnetDelivery"("email");

-- CreateIndex
CREATE INDEX "LeadMagnetDelivery_status_idx" ON "LeadMagnetDelivery"("status");

-- AddForeignKey
ALTER TABLE "LeadMagnetDelivery" ADD CONSTRAINT "LeadMagnetDelivery_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMagnetDelivery" ADD CONSTRAINT "LeadMagnetDelivery_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMagnetDelivery" ADD CONSTRAINT "LeadMagnetDelivery_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMagnetDelivery" ADD CONSTRAINT "LeadMagnetDelivery_sourceDmLogId_fkey" FOREIGN KEY ("sourceDmLogId") REFERENCES "DmLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
