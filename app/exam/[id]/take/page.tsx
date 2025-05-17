"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Question {
  id: number;
  question_text: string;
  options: {
    [key: string]: string;
  };
}

interface ExamAttempt {
  id: string;
  examId: number;
  participantName: string | null;
  participantEmail: string | null;
  status: string;
  currentQuestionIndex: number;
  startTime: string;
  endTime: string | null;
  answers?: Record<number, string>;
}

interface ExamData {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  questions: Question[];
  attempt: ExamAttempt;
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export default function TakeExamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const examId = parseInt(params.id);

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);

  // Sayfa odak durumu
  const [isPageFocused, setIsPageFocused] = useState(true);

  // Soru için geçen süre
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<number, number>>({});
  const [currentQuestionTimeSpent, setCurrentQuestionTimeSpent] = useState(0);

  useEffect(() => {
    if (!attemptId) {
      toast.error("Geçersiz sınav denemesi");
      router.push("/exam");
      return;
    }

    // Sınav verilerini getir
    const fetchExamData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/exams/${examId}/attempt/${attemptId}`);

        if (!response.ok) {
          throw new Error("Sınav verileri yüklenirken bir hata oluştu");
        }

        const data = await response.json();
        setExamData(data);
        setCurrentQuestionIndex(data.attempt.currentQuestionIndex);

        // Önceki cevapları yükle
        if (data.attempt.answers) {
          setAnswers(data.attempt.answers);
        }

        // Kalan süreyi hesapla
        const startTime = new Date(data.attempt.startTime).getTime();
        const durationMs = data.duration_minutes * 60 * 1000;
        const endTime = startTime + durationMs;
        const now = Date.now();
        const remainingMs = Math.max(0, endTime - now);
        setTimeLeft(Math.floor(remainingMs / 1000));
      } catch (error) {
        console.error("Sınav verileri yüklenirken hata:", error);
        toast.error("Sınav verileri yüklenirken bir hata oluştu");
        router.push("/exam");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamData();
  }, [examId, attemptId, router]);

  // Cevap kontrolü için yardımcı fonksiyon
  const checkAnswer = useCallback(async (questionId: number, answer: string) => {
    try {
      // Cevabı API'ye gönder
      const response = await fetch(`/api/exams/${examId}/attempt/${attemptId}/answer?t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          answer,
          timeSpentSeconds: 1, // Basitleştirilmiş süre
        }),
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Hata durumunda sessizce başarısız ol
      throw error;
    }
  }, [examId, attemptId]);

  // Sınavı tamamla
  const handleSubmitExam = useCallback(async () => {
    if (!examData) return;

    // Son sorunun cevabını kaydet - artık doğrudan RadioGroup içinde yapılıyor

    try {
      const response = await fetch(`/api/exams/${examId}/attempt/${attemptId}/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Sınav tamamlanırken bir hata oluştu");
      }

      toast.success("Sınav başarıyla tamamlandı");
      router.push(`/exam/${examId}/result?attemptId=${attemptId}`);
    } catch (error) {
      console.error("Sınav tamamlama hatası:", error);
      toast.error("Sınav tamamlanırken bir hata oluştu");
    }
  }, [examData, examId, attemptId, router]);

  // Sayfa odak durumunu izle
  useEffect(() => {
    // Sayfa ilk yüklendiğinde soru süresini başlat
    if (examData && !questionStartTime) {
      setQuestionStartTime(new Date());
    }

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";

      if (isVisible && !isPageFocused) {
        // Sayfa tekrar görünür olduğunda
        setIsPageFocused(true);
        setQuestionStartTime(new Date());
      } else if (!isVisible && isPageFocused) {
        // Sayfa görünmez olduğunda
        setIsPageFocused(false);

        // Geçen süreyi kaydet
        updateTimeSpent();
      }
    };

    const handleFocus = () => {
      if (!isPageFocused) {
        setIsPageFocused(true);
        setQuestionStartTime(new Date());
      }
    };

    const handleBlur = () => {
      if (isPageFocused) {
        setIsPageFocused(false);

        // Geçen süreyi kaydet
        updateTimeSpent();
      }
    };

    // Geçen süreyi hesaplayan yardımcı fonksiyon
    const updateTimeSpent = () => {
      if (questionStartTime && examData) {
        const currentQuestion = examData.questions[currentQuestionIndex];
        const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);

        if (timeSpent > 0) {
          setQuestionTimeSpent(prev => ({
            ...prev,
            [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
          }));

          setCurrentQuestionTimeSpent(prev => prev + timeSpent);
          setQuestionStartTime(null); // Süre hesaplandıktan sonra sıfırla
        }
      }
    };

    // Event listener'ları ekle
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [currentQuestionIndex, examData, isPageFocused, questionStartTime]);

  // Kalan süre sayacı
  useEffect(() => {
    if (timeLeft === null || !isPageFocused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmitExam, isPageFocused]);

  // Geçen süreyi hesaplayan yardımcı fonksiyon
  const updateCurrentQuestionTimeSpent = useCallback(() => {
    if (questionStartTime && examData) {
      const currentQuestion = examData.questions[currentQuestionIndex];
      const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);

      if (timeSpent > 0) {
        setQuestionTimeSpent(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
        }));

        setCurrentQuestionTimeSpent(0); // Sıfırla
        return true;
      }
    }
    return false;
  }, [examData, currentQuestionIndex, questionStartTime]);

  // Sonraki soruya geç
  const handleNextQuestion = async () => {
    if (!examData) return;

    // Mevcut soru için geçen süreyi kaydet
    updateCurrentQuestionTimeSpent();

    // Sonraki soruya geç
    if (currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswerResult(null); // Cevap sonucunu sıfırla
      setCurrentQuestionTimeSpent(0); // Soru süresini sıfırla

      // Yeni soru için süreyi başlat (setTimeout ile sıralama sorunlarını önle)
      setTimeout(() => {
        setQuestionStartTime(new Date());
      }, 0);

      // Sonraki soru için önceden verilmiş bir cevap varsa seç
      const nextQuestion = examData.questions[currentQuestionIndex + 1];
      if (answers[nextQuestion.id]) {
        setSelectedAnswer(answers[nextQuestion.id]);
      }

      // İlerlemeyi kaydet
      try {
        await fetch(`/api/exams/${examId}/attempt/${attemptId}/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentQuestionIndex: currentQuestionIndex + 1,
          }),
        });
      } catch (error) {
        toast.error("İlerleme kaydedilirken bir hata oluştu");
      }
    }
  };

  // Önceki soruya dön
  const handlePrevQuestion = () => {
    if (!examData || currentQuestionIndex <= 0) return;

    // Mevcut soru için geçen süreyi kaydet
    updateCurrentQuestionTimeSpent();

    setCurrentQuestionIndex((prev) => prev - 1);
    setAnswerResult(null); // Cevap sonucunu sıfırla
    setCurrentQuestionTimeSpent(0); // Soru süresini sıfırla

    // Yeni soru için süreyi başlat (setTimeout ile sıralama sorunlarını önle)
    setTimeout(() => {
      setQuestionStartTime(new Date());
    }, 0);

    // Önceki soru için verilmiş bir cevap varsa seç
    const prevQuestion = examData.questions[currentQuestionIndex - 1];
    setSelectedAnswer(answers[prevQuestion.id] || null);
  };

  // Kalan süreyi formatlı göster
  const formatTimeLeft = () => {
    if (timeLeft === null) return "--:--";

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Sınav yükleniyor...</p>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Sınav bulunamadı</p>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];



  // Sağ tıklama ve metin seçimini engelleme fonksiyonları
  useEffect(() => {
    // Sağ tıklama engelleme
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Metin seçimini engelleme
    const disableSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Kopyalama engelleme
    const disableCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Event listener'ları ekle
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', disableSelection);
    document.addEventListener('copy', disableCopy);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', disableSelection);
      document.removeEventListener('copy', disableCopy);
    };
  }, []);

  return (
    <div className="container mx-auto max-w-4xl select-none">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{examData.title}</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Soru {currentQuestionIndex + 1} / {examData.questions.length}
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-md font-mono">
            {formatTimeLeft()}
          </div>
          {!isPageFocused && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-md text-xs animate-pulse">
              Sayfa Odakta Değil
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soru {currentQuestionIndex + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sayfa odakta değilken içeriği bulanıklaştır */}
          <div className="relative">
            {!isPageFocused && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 flex items-center justify-center">
                <div className="text-center p-6 bg-background rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold mb-2">Sayfa Odakta Değil</h3>
                  <p className="mb-4">Sınav sayfasına geri dönün. Başka sekme veya pencere açmak yasaktır.</p>
                  <p className="text-sm text-muted-foreground">Sınav süreniz duraklatıldı.</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-lg">{currentQuestion.question_text}</p>
            </div>

          <RadioGroup
            value={selectedAnswer || ""}
            onValueChange={(value) => {
              // Hemen seçimi güncelle ve yükleme göstergesini göster
              setSelectedAnswer(value);
              setIsCheckingAnswer(true);

              // Cevabı API'ye gönder
              fetch(`/api/exams/${examId}/attempt/${attemptId}/answer?t=${Date.now()}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  questionId: currentQuestion.id,
                  answer: value,
                  timeSpentSeconds: 1, // Basitleştirilmiş süre
                }),
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`API hatası: ${response.status}`);
                }
                return response.json();
              })
              .then(data => {
                // Debug bilgisini konsola yazdır
                if (data.debug) {
                  console.log("API'den gelen debug bilgisi:", data.debug);
                }

                // Cevapları güncelle
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.id]: value,
                }));

                // Cevap sonucunu ayarla
                setAnswerResult({
                  isCorrect: data.isCorrect,
                  correctAnswer: data.correctAnswer,
                  explanation: data.explanation || "",
                });
              })
              .catch(error => {
                // Hata durumunda kullanıcıya bilgi ver
                toast.error("Cevap kontrolünde bir sorun oluştu");
              })
              .finally(() => {
                // Her durumda yükleme göstergesini kapat
                setIsCheckingAnswer(false);
              });
            }}
            className={`space-y-3 ${isCheckingAnswer ? "opacity-70 pointer-events-none" : ""}`}
          >
            {Object.entries(currentQuestion.options).map(([key, value], index) => {
              // Şık numarasını A, B, C, D şeklinde göster
              const optionLabel = String.fromCharCode(65 + index); // 0 -> A, 1 -> B, 2 -> C, 3 -> D

              // Güvenlik için cevap bilgilerini HTML'de göstermiyoruz
              const isCorrectOption = answerResult && optionLabel === answerResult.correctAnswer;
              const isWrongSelection = answerResult && optionLabel === selectedAnswer && !isCorrectOption;

              return (
                <div
                  key={key}
                  className={`flex items-center space-x-2 border p-3 rounded-md ${
                    isCorrectOption
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : isWrongSelection
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : ""
                  }`}
                >
                  <RadioGroupItem
                    value={optionLabel} // A, B, C, D değerini kullanıyoruz
                    id={`option-${key}`}
                    disabled={!!answerResult || isCheckingAnswer}
                  />
                  <Label htmlFor={`option-${key}`} className="flex-1">
                    <span className="font-bold">{optionLabel}.</span> {value}
                    {isCorrectOption && (
                      <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />
                    )}
                    {isWrongSelection && (
                      <XCircle className="inline ml-2 h-4 w-4 text-red-500" />
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {isCheckingAnswer && (
            <div className="mt-4 flex items-center justify-center space-x-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800 animate-pulse">
              <div className="relative">
                <div className="animate-spin h-6 w-6 border-3 border-blue-600 rounded-full border-t-transparent"></div>
                <div className="absolute inset-0 animate-ping opacity-30 h-6 w-6 border-3 border-blue-400 rounded-full"></div>
              </div>
              <p className="text-base font-medium text-blue-700 dark:text-blue-300">Cevap kontrol ediliyor...</p>
            </div>
          )}

          {answerResult && (
            <Alert
              className={`mt-4 ${
                answerResult.isCorrect
                  ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                  : "bg-red-50 dark:bg-red-900/20 border-red-500"
              }`}
            >
              <AlertTitle
                className={
                  answerResult.isCorrect
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }
              >
                {answerResult.isCorrect ? "Doğru Cevap!" : "Yanlış Cevap!"}
                {" "}
                {/* Doğru cevabı A, B, C, D formatında göster */}
                <span className="font-bold">
                  (Doğru cevap: {answerResult.correctAnswer})
                </span>
              </AlertTitle>
              {answerResult.explanation && (
                <AlertDescription className="mt-2">
                  <strong>Açıklama:</strong> {answerResult.explanation}
                </AlertDescription>
              )}
            </Alert>
          )}
          </div> {/* Bulanıklaştırma div'ini kapat */}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0 || !isPageFocused || isCheckingAnswer}
          >
            Önceki Soru
          </Button>

          <div>
            {currentQuestionIndex === examData.questions.length - 1 ? (
              <Button
                onClick={handleSubmitExam}
                disabled={!isPageFocused || isCheckingAnswer}
                variant="destructive"
              >
                Sınavı Bitir
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={!isPageFocused || isCheckingAnswer}
              >
                Sonraki Soru
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>



      {/* Sayfa odakta değilken bilgi mesajı */}
      {!isPageFocused && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg animate-pulse max-w-xs">
          <h4 className="font-bold mb-2">Uyarı!</h4>
          <p className="text-sm">Sınav sayfasından ayrıldınız. Sınava devam etmek için bu sayfaya geri dönün.</p>
        </div>
      )}
    </div>
  );
}
