"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AILoading } from "@/components/ui/ai-loading";
import { v4 as uuidv4 } from "uuid";

// Zod şeması (API'nin beklediği alanlara göre güncellenebilir)
const formSchema = z.object({
  promptText: z.string().min(10, { message: "Prompt en az 10 karakter olmalıdır." }),
  count: z.coerce.number().min(1, "En az 1 soru üretilmeli").max(10, "En fazla 10 soru üretilebilir"), // API limiti 10
  // optionsPerQuestion: z.coerce.number().min(2).max(6), // API bunu bekliyor, ekleyelim
  model: z.enum([
    // "google/gemini-2.0-flash-exp:free", // Eski değeri kaldır
    "gemini-1.5-flash-latest", // Çalışan modeli ekle
    "deepseek/deepseek-chat-v3-0324:free",
    "meta-llama/llama-4-scout:free",
    "qwen/qwen3-235b-a22b:free",
    "deepseek-ai/deepseek-coder-33b-instruct",
    // "google/gemini-pro", // Eski model kaldırıldı
    "gemini-2.5-pro-exp-03-25", // Yeni model enum'a eklendi
    "meta-llama/llama-4-scout-17b-16e-instruct" // Groq modeli eklendi
  ]),
  // difficulty API tarafından doğrudan kullanılmıyor, prompt'a eklenebilir
  difficulty: z.enum(["easy", "medium", "hard"])
});

type FormData = z.infer<typeof formSchema>;

// Üretilen soru tipi (API yanıtına göre ayarlanmalı)
type GeneratedQuestion = {
  id: string; // UUID ile atanacak
  questionText: string;
  options: Array<{
    text: string;
    label: string; // A, B, C...
  }>;
  correctAnswer: string; // A, B, C...
  explanation: string;
  difficulty: "easy" | "medium" | "hard"; // Formdan gelen zorluk
  approved?: boolean;
};

interface GenerateQuestionsProps {
  poolId: number | undefined;
  poolTitle: string | undefined;
  onQuestionsGenerated: () => void;
}

