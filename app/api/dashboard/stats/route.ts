import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExamAttemptStatus, ExamAttemptAnswer as PrismaExamAttemptAnswer } from "@prisma/client"; // Prisma client'tan tipi al
import { subDays, format, startOfDay, endOfDay } from 'date-fns'; // Tarih işlemleri için
import { getServerSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface ParticipantStats {
    identifier: string;
    displayName: string;
    isEmail: boolean;
    totalAttempts: number;
    totalCorrect: number;
    totalIncorrect: number;
    averageScore: number | null;
}

// Yeni veri yapıları
interface AttemptsOverTimeData {
    date: string; // YYYY-MM-DD
    count: number;
}

interface ScoreDistributionData {
    range: string; // e.g., '81-100%'
    count: number;
}

export async function GET(request: Request) {
  console.log("[API /api/dashboard/stats] Request received.");
  try {
    // Get user session for role-based access control
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build where conditions based on user role
    const isAdmin = session.user.role === 'ADMIN';
    const isSuperAdmin = session.user.role === 'SUPERADMIN';

    // Base where condition for exams
    let examWhereCondition = {};

    // Admin users can only see their own exams
    if (isAdmin) {
      examWhereCondition = { createdById: session.user.id };
    }
    // SuperAdmin users can see all exams
    // No additional conditions needed for SuperAdmin

    // Get all exam IDs that the user has access to
    const accessibleExams = await prisma.exam.findMany({
      where: examWhereCondition,
      select: { id: true }
    });

    const accessibleExamIds = accessibleExams.map(exam => exam.id);
    console.log(`[API /api/dashboard/stats] User has access to ${accessibleExamIds.length} exams`);

    // If user has no accessible exams, return empty stats
    if (accessibleExamIds.length === 0) {
      return NextResponse.json({
        overallStats: { totalAttempts: 0, uniqueParticipants: 0, completedAttempts: 0 },
        participantStats: [],
        attemptsOverTime: [],
        scoreDistribution: [
          { range: '0-20%', count: 0 },
          { range: '21-40%', count: 0 },
          { range: '41-60%', count: 0 },
          { range: '61-80%', count: 0 },
          { range: '81-100%', count: 0 },
        ],
      });
    }

    // 1. Genel İstatistikler - filtered by accessible exams
    const totalAttempts = await prisma.examAttempt.count({
      where: { examId: { in: accessibleExamIds } }
    });

    const distinctEmails = await prisma.examAttempt.findMany({
      where: {
        participantEmail: { not: null },
        examId: { in: accessibleExamIds }
      },
      select: { participantEmail: true },
      distinct: ['participantEmail'],
    });

    const uniqueParticipants = distinctEmails.length;

    const completedAttempts = await prisma.examAttempt.count({
      where: {
        status: { in: [ExamAttemptStatus.SUBMITTED, ExamAttemptStatus.TIMED_OUT] },
        examId: { in: accessibleExamIds }
      },
    });

    console.log(`[API /api/dashboard/stats] Overall stats: TA=${totalAttempts}, UP=${uniqueParticipants}, CA=${completedAttempts}`);

    // 2. Detaylı Katılımcı İstatistikleri - filtered by accessible exams
    const completedAttemptsWithAnswersRecords = await prisma.examAttempt.findMany({
      where: {
        status: { in: [ExamAttemptStatus.SUBMITTED, ExamAttemptStatus.TIMED_OUT] },
        examId: { in: accessibleExamIds }
      },
    });

    let allAnswers: PrismaExamAttemptAnswer[] = []; // Güncellenmiş tipi kullan
    if (completedAttemptsWithAnswersRecords.length > 0) {
        const attemptIds = completedAttemptsWithAnswersRecords.map(a => a.id);
        allAnswers = await prisma.examAttemptAnswer.findMany({
            where: { examAttemptId: { in: attemptIds } }
            // select veya include olmadan ilişkisel alanlar (question, answer) gelmez
        });
    }

    const answersByAttemptId = new Map<string, PrismaExamAttemptAnswer[]>(); // Güncellenmiş tipi kullan
    allAnswers.forEach(answer => {
        const answers = answersByAttemptId.get(answer.examAttemptId) || [];
        answers.push(answer);
        answersByAttemptId.set(answer.examAttemptId, answers);
    });

    const participantStatsMap = new Map<string, ParticipantStats>();
    completedAttemptsWithAnswersRecords.forEach((attempt) => {
        const identifier = attempt.participantEmail ? `email:${attempt.participantEmail}` : `name:${attempt.participantName || 'Bilinmeyen'}`;
        const displayName = attempt.participantName || (attempt.participantEmail ? attempt.participantEmail : 'Bilinmeyen');
        const isEmail = !!attempt.participantEmail;
        const attemptAnswers = answersByAttemptId.get(attempt.id) || [];
        let stats = participantStatsMap.get(identifier);
        if (!stats) {
            stats = { identifier, displayName, isEmail, totalAttempts: 0, totalCorrect: 0, totalIncorrect: 0, averageScore: null };
        }
        stats.totalAttempts += 1;
        let correctCount = 0;
        attemptAnswers.forEach(answer => { if (answer.isCorrect) correctCount++; });
        stats.totalCorrect += correctCount;
        stats.totalIncorrect += (attemptAnswers.length - correctCount);
        participantStatsMap.set(identifier, stats);
    });

    const detailedParticipantStats = Array.from(participantStatsMap.values()).map(stats => {
        const totalAnswered = stats.totalCorrect + stats.totalIncorrect;
        stats.averageScore = totalAnswered > 0 ? parseFloat(((stats.totalCorrect / totalAnswered) * 100).toFixed(1)) : 0;
        return stats;
    });
    console.log(`[API /api/dashboard/stats] Calculated detailed stats for ${detailedParticipantStats.length} participants.`);

    // 3. Zaman İçinde Sınav Denemesi Sayısı (attemptsOverTime) - Son 30 gün
    const attemptsOverTime: AttemptsOverTimeData[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) { // Son 30 gün (bugün dahil)
      const targetDate = subDays(today, i);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);

      const count = await prisma.examAttempt.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          examId: { in: accessibleExamIds }, // Filter by accessible exams
        },
      });
      attemptsOverTime.push({ date: format(targetDate, 'yyyy-MM-dd'), count });
    }
    console.log(`[API /api/dashboard/stats] Calculated attempts over time for last 30 days.`);

    // 4. Başarı Puanı Dağılımı (scoreDistribution)
    const scoreDistribution: ScoreDistributionData[] = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];
    detailedParticipantStats.forEach(participant => {
      const score = participant.averageScore;
      if (score !== null) {
        if (score >= 0 && score <= 20) scoreDistribution[0].count++;
        else if (score >= 21 && score <= 40) scoreDistribution[1].count++;
        else if (score >= 41 && score <= 60) scoreDistribution[2].count++;
        else if (score >= 61 && score <= 80) scoreDistribution[3].count++;
        else if (score >= 81 && score <= 100) scoreDistribution[4].count++;
      }
    });
    console.log(`[API /api/dashboard/stats] Calculated score distribution.`);

    const responseData = {
      overallStats: { totalAttempts, uniqueParticipants, completedAttempts },
      participantStats: detailedParticipantStats,
      attemptsOverTime, // Yeni veri
      scoreDistribution,  // Yeni veri
    };

    console.log("[API /api/dashboard/stats] Successfully calculated all stats.");
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('[API /api/dashboard/stats] Error fetching dashboard stats:', error);
    let errorMessage = 'Failed to fetch dashboard statistics.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
