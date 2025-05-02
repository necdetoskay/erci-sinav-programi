'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'; // useMemo eklendi
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// ScrollArea importu kaldırıldı
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"
import { toast } from 'sonner';

// Soru ve Sınav tiplerini tanımlayalım (API'den gelen yanıta göre güncellenebilir)
// Question interface expects the new options format from the backend
interface QuestionOption {
    letter: string;
    text: string;
}
interface Question {
    id: number;
    question_text: string;
    options: QuestionOption[]; // Expect an array of objects with letter and text
    // API'den gelmese bile, cevap kontrolünden sonra bu bilgileri tutacağız
    correct_answer?: string; // Bu hala backend'den 'A', 'B'.. olarak gelmeli (check-answer API'si için)
    explanation?: string;
}

// Cevap kontrolü sonucunu tutacak tip
interface AnswerCheckResult {
    isCorrect: boolean | null;
    correctAnswer: string | null; // Bu da 'A', 'B'... formatında olmalı
    explanation: string | null;
}

// Update ExamData interface to include answerCheckResults
interface ExamData {
    id: number;
    title: string;
    questions: Question[]; // Updated Question type
    duration_minutes: number;
    // Kaldığı yerden devam etme bilgileri
    currentQuestionIndex?: number;
    answers?: { [questionId: number]: string }; // { 1: "A", 2: "C" }
    startTime?: string; // ISO string formatında
    status: 'NEW' | 'RESUMED' | 'COMPLETED'; // Status field added
    attemptId: string; // attemptId alanı tekrar eklendi
    // Add field to receive pre-checked answer results from API
    answerCheckResults?: { [questionId: number]: AnswerCheckResult };
}

