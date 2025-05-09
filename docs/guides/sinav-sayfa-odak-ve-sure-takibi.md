# Sınav Sayfası Odak Durumu ve Süre Takibi Rehberi

Bu rehber, sınav uygulamasında sayfa odak durumunun nasıl izleneceğini ve soru sürelerinin nasıl takip edileceğini açıklar.

## İçindekiler

1. [Giriş](#giriş)
2. [Sayfa Odak Durumu İzleme](#sayfa-odak-durumu-izleme)
3. [Soru Süresi Takibi](#soru-süresi-takibi)
4. [Sayfa Odakta Değilken Soruyu Bulanıklaştırma](#sayfa-odakta-değilken-soruyu-bulanıklaştırma)
5. [Sayfa Odakta Değilken Süreyi Durdurma](#sayfa-odakta-değilken-süreyi-durdurma)
6. [Soru Değiştiğinde Süreyi Sıfırlama](#soru-değiştiğinde-süreyi-sıfırlama)
7. [Süreyi API'ye Gönderme](#süreyi-apiye-gönderme)

## Giriş

Sınav uygulamasında, kullanıcının sınav sayfasından başka bir sayfaya geçtiğinde veya tarayıcı sekmesini değiştirdiğinde sürenin durdurulması ve sorunun bulanıklaştırılması, kopya çekilmesini önlemek için önemli güvenlik önlemleridir. Ayrıca, her soru için geçen sürenin takip edilmesi, kullanıcının hangi sorularda ne kadar zaman harcadığını analiz etmek için faydalıdır.

## Sayfa Odak Durumu İzleme

### State Tanımlama

Sayfa odak durumunu izlemek için bir state tanımlayın:

```typescript
// Sayfa odak durumu
const [isPageFocused, setIsPageFocused] = useState(true);
```

### Event Listener'lar Ekleme

Sayfa odak durumunu izlemek için event listener'lar ekleyin:

```typescript
useEffect(() => {
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
}, [isPageFocused, updateTimeSpent]);
```

## Soru Süresi Takibi

### State Tanımlama

Soru sürelerini takip etmek için state'ler tanımlayın:

```typescript
// Soru için geçen süre
const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<number, number>>({});
const [currentQuestionTimeSpent, setCurrentQuestionTimeSpent] = useState(0);
```

### Süre Hesaplama

Geçen süreyi hesaplamak için bir yardımcı fonksiyon oluşturun:

```typescript
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
```

## Sayfa Odakta Değilken Soruyu Bulanıklaştırma

Sayfa odakta değilken soruyu bulanıklaştırmak için CSS ve koşullu render kullanın:

```tsx
{/* Sayfa odakta değilken içeriği bulanıklaştır */}
<div className={`relative ${!isPageFocused ? "select-none" : ""}`}>
  {!isPageFocused && (
    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 flex items-center justify-center">
      <div className="text-center p-6 bg-background rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-2">Sayfa Odakta Değil</h3>
        <p className="mb-4">Sınav sayfasına geri dönün. Başka sekme veya pencere açmak yasaktır.</p>
        <p className="text-sm text-muted-foreground">Sınav süreniz duraklatıldı.</p>
      </div>
    </div>
  )}
  
  {/* Soru içeriği */}
  <div className="mb-4">
    <p className="text-lg">{currentQuestion.question_text}</p>
  </div>
  
  {/* Şıklar */}
  <RadioGroup
    value={selectedAnswer || ""}
    onValueChange={(value) => {
      // ...
    }}
    className={`space-y-3 ${isCheckingAnswer ? "opacity-70 pointer-events-none" : ""}`}
  >
    {/* ... */}
  </RadioGroup>
</div>
```

## Sayfa Odakta Değilken Süreyi Durdurma

Sayfa odakta değilken süreyi durdurmak için kalan süre sayacını güncelleyin:

```typescript
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
```

## Soru Değiştiğinde Süreyi Sıfırlama

Soru değiştiğinde süreyi sıfırlamak için sonraki/önceki soru fonksiyonlarını güncelleyin:

```typescript
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

    // ...
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

  // ...
};
```

## Süreyi API'ye Gönderme

Cevap gönderildiğinde geçen süreyi de API'ye gönderin:

```typescript
// Cevabı kaydet ve kontrol et
const saveAnswer = useCallback(async () => {
  if (!examData || selectedAnswer === null) return;

  const currentQuestion = examData.questions[currentQuestionIndex];
  setIsCheckingAnswer(true);

  try {
    // Mevcut soru için geçen süreyi hesapla
    let timeSpent = currentQuestionTimeSpent;
    if (questionStartTime) {
      const additionalTime = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
      if (additionalTime > 0) {
        timeSpent += additionalTime;
      }
    }

    // Toplam geçen süreyi güncelle
    const totalTimeSpent = questionTimeSpent[currentQuestion.id] || 0;
    const finalTimeSpent = totalTimeSpent + timeSpent;

    // API isteği
    const response = await fetch(`/api/exams/${examId}/attempt/${attemptId}/answer?nocache=${Date.now()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        timeSpentSeconds: finalTimeSpent > 0 ? finalTimeSpent : 1, // En az 1 saniye
      }),
    });

    // ...

    // Soru süresini güncelle
    setQuestionTimeSpent(prev => ({
      ...prev,
      [currentQuestion.id]: finalTimeSpent
    }));

    // Mevcut soru süresini sıfırla ve yeni süreyi başlat
    setCurrentQuestionTimeSpent(0);
    
    // setTimeout ile sıralama sorunlarını önle
    setTimeout(() => {
      setQuestionStartTime(new Date());
    }, 0);

    // ...
  } catch (error) {
    // ...
  } finally {
    // ...
  }
}, [examData, selectedAnswer, currentQuestionIndex, examId, attemptId, questionStartTime, currentQuestionTimeSpent, questionTimeSpent]);
```

### API Endpoint'i Güncelleme

API endpoint'ini geçen süreyi kaydetmesi için güncelleyin:

```typescript
// Cevabı kaydet veya güncelle
await prisma.examAttemptAnswer.upsert({
  where: {
    examAttemptId_questionId: {
      examAttemptId: attemptId,
      questionId: questionId,
    },
  },
  update: {
    selectedAnswer: answer,
    isCorrect: isCorrect,
    timeSpentSeconds: finalTimeSpent,
  },
  create: {
    examAttemptId: attemptId,
    questionId: questionId,
    selectedAnswer: answer,
    isCorrect: isCorrect,
    timeSpentSeconds: finalTimeSpent,
  },
});
```

Bu rehber, sınav uygulamasında sayfa odak durumunun nasıl izleneceğini ve soru sürelerinin nasıl takip edileceğini açıklar. Yukarıdaki örnekleri kendi projenize uyarlayarak kullanabilirsiniz.
