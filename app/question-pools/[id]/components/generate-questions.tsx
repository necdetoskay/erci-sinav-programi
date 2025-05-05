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
  SelectGroup, // Import SelectGroup for separators
  SelectLabel, // Import SelectLabel for group labels
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

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Zod şeması (API'nin beklediği alanlara göre güncellenebilir)
const formSchema = z.object({
  promptText: z.string().min(10, { message: "Prompt en az 10 karakter olmalıdır." }),
  count: z.coerce.number().min(1, "En az 1 soru üretilmeli"),
  optionsPerQuestion: z.coerce.number().min(2).max(6),
  selectedModel: z.string().min(1, { message: "Lütfen bir model seçin." }), // Seçilen modelin ID'si veya adı
  difficulty: z.enum(["easy", "medium", "hard"]),
  // optionsPerQuestion: z.coerce.number().min(2).max(6) // This is part of apiSchema now
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

// Hardcoded model list (based on generate-from-text API route and user request)
const HARDCODED_MODELS = [
  { id: "gpt-4o", name: "OpenAI GPT-4o" },
  { id: "google/gemini-pro", name: "Google Gemini Pro" }, // Added based on API route
  { id: "google/gemini-2.0-flash-exp:free", name: "Google Gemini Flash 2.0 (Free)" }, // Added based on user request/API route
  { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek Chat V3 (Free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3" }, // Was already present
  { id: "mistralai/mistral-nemo:free", name: "Mistral Nemo" }, // Was already present
  // Add Groq models handled by the API routing
  { id: "llama3-8b-8192", name: "Groq Llama3 8B" }, // Uncommented and fixed
  { id: "mixtral-8x7b-32768", name: "Groq Mixtral 8x7B" }// Uncommented and fixed
  // Add OpenAI models

  // { id: "gpt-4-turbo", name: "OpenAI GPT-4 Turbo" }, // Example if you want to add more
  // { id: "deepseek-ai/deepseek-coder-33b-instruct", name: "DeepSeek Coder 33B Instruct" }, // Keep commented for now
  // { id: 'anthropic/claude-3-sonnet:beta', name: 'Claude 3 Sonnet' }, // Example from test page
];


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
  const [selectedModel, setSelectedModel] = useState(HARDCODED_MODELS[0]?.id || "google/gemini-pro"); // Default to first model name, fallback to gemini-pro
  const [optionsPerQuestion, setOptionsPerQuestion] = useState(4); // Seçenek sayısı için state
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  // AI Providers state removed


  useEffect(() => {
    setPromptText(poolTitle || "");
  }, [poolTitle]);

  // Fetch AI Providers useEffect removed


  const resetFormAndState = () => {
    setPromptText(poolTitle || "");
    setCount(1);
    setDifficulty("medium");
    setSelectedModel(HARDCODED_MODELS[0]?.id || "google/gemini-pro"); // Reset to default model name, fallback to gemini-pro
    setOptionsPerQuestion(4); // Seçenek sayısını da sıfırla
    setCurrentStep(0);
    setGeneratedQuestions([]);
    setIsGenerating(false);
    setFormErrors([]);
    // AI states reset in useEffect when open is false
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetFormAndState();
    }
  };

  // API'den gelen metni parse etme fonksiyonu (Revize Edilmiş)
  const parseGeneratedText = (text: string, count: number, difficulty: "easy" | "medium" | "hard"): GeneratedQuestion[] => {
    const questions: GeneratedQuestion[] = [];
    const lines = text.trim().split('\n');
    let currentQuestion: Partial<GeneratedQuestion> = {};
    let options: Array<{ text: string; label: string }> = [];
    let questionCounter = 0;
    let potentialQuestionLines: string[] = []; // Soru metni olabilecek satırları biriktir

    const optionRegex = /^\s*([A-F])\)\s*(.*)/; // Başındaki boşlukları tolere et
    const answerRegex = /^\s*\**Doğru Cevap:\**\s*([A-F])\**/i;
    const explanationRegex = /^\s*\**Açıklama:\**\s*(.*)/i;
    const numberedQuestionRegex = /^\s*\d+[\.\)]\s*(.*)/; // Hem nokta hem parantez

    const finalizeCurrentQuestion = () => {
      if (currentQuestion.questionText || potentialQuestionLines.length > 0) {
        // Birikmiş potansiyel satırları soru metni olarak ata (eğer soru metni zaten yoksa)
        if (!currentQuestion.questionText && potentialQuestionLines.length > 0) {
          currentQuestion.questionText = potentialQuestionLines.join('\n').trim();
        }
        // Eksik alanları doldur
        currentQuestion.options = options;
        currentQuestion.difficulty = difficulty;
        currentQuestion.id = uuidv4();
        // Sadece geçerli görünen soruları ekle (en azından soru metni ve seçenekleri olmalı)
        if (currentQuestion.questionText && currentQuestion.options && currentQuestion.options.length > 0) {
           questions.push(currentQuestion as GeneratedQuestion);
        } else {
            console.warn("Skipping incomplete question:", currentQuestion);
        }
        // Sıfırla
        currentQuestion = {};
        options = [];
        potentialQuestionLines = [];
      }
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Boş satırları atla

      const numberedMatch = trimmedLine.match(numberedQuestionRegex);
      const optionMatch = trimmedLine.match(optionRegex);
      const answerMatch = trimmedLine.match(answerRegex);
      const explanationMatch = trimmedLine.match(explanationRegex);

      // Yeni bir numaralı soru başlangıcı
      if (numberedMatch && questionCounter < count) {
        finalizeCurrentQuestion(); // Önceki soruyu bitir
        questionCounter++;
        currentQuestion = { questionText: numberedMatch[1].trim() };
      }
      // Seçenek
      else if (optionMatch) {
        // Eğer potansiyel soru satırları varsa ve henüz soru metni atanmamışsa, şimdi ata
        if (potentialQuestionLines.length > 0 && !currentQuestion.questionText) {
          currentQuestion.questionText = potentialQuestionLines.join('\n').trim();
          potentialQuestionLines = []; // Birikmişleri temizle
        }
        // Seçeneği ekle (eğer bir soru bağlamındaysak)
        if (currentQuestion.questionText || questions.length > 0 || options.length > 0) { // Daha esnek kontrol
             options.push({ label: optionMatch[1], text: optionMatch[2].trim() });
        } else {
             console.warn("Option found outside of a question context:", trimmedLine);
        }
      }
      // Doğru Cevap
      else if (answerMatch) {
        if (currentQuestion.questionText) { // Sadece bir soru içindeysek ata
          currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
        }
      }
      // Açıklama
      else if (explanationMatch) {
         if (currentQuestion.questionText) { // Sadece bir soru içindeysek ata
            currentQuestion.explanation = explanationMatch[1].trim().replace(/\**$/, '');
         }
      }
      // Diğer durumlar: Potansiyel soru metni veya devamı
      else {
        // Eğer henüz bir soru metni yoksa veya seçenekler başlamadıysa, potansiyel soru satırı olarak ekle
        if (!currentQuestion.questionText || options.length === 0) {
          potentialQuestionLines.push(trimmedLine);
        }
        // Eğer seçenekler başladıysa ve bu satır bir cevap/açıklama değilse, önceki seçeneğin devamı olabilir (şimdilik loglayalım)
        else if (options.length > 0 && !answerMatch && !explanationMatch) {
           console.warn("Line possibly belongs to previous option or unexpected format:", trimmedLine);
           // İsteğe bağlı: Son seçeneğe ekleme logiği eklenebilir
           // if (options.length > 0) {
           //   options[options.length - 1].text += '\n' + trimmedLine;
           // }
        }
      }
    }

    // Döngü bittikten sonra son soruyu tamamla
    finalizeCurrentQuestion();

    // Eğer istenen sayıda soru parse edilemediyse uyarı ver
    if (questions.length !== count) {
      console.warn(`Expected ${count} questions, but parsed ${questions.length}. API response format might be inconsistent.`);
      // toast.warning(`API ${count} soru üretmedi (${questions.length} üretildi). Yanıt formatı tutarsız olabilir.`); // Kullanıcıyı çok fazla uyarmamak için kaldırılabilir
    }

    return questions;
  };

  // Function to shuffle options within a single question
  const shuffleQuestionOptions = (question: GeneratedQuestion): GeneratedQuestion => {
      if (!question || !Array.isArray(question.options) || question.options.length === 0) {
          console.warn("Cannot shuffle options for invalid question:", question);
          return question; // Return original if invalid
      }

      // Find the text of the originally correct option
      const correctOption = question.options.find(opt => opt.label === question.correctAnswer);
      if (!correctOption) {
          console.warn("Could not find correct option text for question:", question);
          return question; // Return original if correct option not found
      }
      const correctOptionText = correctOption.text;

      // Shuffle the options array (create a copy to avoid modifying original temporarily)
      const shuffledOptions = shuffleArray([...question.options]);

      // Re-assign labels (A, B, C...) and find the new correct label
      let newCorrectAnswerLabel = '';
      const finalOptions = shuffledOptions.map((option, index) => {
          const newLabel = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
          if (option.text === correctOptionText) {
              newCorrectAnswerLabel = newLabel;
          }
          return { ...option, label: newLabel };
      });

      // Return the question with shuffled options and updated correct answer label
      return {
          ...question,
          options: finalOptions,
          correctAnswer: newCorrectAnswerLabel || question.correctAnswer // Fallback to original if something went wrong
      };
  };


  // Buton tıklamasıyla tetiklenecek fonksiyon
  const handleGenerateClick = async () => {
    setFormErrors([]);
    const formData = {
      promptText,
      count,
      difficulty, // Bu API'ye doğrudan gönderilmiyor, prompt'a eklenebilir
      selectedModel, // Seçilen modelin ID'si veya adı
      optionsPerQuestion // API'nin beklediği alan
    };

    // Zod şeması (API'nin beklediği alanlara göre güncellenebilir)
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
    // console.log("onSubmit triggered with data:", validatedData); // Removed log

    // Model/Provider lookup logic removed


    try {
      setIsGenerating(true);
      const apiUrl = "/api/generate-questions"; // Doğru API adresini kullan
      const generatedQuestionsArray: GeneratedQuestion[] = [];

      for (let i = 0; i < validatedData.count; i++) {
        // console.log(`Calling API for question ${i + 1}/${validatedData.count}`); // Removed log

        const apiPayload = {
          content: validatedData.promptText, // promptText -> content
          numberOfQuestions: 1, // Her çağrıda 1 soru iste
          optionsPerQuestion: validatedData.optionsPerQuestion,
          // Pass the selected model name directly
          model: validatedData.selectedModel, // Pass the model name string
          // apiKey removed, handled by backend based on model name
          // difficulty prompt'a eklenebilir veya API'de işlenebilir
        };
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        });
        // console.log(`API Response Status for question ${i + 1}:`, response.status); // Removed log

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          console.error(`API Error Response Body for question ${i + 1}:`, responseData);
          // Hata durumunda döngüyü kır ve hata mesajı göster
          throw new Error(responseData.error || `Soru ${i + 1} üretilirken bir hata oluştu (Status: ${response.status})`);
        }

        // console.log(`API raw response text for question ${i + 1}:`, responseData.questions); // Removed log

        // API'den gelen metni parse et (tek soru bekleniyor)
        const parsedQuestions = parseGeneratedText(responseData.questions, 1, validatedData.difficulty); // count 1 olarak parse et
        // console.log(`Parsed Question ${i + 1}:`, JSON.stringify(parsedQuestions, null, 2)); // Removed log

        if (parsedQuestions.length > 0) {
          // Başarılı bir şekilde parse edilen ilk soruyu ekle
          generatedQuestionsArray.push({ ...parsedQuestions[0], approved: false });
        } else {
          console.warn(`Could not parse question ${i + 1} from API response.`);
          // Parse edilemezse boş bir soru ekleyebilir veya atlayabiliriz. Şimdilik atlayalım.
        }
      }

      // Tüm sorular başarıyla üretildiyse state'i güncelle
      if (generatedQuestionsArray.length > 0) {
         // Shuffle options for each parsed question before setting state
         const questionsWithShuffledOptions = generatedQuestionsArray.map(shuffleQuestionOptions);
         setGeneratedQuestions(questionsWithShuffledOptions);
         setCurrentStep(1); // Onaylama adımına geç
         // console.log("Moved to step 1"); // Removed log
         toast.success(`${generatedQuestionsArray.length} adet soru üretildi. Lütfen inceleyin.`);
      } else {
         toast.error("Hiç soru üretilemedi. Lütfen prompt'u veya modeli kontrol edin.");
      }


    } catch (error) {
      console.error("Error in handleGenerateClick:", error);
      toast.error(error instanceof Error ? error.message : "Sorular üretilirken bilinmeyen bir hata oluştu");
      setGeneratedQuestions([]); // Hata durumunda listeyi temizle
      setCurrentStep(0); // Hata durumunda forma geri dön
    } finally {
      setIsGenerating(false);
      // console.log("handleGenerateClick finished"); // Removed log
    }
  };


  async function saveApprovedQuestions() {
     // ... (saveApprovedQuestions kodu aynı kalıyor, ancak API endpoint'i kontrol edilmeli) ...
     // console.log("saveApprovedQuestions triggered"); // Removed log
    try {
      const approvedQuestions = generatedQuestions.filter(q => q.approved);
      // console.log("Approved questions:", approvedQuestions); // Removed log
      if (approvedQuestions.length === 0) {
        toast.error("Lütfen en az bir soru onaylayın");
        return;
      }
      // Doğru API endpoint'ini kullandığımızdan emin olalım
      const batchApiUrl = `/api/question-pools/${poolId}/questions/batch`;
      // console.log(`Calling API: ${batchApiUrl}`); // Removed log
      const response = await fetch(batchApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // API'nin beklediği payload'ı kontrol et
        body: JSON.stringify({ questions: approvedQuestions }),
      });
      // console.log("Save Batch API Response Status:", response.status); // Removed log
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
                   max={50} // API limitine göre ayarlandı
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
                 <Select
                    name="model"
                    value={selectedModel} // Value is now the model name string
                    onValueChange={setSelectedModel} // Updates state with model name string
                    disabled={HARDCODED_MODELS.length === 0} // Disable if no models
                 >
                    <SelectTrigger id="model" className={getError('selectedModel') ? 'border-red-500' : ''}>
                      <SelectValue placeholder={HARDCODED_MODELS.length === 0 ? "Model Yok" : "Model Seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                       {/* Iterate over the hardcoded list */}
                       {HARDCODED_MODELS.map(model => (
                         <SelectItem key={model.id} value={model.id}> {/* Value is the model name string */}
                           {model.name} {/* Display user-friendly name */}
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                  {getError('selectedModel') && <p className="text-sm text-red-600">{getError('selectedModel')}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleGenerateClick}
                disabled={isGenerating || poolId === undefined || HARDCODED_MODELS.length === 0 || !selectedModel} // Disable if no models or no model selected
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
