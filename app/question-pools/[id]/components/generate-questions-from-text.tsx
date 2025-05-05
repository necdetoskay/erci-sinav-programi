"use client";

import { useState, useEffect } from "react"; // useEffect eklendi
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card"; // Card importları eklendi
import { cn } from "@/lib/utils"; // cn import edildi
import { AILoading } from "@/components/ui/ai-loading"; // AILoading import edildi
import { v4 as uuidv4 } from "uuid"; // UUID import edildi (API'den gelmiyorsa diye)
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Tooltip importları eklendi

// GeneratedQuestion tipi tanımlandı (generate-questions.tsx'den alındı)
type GeneratedQuestion = {
  id: string; // API'den UUID gelmeli, gelmiyorsa burada atanabilir
  questionText: string;
  options: Array<{
    text: string;
    label: string;
  }>;
  correctAnswer: string;
  explanation: string;
  difficulty: "Kolay" | "Orta" | "Zor"; // Zorluk tipi güncellendi
  approved?: boolean; // Onay durumu
};


interface GenerateQuestionsFromTextProps {
  poolId: string | undefined; // poolId string olarak kalabilir, API isteğinde parseInt yapılır
  poolTitle: string | undefined;
  onQuestionsGenerated: () => void;
}

export function GenerateQuestionsFromText({
  poolId,
  poolTitle,
  onQuestionsGenerated,
}: GenerateQuestionsFromTextProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextText, setContextText] = useState("");
  const [numQuestions, setNumQuestions] = useState(1);
  const [difficulty, setDifficulty] = useState<"Kolay" | "Orta" | "Zor">("Orta"); // Tip belirtildi
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-exp:free");
  const [isLoading, setIsLoading] = useState(false);

  // Yeni state'ler eklendi
  const [currentStep, setCurrentStep] = useState(0); // 0: Form, 1+: Review
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  // Form ve state'leri sıfırlama fonksiyonu
  const resetFormAndState = () => {
    setContextText("");
    setNumQuestions(1);
    setDifficulty("Orta");
    setSelectedModel("google/gemini-2.0-flash-exp:free");
    setCurrentStep(0);
    setGeneratedQuestions([]);
    setIsLoading(false);
  };

  // Dialog kapanma fonksiyonu
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetFormAndState(); // Dialog kapanınca sıfırla
    }
  };


  const handleGenerate = async () => {
    if (!poolId) {
      toast.error("Soru havuzu ID'si bulunamadı.");
      return;
    }
    if (!contextText.trim()) {
      toast.error("Lütfen soru üretilecek metni (prompt) girin.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/question-pools/${poolId}/generate-from-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: contextText,
          numQuestions,
          difficulty,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        let errorPayload = { error: `HTTP ${response.status}: ${response.statusText}`, message: `Model ile soru üretilirken bir hata oluştu (${response.status})` };
        try {
          // API'den gelen JSON hata mesajını almaya çalış
          const errorJson = await response.json();
          // API'nin yapılandırılmış hata döndürdüğünü varsayıyoruz
          if (errorJson && (errorJson.message || errorJson.error)) {
             errorPayload = errorJson; // API'den gelen mesajı kullan
          }
        } catch (e) {
           // JSON parse edilemezse, text olarak almayı dene (nadiren gerekebilir)
           try {
               const errorText = await response.text();
               errorPayload.message = errorText || errorPayload.message;
           } catch (textError) {
                console.error("Could not read error response body:", textError);
           }
        }
        console.error("API Error Data:", errorPayload);
        // Hata mesajını fırlat ki catch bloğu yakalasın
       throw new Error(JSON.stringify(errorPayload)); // Hata payload'ını JSON string olarak fırlat
      }

      const questions: GeneratedQuestion[] = await response.json();

      // API'den gelen sorulara onay durumunu ekle
      setGeneratedQuestions(questions.map(q => ({
        ...q,
        id: q.id || uuidv4(), // API id döndürmezse diye UUID ata
        approved: false
       })));
      setCurrentStep(1); // İnceleme adımına geç
      toast.success(`${questions.length} adet soru üretildi. Lütfen inceleyin.`);

    } catch (error: any) {
        console.error("Soru üretme hatası (catch bloğu):", error);
        let displayMessage = "Sorular üretilirken bilinmeyen bir hata oluştu."; // Varsayılan mesaj

        if (error instanceof Error) {
            const rawErrorMessage = error.message; // Bu genellikle JSON string'i içerir

            // 1. Öncelik: Spesifik hata metinlerini HAM mesajda ara
            if (rawErrorMessage.includes("beklenmedik yapı") || rawErrorMessage.includes("unexpected structure") || rawErrorMessage.includes("API yanıtı beklenen yapıda değil")) {
                displayMessage = "Model yanıtı beklenmedik formatta. Lütfen farklı bir model deneyin veya prompt'u değiştirin.";
            } else if (rawErrorMessage.includes("Quota exceeded") || rawErrorMessage.includes("quota_exceeded")) {
                 // Kota hatası için API'den gelen JSON mesajını parse etmeye çalış (varsa)
                 try {
                     const jsonPart = rawErrorMessage.substring(rawErrorMessage.indexOf('{'));
                     const errorData = JSON.parse(jsonPart);
                     if (errorData && errorData.message) {
                         displayMessage = errorData.message; // API'nin detaylı mesajını kullan
                     } else {
                         displayMessage = "Seçilen model için kullanım kotası aşıldı. Lütfen farklı bir model deneyin.";
                     }
                 } catch (e) {
                     // Parse edilemezse genel kota mesajı
                     displayMessage = "Seçilen model için kullanım kotası aşıldı. Lütfen farklı bir model deneyin.";
                 }
            } else {
                // 2. Spesifik metinler yoksa, JSON parse etmeyi dene (API'den gelen genel hata olabilir)
                let parsedErrorData = null;
                if (rawErrorMessage.startsWith('{')) { // Sadece JSON string ise parse etmeyi dene
                    try {
                        parsedErrorData = JSON.parse(rawErrorMessage);
                    } catch (e) {
                        console.warn("Could not parse error message as JSON in catch block:", rawErrorMessage);
                    }
                }

                if (parsedErrorData) {
                    if (parsedErrorData.message) {
                        displayMessage = parsedErrorData.message; // API'den gelen genel mesaj
                    } else if (parsedErrorData.error) {
                        // 'error' alanı varsa onu kullan
                        displayMessage = typeof parsedErrorData.error === 'string' ? parsedErrorData.error : JSON.stringify(parsedErrorData.error);
                    } else {
                        // JSON parse edildi ama bilinen alan yoksa ham mesajı kullan
                        displayMessage = rawErrorMessage;
                    }
                // 3. JSON parse edilemediyse veya JSON değilse, ham hata mesajını kullan
                } else {
                    displayMessage = rawErrorMessage;
                }
            }
        } else {
             // Error değilse (nadiren)
             try {
                displayMessage = JSON.stringify(error);
             } catch {
                displayMessage = "Beklenmedik bir hata türü oluştu.";
             }
        }

        // Sonuçta belirlenen hata mesajını göster
        toast.error(displayMessage);
        setCurrentStep(0); // Hata durumunda forma geri dön
    } finally {
      setIsLoading(false);
    }
  };

  // Onaylama fonksiyonu (generate-questions.tsx'den alındı)
  function toggleApproval(questionId: string) {
    setGeneratedQuestions(prev => {
      const newQuestions = prev.map(q =>
        q.id === questionId ? { ...q, approved: !q.approved } : q
      );

      // Eğer soru onaylandıysa ve başka sorular varsa, otomatik olarak sonraki soruya geç
      const currentQuestionDetails = newQuestions.find(q => q.id === questionId);
      const totalSteps = newQuestions.length; // totalSteps burada tanımlandı
      if (currentQuestionDetails?.approved && currentStep < totalSteps) {
        setTimeout(() => setCurrentStep(currentStep + 1), 300); // Küçük bir gecikme eklendi
      }

      return newQuestions;
    });
  }

  // Onaylananları kaydetme fonksiyonu (generate-questions.tsx'den alındı)
  async function saveApprovedQuestions() {
    if (!poolId) {
      toast.error("Soru havuzu ID'si bulunamadı.");
      return;
    }
    try {
      const approvedQuestions = generatedQuestions.filter(q => q.approved);

      if (approvedQuestions.length === 0) {
        toast.error("Lütfen en az bir soru onaylayın");
        return;
      }

      // Batch kaydetme API endpoint'ine istek gönder
      const response = await fetch(`/api/question-pools/${poolId}/questions/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // API'nin beklediği formatta gönder (questionPoolId eklenmeli mi?)
        // generate-questions.tsx'deki API /batch endpoint'inin beklentisine göre ayarlanmalı
        body: JSON.stringify({ questions: approvedQuestions }),
      });

      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(errorData.error || "Sorular kaydedilirken bir hata oluştu");
      }

      toast.success("Onaylanan sorular başarıyla kaydedildi");
      setIsOpen(false); // Dialog'u kapat
      resetFormAndState(); // State'i sıfırla
      onQuestionsGenerated(); // Soru listesini yenile

    } catch (error: any) {
      console.error("Kaydetme hatası:", error);
      toast.error(`Sorular kaydedilirken bir hata oluştu: ${error.message}`);
    }
  }

  // Mevcut soru ve toplam adım sayısı
  const currentQuestion = generatedQuestions[currentStep - 1];
  const totalSteps = generatedQuestions.length;

  return (
    // Dialog onOpenChange güncellendi
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              {/* Buton adı güncellendi */}
              <Button variant="outline">Metinden Soru Üret</Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>açılan formda yapıştırılan metin üzerinden sorular üretilir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Dialog boyutu ayarlandı */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Başlık ve açıklama dinamik hale getirildi */}
          <DialogTitle>Yapay Zeka ile Soru Üret (Prompt)</DialogTitle>
          <DialogDescription>
            {currentStep === 0
              ? "Soru üretme konusunu (prompt), sayısını ve modelini seçin."
              : `Üretilen ${totalSteps} soruyu inceleyin ve onaylayın.`}
          </DialogDescription>
        </DialogHeader>

        {/* İçerik render mantığı */}
        {isLoading && currentStep === 0 ? ( // Sadece ilk adımda yükleniyor göstergesi
          <AILoading className="my-8" />
        ) : currentStep === 0 ? (
          // Form Bölümü
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="context-text" className="text-right pt-2">
                Soru Üretme Konusu (Prompt)
              </Label>
              <Textarea
                id="context-text"
                placeholder="Yapay zekanın hangi konu hakkında soru üretmesini istediğinizi buraya yazın..."
                className="col-span-3 h-32"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="num-questions" className="text-right">
                Soru Sayısı
              </Label>
              <Input
                id="num-questions"
                type="number"
                min="1"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 1)}
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Zorluk Seviyesi
              </Label>
              <Select
                value={difficulty}
                onValueChange={(value: "Kolay" | "Orta" | "Zor") => setDifficulty(value)} // Tip eklendi
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Zorluk Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kolay">Kolay</SelectItem>
                  <SelectItem value="Orta">Orta</SelectItem>
                  <SelectItem value="Zor">Zor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="llm-model" className="text-right">
                Model
              </Label>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Model Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="deepseek/deepseek-chat-v3-0324:free">DeepSeek Chat v3</SelectItem>
                  <SelectItem value="meta-llama/llama-4-scout:free">Llama 4 Scout</SelectItem>
                  <SelectItem value="qwen/qwen3-235b-a22b:free">Qwen 3</SelectItem>
                  <SelectItem value="deepseek-ai/deepseek-coder-33b-instruct">DeepSeek Coder</SelectItem>
                  <SelectItem value="google/gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <DialogFooter>
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading || !contextText.trim() || !poolId}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Soru Üret
                </Button>
              </DialogFooter>
          </div>
        ) : (
          // İnceleme Bölümü (generate-questions.tsx'den uyarlandı)
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Soru {currentStep} / {totalSteps}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm" // Boyut ayarlandı
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                   size="sm" // Boyut ayarlandı
                  onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                  disabled={currentStep === totalSteps}
                >
                  Sonraki
                </Button>
              </div>
            </div>

            {currentQuestion && (
              <Card className={cn(
                "border-2 transition-colors",
                currentQuestion.approved ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-muted" // Onaylanınca hafif arkaplan
              )}>
                <CardContent className="pt-6 space-y-4">
                  {/* Soru Metni */}
                   <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentQuestion.questionText || "" }} />

                  {/* Seçenekler */}
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => (
                      <div
                        key={option.label}
                        className={cn(
                          "p-3 rounded-md border text-sm", // Stil ayarlandı
                          option.label === currentQuestion.correctAnswer
                            ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
                            : "border-gray-200 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700"
                        )}
                      >
                        <span className="font-medium mr-2">{option.label})</span>
                        <span dangerouslySetInnerHTML={{ __html: option.text || "" }} />
                      </div>
                    ))}
                  </div>

                  {/* Açıklama */}
                  {currentQuestion.explanation && (
                     <div className="prose prose-sm max-w-none dark:prose-invert pt-2">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Açıklama</h4>
                        <div dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
                     </div>
                  )}


                  {/* Alt Kısım: Zorluk ve Onay Butonu */}
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Zorluk:</span>
                      {/* Zorluk seviyesini göster */}
                      <span className="text-sm font-semibold">{currentQuestion.difficulty}</span>
                    </div>
                    <Button
                      size="sm" // Boyut ayarlandı
                      variant={currentQuestion.approved ? "destructive" : "secondary"}
                      onClick={() => toggleApproval(currentQuestion.id)}
                    >
                      {currentQuestion.approved ? "Onayı Kaldır" : "Onayla"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Kaydet Butonu (Son adımda gösterilir) */}
            {currentStep > 0 && ( // Sadece inceleme adımında göster
              <DialogFooter className="mt-6">
                 <Button
                    onClick={saveApprovedQuestions}
                    disabled={!generatedQuestions.some(q => q.approved)} // En az bir onaylı soru varsa aktif
                 >
                   Onaylanan {generatedQuestions.filter(q => q.approved).length} Soruyu Kaydet
                 </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
