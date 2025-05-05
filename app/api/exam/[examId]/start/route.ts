import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ExamAttemptStatus, Question, ExamAttempt, ExamAttemptAnswer } from '@prisma/client'; // Import necessary types
import { getServerSession } from "next-auth/next"; // Import next-auth session
import { authOptions } from "@/lib/auth"; // Import auth options

// Helper function to convert index to letter (0 -> A, 1 -> B, ...)
const indexToLetter = (index: number): string => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
};

// Define the expected structure for AnswerCheckResult matching the frontend
type AnswerCheckResult = { isCorrect: boolean | null, correctAnswer: string | null, explanation: string | null };

// Define the type for the attempt variable including nested relations
type AttemptWithAnswersAndQuestions = ExamAttempt & {
    attemptAnswers: (ExamAttemptAnswer & {
        question: {
            correct_answer: string;
            explanation: string | null;
        } | null;
    })[];
};

// Define the response type for the frontend
type ExamStartResponse = {
    id: number;
    title: string;
    questions: { id: number; question_text: string; options: { letter: string; text: string }[] }[];
    duration_minutes: number;
    attemptId: string;
    currentQuestionIndex: number;
    answers: { [key: number]: string };
    startTime: string;
    status: 'NEW' | 'RESUMED' | 'COMPLETED'; // Status field added
    answerCheckResults: { [key: number]: AnswerCheckResult };
};


