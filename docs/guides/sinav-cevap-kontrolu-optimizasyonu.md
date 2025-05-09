# Sınav Cevap Kontrolü Optimizasyon Rehberi

Bu rehber, sınav uygulamasında cevap kontrolü işleminin nasıl optimize edileceğini ve performansının nasıl artırılacağını açıklar.

## İçindekiler

1. [Giriş](#giriş)
2. [API Endpoint Optimizasyonu](#api-endpoint-optimizasyonu)
3. [İstemci Tarafı Optimizasyonu](#istemci-tarafı-optimizasyonu)
4. [Kullanıcı Deneyimi İyileştirmeleri](#kullanıcı-deneyimi-iyileştirmeleri)
5. [Güvenlik Önlemleri](#güvenlik-önlemleri)
6. [Soru Süresi Takibi](#soru-süresi-takibi)
7. [Sayfa Odak Durumu Kontrolü](#sayfa-odak-durumu-kontrolü)

## Giriş

Sınav uygulamasında cevap kontrolü, kullanıcının bir soruya verdiği cevabın doğru olup olmadığını kontrol eden ve sonucu kullanıcıya gösteren bir işlemdir. Bu işlemin hızlı ve güvenli bir şekilde gerçekleştirilmesi, kullanıcı deneyimi açısından önemlidir.

## API Endpoint Optimizasyonu

### Paralel Sorgular Kullanma

Veritabanı sorgularını paralel olarak çalıştırmak, API yanıt süresini önemli ölçüde azaltabilir:

```typescript
// Soruyu ve denemeyi paralel olarak getir
const [question, attempt] = await Promise.all([
  prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, correct_answer: true, explanation: true },
  }),
  prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, answers: true },
  }),
]);
```

### Veritabanı Güncellemelerini Paralel Yapma

Birden fazla veritabanı güncellemesi varsa, bunları da paralel olarak yapabilirsiniz:

```typescript
// Veritabanı güncellemelerini paralel olarak yap
await Promise.all([
  // Cevabı kaydet
  prisma.examAttemptAnswer.upsert({
    // ... upsert işlemi
  }),
  // Denemeyi güncelle
  prisma.examAttempt.update({
    // ... update işlemi
  }),
]);
```

### Önbellek Kontrolü

API yanıtlarının önbelleğe alınmamasını sağlamak için uygun başlıkları ekleyin:

```typescript
return new NextResponse(
  JSON.stringify({
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation || "",
  }),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  }
);
```

## İstemci Tarafı Optimizasyonu

### Fetch İsteğini Optimize Etme

Fetch isteğini optimize etmek için önbellek kontrolünü devre dışı bırakın ve zaman damgası ekleyin:

```typescript
const response = await fetch(`/api/exams/${examId}/attempt/${attemptId}/answer?nocache=${Date.now()}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    questionId: currentQuestion.id,
    answer: selectedAnswer,
    timeSpentSeconds: finalTimeSpent,
  }),
});
```

### Veri Kontrolü

API yanıtını işlemeden önce veri yapısını kontrol edin:

```typescript
// Cevap sonucunu ayarla - veri kontrolü yaparak
if (data && typeof data.isCorrect === 'boolean' && data.correctAnswer) {
  setAnswerResult({
    isCorrect: data.isCorrect,
    correctAnswer: data.correctAnswer,
    explanation: data.explanation || "",
  });
} else {
  // Veri yapısı beklediğimiz gibi değilse hata göster
  console.error("API yanıtı beklenmeyen formatta:", data);
  toast.error("Cevap kontrolünde bir sorun oluştu. Lütfen tekrar deneyin.");
}
```

### Hata İşleme

Hata durumlarını düzgün bir şekilde işleyin ve kullanıcıya bilgi verin:

```typescript
try {
  // API çağrısı ve veri işleme
} catch (error) {
  console.error("Cevap işleme hatası:", error);
  toast.error("Cevap kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
  setAnswerResult(null);
} finally {
  // Her durumda yükleme göstergesini kapat
  setIsCheckingAnswer(false);
}
```

## Kullanıcı Deneyimi İyileştirmeleri

### Yükleme Göstergesi

Cevap kontrol edilirken kullanıcıya bir yükleme göstergesi gösterin:

```tsx
{isCheckingAnswer && (
  <div className="mt-4 flex items-center justify-center space-x-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800 animate-pulse">
    <div className="relative">
      <div className="animate-spin h-6 w-6 border-3 border-blue-600 rounded-full border-t-transparent"></div>
      <div className="absolute inset-0 animate-ping opacity-30 h-6 w-6 border-3 border-blue-400 rounded-full"></div>
    </div>
    <p className="text-base font-medium text-blue-700 dark:text-blue-300">Cevap kontrol ediliyor...</p>
  </div>
)}
```

### Şık İşaretleme

Şık işaretlendiğinde hemen yükleme göstergesini gösterin ve kullanıcı arayüzünü devre dışı bırakın:

```tsx
<RadioGroup
  value={selectedAnswer || ""}
  onValueChange={(value) => {
    // Hemen seçimi güncelle ve yükleme göstergesini göster
    setSelectedAnswer(value);
    setIsCheckingAnswer(true);
    
    // Mikro-optimizasyon: Tarayıcının render işlemini tamamlamasını bekle
    setTimeout(() => {
      saveAnswer();
    }, 0);
  }}
  className={`space-y-3 ${isCheckingAnswer ? "opacity-70 pointer-events-none" : ""}`}
>
```

## Güvenlik Önlemleri

### HTML'de Cevap Bilgilerini Gizleme

Cevap bilgilerini HTML'de doğrudan göstermek yerine, değişkenlere atayıp sadece sonuçları gösterin:

```tsx
{Object.entries(currentQuestion.options).map(([key, value]) => {
  // Güvenlik için cevap bilgilerini HTML'de göstermiyoruz
  const isCorrectOption = answerResult && key === answerResult.correctAnswer;
  const isWrongSelection = answerResult && key === selectedAnswer && !isCorrectOption;
  
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
      {/* ... */}
    </div>
  );
})}
```

## Soru Süresi Takibi

### Süre Hesaplama

Her soru için geçen süreyi hesaplayıp kaydedin:

```typescript
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
```

### Süreyi API'ye Gönderme

Cevap gönderildiğinde geçen süreyi de API'ye gönderin:

```typescript
body: JSON.stringify({
  questionId: currentQuestion.id,
  answer: selectedAnswer,
  timeSpentSeconds: finalTimeSpent > 0 ? finalTimeSpent : 1, // En az 1 saniye
}),
```

## Sayfa Odak Durumu Kontrolü

### Odak Durumunu İzleme

Sayfa odak durumunu izlemek için event listener'lar ekleyin:

```typescript
// Event listener'ları ekle
document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("focus", handleFocus);
window.addEventListener("blur", handleBlur);
```

### Odak Değiştiğinde Süreyi Durdurma

Sayfa odakta değilken süreyi durdurun:

```typescript
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
```

### Soruyu Bulanıklaştırma

Sayfa odakta değilken soruyu bulanıklaştırın:

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
</div>
```

Bu rehber, sınav uygulamasında cevap kontrolü işleminin nasıl optimize edileceğini ve performansının nasıl artırılacağını açıklar. Yukarıdaki örnekleri kendi projenize uyarlayarak kullanabilirsiniz.
