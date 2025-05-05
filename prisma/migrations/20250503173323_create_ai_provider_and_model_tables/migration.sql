/*
  Warnings:

  - You are about to drop the column `groqApiKey` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `groqModelName` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `openRouterApiKey` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `openRouterModelName` on the `Setting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "groqApiKey",
DROP COLUMN "groqModelName",
DROP COLUMN "openRouterApiKey",
DROP COLUMN "openRouterModelName";

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "providerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiProvider_name_key" ON "AiProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_providerId_name_key" ON "AiModel"("providerId", "name");

-- AddForeignKey
ALTER TABLE "AiModel" ADD CONSTRAINT "AiModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AiProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
