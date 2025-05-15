/*
  Warnings:

  - You are about to alter the column `apiKey` on the `Provider` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "apiCode" TEXT;

-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "apiKey" SET DATA TYPE VARCHAR(255);
