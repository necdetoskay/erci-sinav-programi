"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { AILoading } from "@/components/ui/ai-loading";
import { z } from "zod";

import { Provider, Model, GeneratedQuestion, formSchema } from "./types";
import { parseGeneratedText, shuffleQuestionOptions } from "./utils";
import { QuestionForm } from "./QuestionForm";
import { QuestionReview } from "./QuestionReview";

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

  // API durumu için state
  const [apiStatus, setApiStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [apiStatusMessage, setApiStatusMessage] = useState('Yapay Zeka servisi kontrol ediliyor...');

  // Provider ve Model verileri için state'ler
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Form alanları için state'ler
  const [promptText, setPromptText] = useState(""); // Başlangıçta boş
  const [count, setCount] = useState(1);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [model, setModel] = useState("");
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  useEffect(() => {
    setPromptText(poolTitle || "");
  }, [poolTitle]); // Bu useEffect'i kaldırabiliriz veya başlangıç değerini boş bırakabiliriz. Şimdilik bırakıyorum, eğer bir sorun olursa kaldırırız.

  // API durumunu kontrol et
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setApiStatus('checking');
        setApiStatusMessage('Yapay Zeka servisi kontrol ediliyor...');

        // Seçilen modele göre API durumunu kontrol et
        const modelParam = model ? `?model=${encodeURIComponent(model)}` : '';
        const response = await fetch(`/api/llm-status${modelParam}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('LLM Status Error:', errorText);
          setApiStatus('error');
          setApiStatusMessage('Yapay Zeka servisi bağlantı hatası');
          return;
        }

        const text = await response.text();

        try {
          const data = JSON.parse(text);
          if (data.status === 'ready') {
            setApiStatus('ready');
            setApiStatusMessage(`${data.provider || 'Yapay Zeka'} servisi hazır`);
          } else {
            setApiStatus('error');
            setApiStatusMessage(data.message || 'Yapay Zeka servisi hazır değil');
          }
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError, 'Raw response:', text);
          setApiStatus('error');
          setApiStatusMessage('API yanıtı geçerli JSON formatında değil');
        }
      } catch (error) {
        console.error('LLM Status Check Error:', error);
        setApiStatus('error');
        setApiStatusMessage('Yapay Zeka durum kontrolü sırasında bir hata oluştu');
      }
    };

    if (open) {
      checkApiStatus();
    }
  }, [open, model]);

  // Provider ve Model verilerini yükle
  useEffect(() => {
    const fetchProvidersAndModels = async () => {
      try {
        setIsLoadingModels(true);

        // Provider'ları getir
        const providersResponse = await fetch('/api/ai-providers');
        if (!providersResponse.ok) {
          throw new Error('Provider verileri alınamadı');
        }
        const providersData = await providersResponse.json();
        setProviders(providersData);

        // Modelleri getir
        const modelsResponse = await fetch('/api/ai-models');
        if (!modelsResponse.ok) {
          throw new Error('Model verileri alınamadı');
        }
        const modelsData = await modelsResponse.json();

        // Sadece aktif modelleri filtrele ve sırala
        const activeModels = modelsData
          .filter((model: Model) => model.isEnabled)
          .sort((a: Model, b: Model) => a.orderIndex - b.orderIndex);

        setModels(activeModels);

        // Eğer aktif model varsa, sadece bir tane modeli seç
        if (activeModels.length > 0) {
          // İlk modeli seç ve diğerlerini seçme
          setModel(activeModels[0].id);
        }
      } catch (error) {
        console.error('Provider ve Model verileri yüklenirken hata:', error);
        toast.error('Model verileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchProvidersAndModels();
  }, []);

  const resetFormAndState = () => {
    setPromptText(""); // Resetlerken de boşalt
    setCount(1);
    setDifficulty("medium");
    // Eğer aktif model varsa, sadece ilk aktif modeli seç
    if (models.length > 0) {
      setModel(models[0].id);
    } else {
      setModel("");
    }
    // Seçenek sayısı sabit 4 olarak ayarlandı
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

  // Buton tıklamasıyla tetiklenecek fonksiyon
  const handleGenerateClick = async () => {
    setFormErrors([]);
    const formData = {
      promptText,
      count,
      difficulty, // Bu API'ye doğrudan gönderilmiyor, prompt'a eklenebilir
      model
      // optionsPerQuestion sabit 4 olarak ayarlandı
    };

    // Zod şeması - optionsPerQuestion sabit 4 olarak ayarlandı
    const apiSchema = formSchema;

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
        optionsPerQuestion: 4, // Sabit 4 şık - API'nin beklediği parametre
        model: validatedData.model, // Artık model ID'si gönderiliyor
        difficulty: validatedData.difficulty // Zorluk seviyesini API'ye gönder
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
           // Shuffle options for each parsed question before setting state
           const questionsWithShuffledOptions = parsedQuestions.map(shuffleQuestionOptions);
           setGeneratedQuestions(questionsWithShuffledOptions.map((q: GeneratedQuestion) => ({ ...q, approved: false })));
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
    console.log("saveApprovedQuestions triggered");
    try {
      const approvedQuestions = generatedQuestions.filter((q: GeneratedQuestion) => q.approved);
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
    setGeneratedQuestions(prev => {
      const newQuestions = prev.map((q: GeneratedQuestion) =>
        q.id === questionId ? { ...q, approved: !q.approved } : q
      );
      // Otomatik geçiş kodu kaldırıldı - önceki ve sonraki butonlarının çalışması için
      // const currentQuestion = newQuestions.find((q: GeneratedQuestion) => q.id === questionId);
      // const currentIndex = newQuestions.findIndex((q: GeneratedQuestion) => q.id === questionId);
      // if (currentQuestion?.approved && currentIndex < newQuestions.length - 1) {
      //   setTimeout(() => setCurrentStep(currentIndex + 1 + 1), 300);
      // }
      return newQuestions;
    });
  }

  const currentQuestion = generatedQuestions[currentStep - 1];
  const totalSteps = generatedQuestions.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          Metinden Soru Üret
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Metinden Soru Üret</DialogTitle>
          <DialogDescription>
            {currentStep === 0
              ? "Üretilecek soru sayısını ve kullanılacak modeli seçin."
              : "Üretilen soruları inceleyin ve onaylayın."}
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <AILoading className="my-8" />
        ) : currentStep === 0 ? (
          <QuestionForm
            promptText={promptText}
            setPromptText={setPromptText}
            count={count}
            setCount={setCount}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            model={model}
            setModel={setModel}
            providers={providers}
            models={models}
            isLoadingModels={isLoadingModels}
            formErrors={formErrors}
            handleGenerateClick={handleGenerateClick}
            isGenerating={isGenerating}
            apiStatus={apiStatus}
            apiStatusMessage={apiStatusMessage}
          />
        ) : (
          <QuestionReview
            currentQuestion={currentQuestion}
            currentStep={currentStep}
            totalSteps={totalSteps}
            toggleApproval={toggleApproval}
            saveApprovedQuestions={saveApprovedQuestions}
            setCurrentStep={setCurrentStep}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
