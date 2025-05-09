-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Model_orderIndex_idx" ON "Model"("orderIndex");