export default function ExamStartPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const examId = params.examId as string;
    const accessCode = searchParams.get('code');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');

    const [examData, setExamData] = useState<ExamData | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: string }>({});
    const [answerCheckResult, setAnswerCheckResult] = useState<{ [questionId: number]: AnswerCheckResult }>({});
    const questionStartTimeRef = useRef<number | null>(null);
    const [isCheckingAnswer, setIsCheckingAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinishing, setIsFinishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [examStatus, setExamStatus] = useState<'NEW' | 'RESUMED' | 'COMPLETED' | null>(null); // Sınav durumunu tutacak state
    const router = useRouter();
    const finishCalled = useRef(false);

    // Mevcut soruyu state'ten al
    const currentQuestion = examData?.questions?.[currentQuestionIndex];
    const isReadOnly = examStatus === 'COMPLETED'; // Salt okunur mod kontrolü

    // İstatistikleri hesapla (useMemo ile optimize edildi)
    const stats = useMemo(() => {
        const answeredCount = Object.keys(answerCheckResult).length;
        const correctCount = Object.values(answerCheckResult).filter(r => r.isCorrect === true).length;
        const incorrectCount = Object.values(answerCheckResult).filter(r => r.isCorrect === false).length;
        return { answeredCount, correctCount, incorrectCount };
    }, [answerCheckResult]);

    // finishExam fonksiyonunu useCallback ile sarmalayalım ki useEffect bağımlılıklarında sorun olmasın
    const finishExam = useCallback(async (timedOut = false) => {
        if (finishCalled.current) return;
        finishCalled.current = true;
        console.log(`Finishing exam (Attempt: ${attemptId}, Timed Out: ${timedOut})...`, selectedAnswers);
        setIsFinishing(true);
        try {
            const response = await fetch(`/api/exam/attempt/${attemptId}/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finalAnswers: selectedAnswers, timedOut }),
            });
            const data = await response.json();
            if (!response.ok) {
                 if (response.status === 409) {
                    toast.info("Bilgi", { description: data.message || "Sınav zaten tamamlanmış." });
                 } else {
                    throw new Error(data.message || 'Sınav bitirilemedi.');
                 }
            } else {
                toast.success("Sınav Tamamlandı", { description: data.message || "Cevaplarınız başarıyla gönderildi." });
                // Zamanlayıcıyı durdur
                setTimeLeft(null); // veya 0
                // Sonuç sayfasına yönlendir
                router.push(`/exam/results/${attemptId}`); // Yönlendirme eklendi
            }
            // console.log("Redirecting to results page (TODO)..."); // Yorum kaldırıldı
        } catch (err: any) {
            console.error("Sınav bitirme hatası:", err);
            toast.error("Hata", { description: err.message || 'Sınav bitirilirken bir hata oluştu.' });
            finishCalled.current = false;
        } finally {
            setIsFinishing(false);
        }
    }, [attemptId, selectedAnswers, examId, router]);

    // Soru değiştiğinde veya ilk yüklendiğinde soruya başlama zamanını kaydet
    useEffect(() => {
        if (currentQuestion) {
            // Sadece henüz cevaplanmamışsa zamanlayıcıyı başlat/sıfırla
            if (!answerCheckResult[currentQuestion.id]) {
                questionStartTimeRef.current = Date.now();
                console.log(`Timer started/reset for question ${currentQuestion.id} at ${questionStartTimeRef.current}`);
            }
        }
    }, [currentQuestion, answerCheckResult]); // Depend on currentQuestion and answerCheckResult

    // Sınav verilerini çekmek için useEffect
    useEffect(() => {
        const fetchExamData = async () => {
            setIsLoading(true);
            setError(null);
            setExamData(null);
            setAttemptId(null);
            const apiUrl = `/api/exam/${examId}/start?code=${encodeURIComponent(accessCode || '')}&firstName=${encodeURIComponent(firstName || '')}&lastName=${encodeURIComponent(lastName || '')}`;
            console.log(`Fetching data from: ${apiUrl}`);
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Sınav verileri alınamadı.');

                // API'den gelen veriyi state'e ata
                // Ensure fetchedExamData matches the extended ExamData interface
                // Backend'den gelen yanıtta status alanı da olacak
                const fetchedExamData: ExamData = data; // Tip ExamData olarak güncellendi (status içeriyor)

                // Gelen verinin options formatını kontrol et (debug için)
                if (fetchedExamData.questions && fetchedExamData.questions.length > 0) {
                    console.log("INITIAL QUESTION OPTIONS RECEIVED:", JSON.stringify(fetchedExamData.questions[0].options, null, 2));
                }
                setExamData(fetchedExamData);
                setAttemptId(fetchedExamData.attemptId); // attemptId backend'den geliyor
                setCurrentQuestionIndex(fetchedExamData.currentQuestionIndex ?? 0);
                setSelectedAnswers(fetchedExamData.answers ?? {});
                setAnswerCheckResult(fetchedExamData.answerCheckResults ?? {});
                setExamStatus(fetchedExamData.status); // Sınav durumunu state'e ata

                // Sadece tamamlanmamış sınavlarda zamanlayıcıyı başlat
                if (fetchedExamData.status !== 'COMPLETED' && fetchedExamData.startTime) {
                    const startTimeMs = new Date(fetchedExamData.startTime).getTime();
                    const durationMs = fetchedExamData.duration_minutes * 60 * 1000;
                    const endTimeMs = startTimeMs + durationMs;
                    const remainingMs = Math.max(0, endTimeMs - Date.now());
                    setTimeLeft(Math.floor(remainingMs / 1000));
                    console.log(`Timer started/resumed. Remaining time: ${Math.floor(remainingMs / 1000)}s`);
                } else if (fetchedExamData.status === 'COMPLETED') {
                    setTimeLeft(0); // Tamamlanmışsa süre 0
                    console.log("Exam already completed. Timer not started.");
                } else {
                    console.error("API'den başlangıç zamanı alınamadı!");
                    // Başlangıç zamanı yoksa, süreyi tamdan başlat.
                    // Bu blok zaten status 'COMPLETED' olmadığında çalışır.
                    setTimeLeft(fetchedExamData.duration_minutes * 60);
                }
            } catch (err: any) {
                console.error("Sınav verisi çekme hatası:", err);
                setError(err.message || 'Bir hata oluştu.');
                toast.error("Hata", { description: err.message || 'Sınav verileri yüklenirken bir hata oluştu.' });
            } finally {
                setIsLoading(false);
            }
        };

        if (examId && accessCode && firstName && lastName) {
            fetchExamData();
        } else {
            setError("Gerekli bilgiler eksik (Sınav ID, Erişim Kodu, Ad veya Soyad).");
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId, accessCode, firstName, lastName]); // Keep dependencies minimal

    // İlerlemeyi kaydetme fonksiyonu
    const saveProgress = async (currentIndex: number, currentAnswers: { [key: number]: string }) => {
        if (!attemptId) return;
        console.log(`Saving progress for attempt ${attemptId}...`);
        try {
            const response = await fetch(`/api/exam/attempt/${attemptId}/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentQuestionIndex: currentIndex, answers: currentAnswers }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'İlerleme kaydedilemedi.');
            console.log('Progress saved:', data.updatedAt);
        } catch (err: any) {
            console.error("İlerleme kaydetme hatası:", err);
            toast.error("Kaydetme Hatası", { description: err.message || 'İlerleme kaydedilirken bir hata oluştu.' });
        }
    };

    // Zamanlayıcı için useEffect (Sadece tamamlanmamışsa çalışır)
    useEffect(() => {
        // timeLeft null ise veya sınav tamamlanmışsa zamanlayıcıyı çalıştırma
        if (timeLeft === null || isReadOnly) return;

        if (timeLeft <= 0) {
            // Sadece zamanlayıcı aktifken ve sınav bitmemişken otomatik bitir
            if (!finishCalled.current && !isReadOnly) {
                 console.log("Süre bitti, sınav bitiriliyor...");
                 toast.info("Süre Doldu", { description: "Sınav süreniz sona erdi. Cevaplarınız kaydediliyor..." });
                 finishExam(true);
            }
            return;
        }
        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => (prevTime ? prevTime - 1 : 0));
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft, finishExam]);

    // Cevap seçildiğinde çalışacak fonksiyon (Sadece tamamlanmamışsa çalışır)
    const handleAnswerChange = async (questionId: number, selectedOptionLetter: string) => {
        if (isReadOnly || answerCheckResult[questionId] || isCheckingAnswer === questionId) {
            console.log(`Question ${questionId} is read-only, already answered or being checked.`);
            return;
        }
        if (!questionStartTimeRef.current && !isReadOnly) { // Sadece readOnly değilse zamanı başlat
            questionStartTimeRef.current = Date.now();
            console.warn(`Start time for question ${questionId} was not set, setting now.`);
        }
        // questionStartTimeRef.current null değilse zamanı hesapla, değilse 0 kabul et
        const timeSpentSeconds = questionStartTimeRef.current
            ? Math.round((Date.now() - questionStartTimeRef.current) / 1000)
            : 0;
        console.log(`Time spent on question ${questionId}: ${timeSpentSeconds}s`);

        const newAnswers = { ...selectedAnswers, [questionId]: selectedOptionLetter };
        setSelectedAnswers(newAnswers);
        setIsCheckingAnswer(questionId);

        try {
            console.log(`Checking answer for question ${questionId}, option ${selectedOptionLetter}, time ${timeSpentSeconds}s`);
            const response = await fetch(`/api/exam/attempt/${attemptId}/check-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: questionId,
                    selectedAnswer: selectedOptionLetter, // Send the letter 'A', 'B'...
                    timeSpentSeconds: timeSpentSeconds,
                }),
            });
            const resultData: AnswerCheckResult = await response.json();
            if (!response.ok) {
                const errorData = resultData as any;
                throw new Error(errorData.message || 'Cevap kontrol edilemedi.');
            }
            setAnswerCheckResult(prev => ({
                ...prev,
                [questionId]: {
                    isCorrect: resultData.isCorrect,
                    correctAnswer: resultData.correctAnswer,
                    explanation: resultData.explanation,
                }
            }));
            toast.success(`Soru ${currentQuestionIndex + 1}`, {
                description: resultData.isCorrect ? "Doğru cevap!" : "Yanlış cevap.",
            });
        } catch (err: any) {
            console.error("Cevap kontrol hatası:", err);
            toast.error("Hata", { description: err.message || 'Cevap kontrol edilirken bir hata oluştu.' });
        } finally {
            setIsCheckingAnswer(null);
        }
    };

    // Belirli bir soruya gitme fonksiyonu (Sadece tamamlanmamışsa ilerleme kaydeder)
    const goToQuestion = async (index: number) => {
        if (index >= 0 && examData && index < examData.questions.length) {
            const currentQId = currentQuestion?.id;
            // Sadece tamamlanmamış sınavlarda ilerleme kaydet
            if (!isReadOnly) {
                if (currentQId && selectedAnswers[currentQId] && !answerCheckResult[currentQId]) {
                    console.warn(`Navigating away from question ${currentQId} before answer check completed.`);
                }
                await saveProgress(index, selectedAnswers); // Hedef index ile kaydet
            }
            setCurrentQuestionIndex(index);
        }
    };


    // Sonraki soruya geçme fonksiyonu (Sadece tamamlanmamışsa çalışır)
    const goToNextQuestion = async () => {
        if (isReadOnly) return;
        await goToQuestion(currentQuestionIndex + 1);
    };

    // Önceki soruya gitme fonksiyonu (Sadece tamamlanmamışsa çalışır)
    const goToPreviousQuestion = async () => {
        if (isReadOnly) return;
       await goToQuestion(currentQuestionIndex - 1);
    };

    // Zamanı formatlama fonksiyonu
    const formatTime = (totalSeconds: number | null): string => {
        if (totalSeconds === null) return '00:00:00';
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Render koşulları
    if (isLoading) return <div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>;
    if (error) return <div className="flex min-h-screen items-center justify-center text-red-600">{error}</div>;
    if (!examData || !currentQuestion) return <div className="flex min-h-screen items-center justify-center">Sınav verileri veya soru bulunamadı.</div>;

    // Ana render
    return (
        <div className="flex min-h-screen p-4 md:p-8 bg-gray-100 dark:bg-gray-950">
            {/* Sol Kolon: Soru Alanı */}
            <div className="flex-1 pr-4 md:pr-8">
                <Card className="w-full h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>{examData.title}</CardTitle>
                        {/* Zamanlayıcıyı sadece tamamlanmamışsa göster */}
                        {!isReadOnly && (
                            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                                Kalan Süre: {formatTime(timeLeft)}
                            </div>
                        )}
                        {/* Tamamlanmışsa mesaj göster */}
                        {isReadOnly && (
                             <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                Sınav Tamamlandı
                             </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                         {/* Tamamlanmışsa bilgilendirme mesajı */}
                         {isReadOnly && (
                            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 rounded-md text-sm">
                                Bu sınavı daha önce tamamladınız. Cevapları ve açıklamaları inceleyebilirsiniz.
                            </div>
                        )}
                        <div className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
                            Soru {currentQuestionIndex + 1} / {examData.questions.length}
                        </div>

                        <div key={currentQuestion.id} className="relative">
                            {/* Kontrol ediliyor overlay'ini sadece tamamlanmamışsa göster */}
                            {!isReadOnly && isCheckingAnswer === currentQuestion.id && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded">
                                    <p>Kontrol ediliyor...</p>
                                </div>
                            )}
                            <p className="mb-4 text-lg font-medium">{currentQuestion.question_text}</p>
                            <RadioGroup
                                value={selectedAnswers[currentQuestion.id] || ""}
                                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                                // ReadOnly ise veya cevap kontrol edilmişse/ediliyorsa disable et
                                disabled={isReadOnly || !!answerCheckResult[currentQuestion.id] || isCheckingAnswer === currentQuestion.id}
                                className="space-y-2"
                            >
                                {currentQuestion.options.map((option) => {
                                    // Use letter and text directly from the option object
                                    const displayLetter = option.letter;
                                    const text = option.text;
                                    const result = answerCheckResult[currentQuestion.id];
                                    // Compare selected answer state with the letter from the option
                                    const isSelected = selectedAnswers[currentQuestion.id] === displayLetter;
                                    // Compare correct answer from API result with the letter from the option
                                    const isCorrectAnswer = result?.correctAnswer === displayLetter;
                                    const wasCorrectlySelected = result?.isCorrect === true && isSelected;
                                    const wasIncorrectlySelected = result?.isCorrect === false && isSelected;

                                    return (
                                        <Label
                                            key={option.letter} // Use letter as React key
                                            htmlFor={`q${currentQuestion.id}-opt-${displayLetter}`} // Use letter in ID
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-md border border-gray-200 dark:border-gray-700 transition-colors",
                                                // Stil güncellemeleri
                                                wasCorrectlySelected && "border-green-500 bg-green-100 dark:bg-green-900/30 dark:border-green-700",
                                                wasIncorrectlySelected && "border-red-500 bg-red-100 dark:bg-red-900/30 dark:border-red-700",
                                                // Yanlış cevap verildiğinde doğru cevabı göster (salt okunurda da çalışır)
                                                result?.isCorrect === false && isCorrectAnswer && !isSelected && "border-green-500 bg-green-100/50 dark:bg-green-900/20 dark:border-green-700",
                                                // Hover efektleri sadece readOnly değilse
                                                !isReadOnly && result && "hover:bg-gray-100 dark:hover:bg-gray-800",
                                                !isReadOnly && !result && "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                                // Disable durumu
                                                (isReadOnly || !!result || isCheckingAnswer === currentQuestion.id) && "cursor-not-allowed opacity-70"
                                            )}
                                        >
                                            <RadioGroupItem
                                                value={displayLetter}
                                                id={`q${currentQuestion.id}-opt-${displayLetter}`}
                                                className={cn(
                                                    "border-gray-400 dark:border-gray-600",
                                                    wasCorrectlySelected && "border-green-700 text-green-700 dark:border-green-500 dark:text-green-500",
                                                    wasIncorrectlySelected && "border-red-700 text-red-700 dark:border-red-500 dark:text-red-500",
                                                    result?.isCorrect === false && isCorrectAnswer && !isSelected && "border-green-700 text-green-700 dark:border-green-500 dark:text-green-500"
                                                )}
                                                // ReadOnly ise veya cevap kontrol edilmişse/ediliyorsa disable et
                                                disabled={isReadOnly || !!result || isCheckingAnswer === currentQuestion.id}
                                            />
                                            <span className="flex-1">{displayLetter}) {text}</span>
                                            {/* İkonlar (salt okunurda da gösterilir) */}
                                            {wasCorrectlySelected && <span className="text-green-600 dark:text-green-400">✓</span>}
                                            {wasIncorrectlySelected && <span className="text-red-600 dark:text-red-400">✗</span>}
                                            {result?.isCorrect === false && isCorrectAnswer && !isSelected && <span className="text-green-600 dark:text-green-400">✓ ({result.correctAnswer})</span>}
                                        </Label>
                                    );
                                })}
                            </RadioGroup>

                            {/* Açıklama Bölümü */}
                            {answerCheckResult[currentQuestion.id] && (
                                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-2">
                                    {answerCheckResult[currentQuestion.id]?.correctAnswer && (
                                        <p className="text-sm font-semibold">
                                            Doğru Cevap: {answerCheckResult[currentQuestion.id]?.correctAnswer}
                                        </p>
                                    )}
                                    {answerCheckResult[currentQuestion.id]?.explanation && (
                                        <div>
                                            <h4 className="font-semibold mb-1 text-sm">Açıklama:</h4>
                                            <p className="text-sm">{answerCheckResult[currentQuestion.id]?.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                        <Button
                            onClick={goToPreviousQuestion}
                            disabled={isReadOnly || currentQuestionIndex === 0} // ReadOnly ise disable
                            variant="outline"
                        >
                            Önceki Soru
                        </Button>
                        {/* Sonraki Soru veya Sınavı Bitir butonu */}
                        {currentQuestionIndex < examData.questions.length - 1 ? (
                            <Button
                                onClick={goToNextQuestion}
                                disabled={isReadOnly} // ReadOnly ise disable
                            >
                                Sonraki Soru
                            </Button>
                        ) : (
                            // Sadece tamamlanmamışsa Sınavı Bitir butonunu göster
                            !isReadOnly && (
                                <Button
                                    onClick={() => finishExam(false)}
                                    variant="destructive"
                                    disabled={isFinishing}
                                >
                                    {isFinishing ? 'Bitiriliyor...' : 'Sınavı Bitir'}
                                </Button>
                            )
                        )}
                        {/* Tamamlanmışsa Sonuçları Gör butonu (opsiyonel) */}
                        {isReadOnly && (
                             <Button onClick={() => router.push(`/exam/results/${attemptId}`)} variant="secondary">
                                Sonuçları Gör
                             </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Sağ Kolon: İstatistikler ve Soru Listesi */}
            <div className="w-64 hidden md:block">
                <Card className="sticky top-8">
                    <CardHeader>
                        <CardTitle className="text-lg">İstatistikler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Toplam Soru:</span>
                            <span>{examData.questions.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cevaplanan:</span>
                            <span>{stats.answeredCount}</span>
                        </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Doğru:</span>
                            <span>{stats.correctCount}</span>
                        </div>
                        <div className="flex justify-between text-red-600 dark:text-red-400">
                            <span>Yanlış:</span>
                            <span>{stats.incorrectCount}</span>
                        </div>
                    </CardContent>
                    <CardHeader className="border-t pt-4">
                        <CardTitle className="text-lg">Sorular</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* ScrollArea yerine div ve overflow stili kullanıldı */}
                        <div className="h-[calc(100vh-400px)] overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2 pr-2"> {/* Sağdan biraz boşluk için pr-2 eklendi */}
                                {examData.questions.map((q, index) => {
                                    const result = answerCheckResult[q.id];
                                    const isCurrent = index === currentQuestionIndex;
                                    const isAnswered = !!result;
                                    const isCorrect = result?.isCorrect === true;
                                    const isIncorrect = result?.isCorrect === false;

                                    return (
                                        <Button
                                            key={q.id}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "h-9 w-9 p-0", // Boyut ayarlandı
                                                isCurrent && "ring-2 ring-primary ring-offset-2",
                                                isAnswered && isCorrect && "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900",
                                                isAnswered && isIncorrect && "bg-red-100 border-red-300 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900",
                                                !isAnswered && "hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                            // ReadOnly ise tıklamayı engelle
                                            onClick={() => !isReadOnly && goToQuestion(index)}
                                            // ReadOnly ise cursor-not-allowed ekle
                                            disabled={isReadOnly}
                                        >
                                            {index + 1}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div> {/* ScrollArea yerine kapanan div */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
// Fazladan eklenen kod bloğu buradan itibaren silindi.