export function GenerateQuestions({ poolId, poolTitle, onQuestionsGenerated }: GenerateQuestionsProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const router = useRouter();

  // Form alanları için state'ler
  const [promptText, setPromptText] = useState(poolTitle || "");
  const [count, setCount] = useState(1);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  // Varsayılan modeli de çalışanla değiştir
  const [model, setModel] = useState("gemini-1.5-flash-latest"); 
  const [optionsPerQuestion, setOptionsPerQuestion] = useState(4); // Seçenek sayısı için state
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  useEffect(() => {
    setPromptText(poolTitle || "");
  }, [poolTitle]);

  const resetFormAndState = () => {
    setPromptText(poolTitle || "");
    setCount(1);
    setDifficulty("medium");
    setModel("google/gemini-2.0-flash-exp:free");
    setOptionsPerQuestion(4); // Seçenek sayısını da sıfırla
    setCurrentStep(0);
    setGeneratedQuestions([]);
    setIsGenerating(false);
    setFormErrors([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetFormAndState();
    }
  };

  // API'den gelen metni parse etme fonksiyonu
  const parseGeneratedText = (text: string, count: number, difficulty: "easy" | "medium" | "hard"): GeneratedQuestion[] => {
    const questions: GeneratedQuestion[] = [];
    // Metni satırlara ayır
    const lines = text.trim().split('\n');
    let currentQuestion: Partial<GeneratedQuestion> = {};
    let options: Array<{ text: string; label: string }> = [];
    let questionCounter = 0;

    const optionRegex = /^([A-F])\)\s*(.*)/; // Seçenekleri yakalamak için regex
    // Regex'leri baştaki ve sondaki ** işaretlerini opsiyonel olarak alacak şekilde güncelle
    const answerRegex = /^\**Doğru Cevap:\**\s*([A-F])\**/i; 
    const explanationRegex = /^\**Açıklama:\**\s*(.*)/i;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Boş satırları atla

      // Soru metnini yakala (genellikle numara ile başlar)
      if (/^\d+\.\s*(.*)/.test(trimmedLine) && questionCounter < count) {
        // Önceki soruyu tamamla (varsa)
        if (currentQuestion.questionText) {
          currentQuestion.options = options;
          // Zorluk seviyesini formdan al
          currentQuestion.difficulty = difficulty;
          // ID ata
          currentQuestion.id = uuidv4();
          questions.push(currentQuestion as GeneratedQuestion);
        }
        // Yeni soruyu başlat
        questionCounter++;
        currentQuestion = { questionText: trimmedLine.replace(/^\d+\.\s*/, '') };
        options = [];
      }
      // Seçenekleri yakala
      else if (optionRegex.test(trimmedLine)) {
        const match = trimmedLine.match(optionRegex);
        if (match) {
          options.push({ label: match[1], text: match[2].trim() });
        }
      }
      // Doğru cevabı yakala
      else if (answerRegex.test(trimmedLine)) {
        const match = trimmedLine.match(answerRegex);
        if (match) {
          currentQuestion.correctAnswer = match[1].toUpperCase();
        }
      }
      // Açıklamayı yakala
      else if (explanationRegex.test(trimmedLine)) {
        const match = trimmedLine.match(explanationRegex);
        if (match) {
          // Açıklama metninden sondaki olası ** işaretini temizle
          currentQuestion.explanation = match[1].trim().replace(/\**$/, ''); 
        }
      }
      // Eğer hiçbirine uymuyorsa ve bir soru metni varsa, seçenek veya açıklamanın devamı olabilir
      else if (currentQuestion.questionText && options.length > 0) {
         // Son seçeneğe veya açıklamaya ekleme yapılabilir (şimdilik basit tutalım)
         console.warn("Unparsed line, potentially part of previous option/explanation:", trimmedLine);
      }
    }

    // Döngü bittikten sonra son soruyu ekle
    if (currentQuestion.questionText && questionCounter <= count) {
      currentQuestion.options = options;
      currentQuestion.difficulty = difficulty;
      currentQuestion.id = uuidv4();
      questions.push(currentQuestion as GeneratedQuestion);
    }

    // Eğer istenen sayıda soru parse edilemediyse uyarı ver
    if (questions.length !== count) {
        console.warn(`Expected ${count} questions, but parsed ${questions.length}. API response format might be inconsistent.`);
        toast.warning(`API ${count} soru üretmedi (${questions.length} üretildi). Yanıt formatı tutarsız olabilir.`);
    }


    return questions;
  };


  // Buton tıklamasıyla tetiklenecek fonksiyon
  const handleGenerateClick = async () => {
    setFormErrors([]);
    const formData = {
      promptText,
      count,
      difficulty, // Bu API'ye doğrudan gönderilmiyor, prompt'a eklenebilir
      model,
      optionsPerQuestion // API'nin beklediği alan
    };

    // Zod şemasını API'nin beklediği alanlara göre güncelleyelim
    const apiSchema = formSchema.extend({
        optionsPerQuestion: z.coerce.number().min(2).max(6)
    });

    const validationResult = apiSchema.safeParse(formData);
    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues);
      toast.error("Lütfen formdaki hataları düzeltin.");
      console.error("Form validation errors:", validationResult.error.flatten());
      return;
    }

    const validatedData = validationResult.data;
    console.log("onSubmit triggered with data:", validatedData);

    try {
      setIsGenerating(true);
      const apiUrl = "/api/generate-questions"; // Doğru API adresini kullan
      console.log(`Calling API: ${apiUrl}`);

      // API'nin beklediği payload'ı oluştur
      const apiPayload = {
        content: validatedData.promptText, // promptText -> content
        numberOfQuestions: validatedData.count, // count -> numberOfQuestions
        optionsPerQuestion: validatedData.optionsPerQuestion,
        model: validatedData.model,
        // difficulty prompt'a eklenebilir veya API'de işlenebilir
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      console.log("API Response Status:", response.status);

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        console.error("API Error Response Body:", responseData);
        throw new Error(responseData.error || `Sorular üretilirken bir hata oluştu (Status: ${response.status})`);
      }

      console.log("API raw response text:", responseData.questions); // API'den gelen ham metni logla

      // API'den gelen metni parse et
      const parsedQuestions = parseGeneratedText(responseData.questions, validatedData.count, validatedData.difficulty);
      console.log("Parsed Questions:", JSON.stringify(parsedQuestions, null, 2)); // Parse edilen soruları logla

      if (parsedQuestions.length === 0 && validatedData.count > 0) {
           console.error("Parsed questions array is empty despite successful API call.");
           toast.error("API yanıtı işlenemedi veya boş döndü. Yanıt formatını kontrol edin.");
           // Hata durumunda bile boş diziyle state'i güncelleyebiliriz veya hata mesajı gösterebiliriz.
           setGeneratedQuestions([]);
      } else {
          setGeneratedQuestions(parsedQuestions.map(q => ({ ...q, approved: false })));
      }

      setCurrentStep(1); // Onaylama adımına geç
      console.log("Moved to step 1");

    } catch (error) {
      console.error("Error in handleGenerateClick:", error);
      toast.error(error instanceof Error ? error.message : "Sorular üretilirken bilinmeyen bir hata oluştu");
    } finally {
      setIsGenerating(false);
      console.log("handleGenerateClick finished");
    }
  };


  async function saveApprovedQuestions() {
     // ... (saveApprovedQuestions kodu aynı kalıyor, ancak API endpoint'i kontrol edilmeli) ...
     console.log("saveApprovedQuestions triggered");
    try {
      const approvedQuestions = generatedQuestions.filter(q => q.approved);
      console.log("Approved questions:", approvedQuestions);
      if (approvedQuestions.length === 0) {
        toast.error("Lütfen en az bir soru onaylayın");
        return;
      }
      // Doğru API endpoint'ini kullandığımızdan emin olalım
      const batchApiUrl = `/api/question-pools/${poolId}/questions/batch`;
      console.log(`Calling API: ${batchApiUrl}`);
      const response = await fetch(batchApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // API'nin beklediği payload'ı kontrol et
        body: JSON.stringify({ questions: approvedQuestions }),
      });
      console.log("Save Batch API Response Status:", response.status);
      if (!response.ok) {
         const errorBody = await response.text();
         console.error("Save Batch API Error Response Body:", errorBody);
        throw new Error("Sorular kaydedilirken bir hata oluştu");
      }
      toast.success("Onaylanan sorular başarıyla kaydedildi");
      setOpen(false);
      resetFormAndState();
      onQuestionsGenerated();
    } catch (error) {
       console.error("Error saving approved questions:", error);
      toast.error(error instanceof Error ? error.message : "Sorular kaydedilirken bilinmeyen bir hata oluştu");
    }
  }

  function toggleApproval(questionId: string) {
    // ... (toggleApproval kodu aynı kalıyor) ...
    setGeneratedQuestions(prev => {
      const newQuestions = prev.map(q =>
        q.id === questionId ? { ...q, approved: !q.approved } : q
      );
      const currentQuestion = newQuestions.find(q => q.id === questionId);
      const currentIndex = newQuestions.findIndex(q => q.id === questionId);
      if (currentQuestion?.approved && currentIndex < newQuestions.length - 1) {
        setTimeout(() => setCurrentStep(currentIndex + 1 + 1), 300);
      }
      return newQuestions;
    });
  }

  const getError = (path: string) => formErrors.find(err => err.path.includes(path))?.message;

  const currentQuestion = generatedQuestions[currentStep - 1];
  const totalSteps = generatedQuestions.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          Yapay Zeka ile Soru Üret
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yapay Zeka ile Soru Üret</DialogTitle>
          <DialogDescription>
            {currentStep === 0
              ? "Üretilecek soru sayısını ve kullanılacak modeli seçin."
              : "Üretilen soruları inceleyin ve onaylayın."}
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <AILoading className="my-8" />
        ) : currentStep === 0 ? (
          // Basit HTML formu
          <div className="space-y-4 py-4">
            {/* Prompt Text */}
            <div className="space-y-2">
              <Label htmlFor="promptText">Soru Üretme Konusu (Prompt)</Label>
              <Textarea
                id="promptText"
                name="promptText"
                placeholder="Yapay zekanın hangi konu hakkında soru üretmesini istediğinizi buraya yazın..."
                className={`resize-y min-h-[80px] ${getError('promptText') ? 'border-red-500' : ''}`}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                required
              />
              {getError('promptText') && <p className="text-sm text-red-600">{getError('promptText')}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> {/* 4 sütun */}
              {/* Soru Sayısı */}
              <div className="space-y-2">
                 <Label htmlFor="count">Soru Sayısı</Label>
                 <Input
                   id="count"
                   name="count"
                   type="number"
                   min={1}
                   max={10} // API limitine göre ayarlandı
                   value={count}
                   onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                   required
                   className={getError('count') ? 'border-red-500' : ''}
                 />
                 {getError('count') && <p className="text-sm text-red-600">{getError('count')}</p>}
              </div>

               {/* Seçenek Sayısı */}
               <div className="space-y-2">
                 <Label htmlFor="optionsPerQuestion">Seçenek Sayısı</Label>
                 <Input
                   id="optionsPerQuestion"
                   name="optionsPerQuestion"
                   type="number"
                   min={2}
                   max={6} // API limitine göre ayarlandı
                   value={optionsPerQuestion}
                   onChange={(e) => setOptionsPerQuestion(parseInt(e.target.value, 10) || 4)}
                   required
                   className={getError('optionsPerQuestion') ? 'border-red-500' : ''}
                 />
                 {getError('optionsPerQuestion') && <p className="text-sm text-red-600">{getError('optionsPerQuestion')}</p>}
              </div>

              {/* Zorluk Seviyesi */}
              <div className="space-y-2">
                 <Label htmlFor="difficulty">Zorluk Seviyesi</Label>
                 <Select name="difficulty" value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
                    <SelectTrigger id="difficulty" className={getError('difficulty') ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Zorluk seviyesi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Kolay</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="hard">Zor</SelectItem>
                    </SelectContent>
                  </Select>
                  {getError('difficulty') && <p className="text-sm text-red-600">{getError('difficulty')}</p>}
              </div>

              {/* Model */}
               <div className="space-y-2">
                 <Label htmlFor="model">Model</Label>
                 <Select name="model" value={model} onValueChange={setModel}>
                    <SelectTrigger id="model" className={getError('model') ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Model seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Eski değeri çalışanla değiştir ve metni güncelle */}
                      <SelectItem value="gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem> 
                      <SelectItem value="deepseek/deepseek-chat-v3-0324:free">DeepSeek Chat v3</SelectItem>
                      <SelectItem value="meta-llama/llama-4-scout:free">Llama 4 Scout</SelectItem>
                      <SelectItem value="qwen/qwen3-235b-a22b:free">Qwen 3</SelectItem>
                      <SelectItem value="deepseek-ai/deepseek-coder-33b-instruct">DeepSeek Coder</SelectItem>
                      {/* <SelectItem value="google/gemini-pro">Gemini Pro</SelectItem>  Eski model kaldırıldı */}
                      <SelectItem value="gemini-2.5-pro-exp-03-25">Gemini 2.5 Pro Exp</SelectItem> {/* Yeni model eklendi */}
                      <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct">Groq Llama 4 Scout</SelectItem> {/* Groq modeli eklendi */}
                    </SelectContent>
                  </Select>
                  {getError('model') && <p className="text-sm text-red-600">{getError('model')}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleGenerateClick}
                disabled={isGenerating || poolId === undefined}
              >
                {isGenerating ? "Üretiliyor..." : "Soru Üret"}
              </Button>
            </div>
          </div>
        ) : (
          // Onaylama adımı
          <div className="space-y-4">
             {/* ... (Onaylama adımı kodu aynı kalıyor) ... */}
             <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Soru {currentStep} / {totalSteps}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
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
                currentQuestion.approved ? "border-green-500" : "border-muted"
              )}>
                <CardContent className="pt-6 space-y-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                     <div dangerouslySetInnerHTML={{ __html: currentQuestion.questionText || '' }} />
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option) => (
                      <div
                        key={option.label}
                        className={cn(
                          "p-3 rounded-lg border",
                          option.label === currentQuestion.correctAnswer
                            ? "bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-700"
                            : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                        )}
                      >
                        <span className="font-medium mr-2">{option.label})</span>
                        <span dangerouslySetInnerHTML={{ __html: option.text || '' }} />
                      </div>
                    ))}
                  </div>
                  {currentQuestion.explanation && (
                    <div className="prose prose-sm max-w-none dark:prose-invert pt-4 border-t mt-4">
                      <h4>Açıklama</h4>
                      <div dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Zorluk:</span>
                      <span className="text-sm capitalize">{currentQuestion.difficulty}</span>
                    </div>
                    <Button
                      variant={currentQuestion.approved ? "destructive" : "secondary"}
                      onClick={() => toggleApproval(currentQuestion.id)}
                      size="sm"
                    >
                      {currentQuestion.approved ? "Onayı Kaldır" : "Onayla"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {currentStep > 0 && generatedQuestions.some(q => q.approved) && (
              <div className="flex justify-end pt-4 border-t mt-4">
                <Button onClick={saveApprovedQuestions}>
                  Onaylanan Soruları Kaydet ({generatedQuestions.filter(q => q.approved).length})
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
