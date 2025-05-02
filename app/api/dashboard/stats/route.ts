import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExamAttemptStatus, ExamAttempt, ExamAttemptAnswer } from '@prisma/client'; // Import types

export const dynamic = 'force-dynamic'; // Prevent caching

// Define the structure for detailed participant stats
interface ParticipantStats {
    identifier: string; // Unique key (email or name)
    displayName: string; // Name to display
    isEmail: boolean; // Identifier type flag
    totalAttempts: number;
    totalCorrect: number;
    totalIncorrect: number;
    averageScore: number | null; // Percentage
}

export async function GET(request: Request) {
  console.log("[API /api/dashboard/stats] Request received.");
  try {
    // 1. Get total number of attempts
    const totalAttempts = await prisma.examAttempt.count();
    console.log(`[API /api/dashboard/stats] Total attempts: ${totalAttempts}`);

    // 2. Get number of unique participants (based on email)
    // Use distinct count aggregation
    const uniqueParticipantsResult = await prisma.examAttempt.aggregate({
      _count: {
        participantEmail: true, // Count non-null emails
      },
      where: {
        participantEmail: {
          not: null, // Ensure email is not null if counting distinct emails
        },
      },
    });
     // Prisma's distinct count on a field isn't direct. We fetch distinct emails and count them.
     const distinctEmails = await prisma.examAttempt.findMany({
        where: {
            participantEmail: {
                not: null, // Exclude null emails if necessary
            },
        },
        select: {
            participantEmail: true,
        },
        distinct: ['participantEmail'],
     });
     const uniqueParticipants = distinctEmails.length;
     console.log(`[API /api/dashboard/stats] Unique participants: ${uniqueParticipants}`);


    // 3. Get number of completed attempts
    const completedAttempts = await prisma.examAttempt.count({
      where: {
        status: {
          in: [ExamAttemptStatus.SUBMITTED, ExamAttemptStatus.TIMED_OUT],
        },
      },
    });
    console.log(`[API /api/dashboard/stats] Completed attempts: ${completedAttempts}`);

    // 4. Calculate detailed participant statistics
    console.log("[API /api/dashboard/stats] Fetching completed attempts with answers...");
    const completedAttemptsWithAnswers = await prisma.examAttempt.findMany({
        where: {
            status: {
                in: [ExamAttemptStatus.SUBMITTED, ExamAttemptStatus.TIMED_OUT],
            },
            // participantEmail: { // Ensure we only process attempts with emails - REMOVED FILTER
            //     not: null
            // }
        },
        // include: { // Keep include removed, fetch answers separately
        //     // attemptAnswers: true
        // }
    });
    console.log(`[API /api/dashboard/stats] Found ${completedAttemptsWithAnswers.length} completed attempt records (email filter removed).`);

    // If completed attempts exist, fetch their answers separately
    let allAnswers: ExamAttemptAnswer[] = [];
    if (completedAttemptsWithAnswers.length > 0) {
        const attemptIds = completedAttemptsWithAnswers.map(a => a.id);
        console.log(`[API /api/dashboard/stats] Fetching answers separately for attempt IDs:`, attemptIds);
        allAnswers = await prisma.examAttemptAnswer.findMany({
            where: {
                examAttemptId: {
                    in: attemptIds
                }
            }
        });
        console.log(`[API /api/dashboard/stats] Found ${allAnswers.length} answer records separately.`);
        // Log raw answers for debugging
        console.log("[API /api/dashboard/stats] Raw separate answers data:", JSON.stringify(allAnswers, null, 2));
    }

    // Group answers by attemptId for easier lookup
    const answersByAttemptId = new Map<string, ExamAttemptAnswer[]>();
    allAnswers.forEach(answer => {
        const answers = answersByAttemptId.get(answer.examAttemptId) || [];
        answers.push(answer);
        answersByAttemptId.set(answer.examAttemptId, answers);
    });

    // Process the attempts to aggregate stats per participant (using email or name as identifier)
    const participantStatsMap = new Map<string, ParticipantStats>();

    completedAttemptsWithAnswers.forEach(attempt => {
        // Determine the identifier: use email if available, otherwise use name (handle potential null name)
        const identifier = attempt.participantEmail ? `email:${attempt.participantEmail}` : `name:${attempt.participantName || 'Bilinmeyen'}`;
        const displayName = attempt.participantName || (attempt.participantEmail ? attempt.participantEmail : 'Bilinmeyen');
        const isEmail = !!attempt.participantEmail;

        const attemptAnswers = answersByAttemptId.get(attempt.id) || []; // Get answers from the map
        console.log(`[API /api/dashboard/stats] Processing attempt ${attempt.id} for identifier '${identifier}'. Found ${attemptAnswers.length} answers.`);

        let stats = participantStatsMap.get(identifier);

        // Initialize stats for new participant identifier
        if (!stats) {
            stats = {
                identifier: identifier,
                displayName: displayName,
                isEmail: isEmail,
                totalAttempts: 0,
                totalCorrect: 0,
                totalIncorrect: 0,
                averageScore: null
            };
        }

        // Update stats
        stats.totalAttempts += 1;
        let correctCount = 0;
        let incorrectCount = 0;
        // Access isCorrect from the separately fetched answers
        attemptAnswers.forEach(answer => {
            if (answer.isCorrect) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        });
        stats.totalCorrect += correctCount;
        stats.totalIncorrect += incorrectCount;

        participantStatsMap.set(identifier, stats); // Use identifier instead of email
    });

    // Calculate average score and convert map to array
    const detailedParticipantStats = Array.from(participantStatsMap.values()).map(stats => {
        const totalAnswered = stats.totalCorrect + stats.totalIncorrect;
        stats.averageScore = totalAnswered > 0 ? parseFloat(((stats.totalCorrect / totalAnswered) * 100).toFixed(1)) : 0;
        return stats;
    });

    console.log(`[API /api/dashboard/stats] Calculated detailed stats for ${detailedParticipantStats.length} participants.`);


    // Prepare the final response data including both overall and detailed stats
    const responseData = {
      overallStats: {
        totalAttempts,
        uniqueParticipants,
        completedAttempts,
      },
      participantStats: detailedParticipantStats, // Add detailed stats
    };

    console.log("[API /api/dashboard/stats] Successfully calculated stats:", responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('[API /api/dashboard/stats] Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Failed to fetch dashboard statistics.' }, { status: 500 });
  }
}
