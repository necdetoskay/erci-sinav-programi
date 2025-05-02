/*
  Warnings:

  - You are about to drop the column `grade` on the `QuestionPool` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ExamAttemptStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'PAUSED', 'SUBMITTED', 'TIMED_OUT', 'GRADED');

-- AlterTable
ALTER TABLE "QuestionPool" DROP COLUMN "grade";

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" INTEGER NOT NULL,
    "participantName" TEXT NOT NULL,
    "participantEmail" TEXT,
    "status" "ExamAttemptStatus" NOT NULL DEFAULT 'STARTED',
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamAttempt_examId_participantEmail_idx" ON "ExamAttempt"("examId", "participantEmail");

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