// TODO: Katılımcı kimliğini nasıl alacağımızı belirlemeliyiz.
// Şimdilik query parametresi olarak 'participantName' ve 'accessCode' bekleyelim.
const QueryParamsSchema = z.object({
    code: z.string().min(1, { message: "Erişim kodu gereklidir." }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
});

export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const examIdInt = parseInt(params.examId, 10);
        if (isNaN(examIdInt)) {
            return NextResponse.json({ message: 'Geçersiz Sınav ID.' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const queryValidation = QueryParamsSchema.safeParse({
            code: searchParams.get('code'),
            firstName: searchParams.get('firstName'),
            lastName: searchParams.get('lastName'),
        });

        if (!queryValidation.success) {
            return NextResponse.json({ message: 'Eksik veya geçersiz query parametreleri.', errors: queryValidation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { code: accessCode, firstName, lastName } = queryValidation.data;
        const participantName = (firstName && lastName) ? `${firstName} ${lastName}` : 'Bilinmeyen Katılımcı';

        // Get user session to retrieve email
        const session = await getServerSession(authOptions);
        // Use session email if available, otherwise null (handle cases where exam might be public?)
        const participantEmail = session?.user?.email ?? null;
        // console.log(`[API start] Participant Name: ${participantName}, Email from session: ${participantEmail}`); // Removed log


        // 1. Sınavı ve sorularını getir
        const exam = await prisma.exam.findUnique({
            where: { id: examIdInt },
            include: {
                questions: {
                    orderBy: { position: 'asc' },
                    select: { id: true, question_text: true, options: true }
                },
            },
        });

        if (!exam) {
            return NextResponse.json({ message: 'Sınav bulunamadı.' }, { status: 404 });
        }
        if (exam.access_code !== accessCode) {
             return NextResponse.json({ message: 'Geçersiz erişim kodu.' }, { status: 403 });
        }

        // 3. Bu kullanıcı için en son denemeyi bul (durumdan bağımsız)
        let attempt: AttemptWithAnswersAndQuestions | null = await prisma.examAttempt.findFirst({
            where: {
                examId: examIdInt,
                participantName: participantName,
                // Status filtresi kaldırıldı, tüm durumlar kontrol edilecek
            },
            orderBy: { createdAt: 'desc' }, // En son denemeyi al
            include: {
                attemptAnswers: {
                    include: {
                        question: { // Include related question for correct answer/explanation
                            select: { correct_answer: true, explanation: true }
                        }
                    }
                }
            }
        });

        let responseStatus: 'NEW' | 'RESUMED' | 'COMPLETED';
        let attemptAnswersData: { [key: number]: AnswerCheckResult } = {};

        if (!attempt) {
            // 4. Mevcut deneme yoksa YENİ oluştur
            responseStatus = 'NEW';
            attempt = await prisma.examAttempt.create({
                data: {
                    examId: examIdInt,
                    participantName: participantName,
                    participantEmail: participantEmail, // Add email here
                    status: ExamAttemptStatus.STARTED,
                    startTime: new Date(),
                    answers: {},
                    currentQuestionIndex: 0,
                },
            }) as AttemptWithAnswersAndQuestions;
            attempt.attemptAnswers = []; // Yeni deneme için boş dizi

        } else if (attempt.status === ExamAttemptStatus.SUBMITTED || attempt.status === ExamAttemptStatus.TIMED_OUT) {
            // 5. Deneme TAMAMLANMIŞ ise
            responseStatus = 'COMPLETED';
            // Tamamlanmış denemenin cevaplarını ve sonuçlarını hazırla
            if (attempt.attemptAnswers) {
                attemptAnswersData = attempt.attemptAnswers.reduce((acc, ans) => {
                    if (ans.question) {
                        acc[ans.questionId] = {
                            isCorrect: ans.isCorrect,
                            correctAnswer: ans.question.correct_answer,
                            explanation: ans.question.explanation,
                        };
                    }
                    return acc;
                }, {} as { [key: number]: AnswerCheckResult });
            }

        } else {
            // 6. Deneme DEVAM EDİYOR ise (STARTED, IN_PROGRESS, PAUSED)
            responseStatus = 'RESUMED';
            // Son aktivite zamanını güncelle ve durumu IN_PROGRESS yap
            await prisma.examAttempt.update({
                where: { id: attempt.id },
                data: { lastActivityAt: new Date(), status: ExamAttemptStatus.IN_PROGRESS }
            });

            // Mevcut cevapları ve sonuçları hazırla
            if (attempt.attemptAnswers) {
                attemptAnswersData = attempt.attemptAnswers.reduce((acc, ans) => {
                    if (ans.question) {
                        acc[ans.questionId] = {
                            isCorrect: ans.isCorrect,
                            correctAnswer: ans.question.correct_answer,
                            explanation: ans.question.explanation,
                        };
                    }
                    return acc;
                }, {} as { [key: number]: AnswerCheckResult });
            }
        }

        // Ensure attempt is not null before accessing its properties
        if (!attempt) {
            // Bu noktada attempt null olmamalı, ama tip güvenliği için kontrol edelim
            throw new Error("Sınav denemesi oluşturulamadı veya bulunamadı.");
        }

        // 7. Frontend'e gönderilecek veriyi hazırla
        const transformedQuestions = exam.questions.map(q => {
            let formattedOptions: { letter: string, text: string }[] = [];
            try {
                const optionsData = q.options as any;
                if (Array.isArray(optionsData)) {
                    formattedOptions = optionsData.map((text, index) => ({
                        letter: indexToLetter(index),
                        text: String(text)
                    }));
                } else if (typeof optionsData === 'object' && optionsData !== null) {
                    const entries = Object.entries(optionsData)
                        .sort(([keyA], [keyB]) => {
                            const numA = parseInt(keyA, 10);
                            const numB = parseInt(keyB, 10);
                            return (!isNaN(numA) && !isNaN(numB)) ? numA - numB : 0;
                        });
                    formattedOptions = entries.map(([_, text], index) => ({
                        letter: indexToLetter(index),
                        text: String(text)
                    }));
                } else {
                    console.warn(`Unexpected options format for question ${q.id}:`, optionsData);
                }
            } catch (parseError) {
                 console.error(`Error processing options for question ${q.id}:`, parseError, q.options);
            }
            return { id: q.id, question_text: q.question_text, options: formattedOptions };
        });

        const responseData = {
            id: exam.id,
            title: exam.title,
            questions: transformedQuestions,
            duration_minutes: exam.duration_minutes,
            attemptId: attempt.id,
            currentQuestionIndex: attempt.currentQuestionIndex,
            answers: attempt.answers as { [key: number]: string } || {},
            startTime: attempt.startTime.toISOString(),
            status: responseStatus, // Durumu ekle
            answerCheckResults: attemptAnswersData,
        };

        return NextResponse.json(responseData as ExamStartResponse, { status: 200 }); // Tip belirterek gönder

    } catch (error) {
        console.error(`Sınav başlatma hatası (Exam ID: ${params.examId}):`, error);
        // Add type check for error if needed
        const errorMessage = error instanceof Error ? error.message : 'Sunucu hatası oluştu.';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
