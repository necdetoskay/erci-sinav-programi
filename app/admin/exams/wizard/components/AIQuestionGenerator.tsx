"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Check, Loader2, Sparkles, Server, AlertCircle } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { AIModel, AIGeneratedQuestion, DifficultyLevel } from "./types";

interface AIQuestionGeneratorProps {
  data: any;
  questionsCount: number;
  onQuestionsGenerated: (questions: AIGeneratedQuestion[]) => void;
}

export const AIQuestionGenerator: React.FC<AIQuestionGeneratorProps> = ({
  data,
  questionsCount,
  onQuestionsGenerated,
}) => {
  const { toast } = useToast();
  
  // State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAiQuestions, setIsGeneratingAiQuestions] = useState(false);
  const [aiModels, setAiModels] = useState<AIModel[]>([
    { 
      id: "anthropic/claude-3-sonnet:beta", 
      name: "Claude 3 Sonnet", 
      provider: "Anthropic", 
      description: "Yüksek kaliteli, doğru ve detaylı sorular oluşturur.",
      useCase: "Karmaşık konularda detaylı sorular oluşturmak için idealdir.",
      isAvailable: false 
    },
    { 
      id: "meta-llama/llama-4-maverick:free", 
      name: "Llama 4 Maverick", 
      provider: "Meta", 
      description: "Hızlı ve verimli soru üretimi sağlar.",
      useCase: "Çok sayıda soru hızlıca oluşturmak için uygundur.",
      isAvailable: false 
    },
    { 
      id: "google/gemini-2.0-flash-exp:free", 
      name: "Gemini 2.0 Flash", 
      provider: "Google", 
      description: "Dengeli ve çeşitli sorular oluşturur.",
      useCase: "Genel amaçlı soru oluşturma için iyi bir seçimdir.",
      isAvailable: false 
    },
    { 
      id: "mistralai/mistral-large:latest", 
      name: "Mistral Large", 
      provider: "Mistral AI", 
      description: "Teknik konularda güçlü performans gösterir.",
      useCase: "Teknik ve bilimsel sorular için önerilir.",
      isAvailable: false 
    }
  ]);
  const [selectedAiModel, setSelectedAiModel] = useState<string>("anthropic/claude-3-sonnet:beta");
  const [aiDifficulty, setAiDifficulty] = useState<DifficultyLevel>("medium");
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);
  const [isTestingAiConnection, setIsTestingAiConnection] = useState(false);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<"untested" | "success" | "error">("untested");
  const [aiConnectionError, setAiConnectionError] = useState<string>("");
  const [saveToQuestionPool, setSaveToQuestionPool] = useState(true);
  const [selectedModelInfo, setSelectedModelInfo] = useState<AIModel | null>(null);
  
  // AI sekmesi açıldığında bağlantıyı test et
  useEffect(() => {
    if (aiConnectionStatus === "untested") {
      testAiConnection();
    }
  }, [aiConnectionStatus]);
  
  // Seçili model değiştiğinde bilgileri güncelle
  useEffect(() => {
    const model = aiModels.find(m => m.id === selectedAiModel);
    setSelectedModelInfo(model || null);
  }, [selectedAiModel, aiModels]);
  
  // AI bağlantısını test et
  const testAiConnection = async () => {
    try {
      setIsTestingAiConnection(true);
      setAiConnectionStatus("untested");
      setAiConnectionError("");
      
      const response = await authFetch("/api/ai/test-connection", {
        method: "POST",
        formState: data,
        formStateKey: "exam-wizard-data"
      });
      
      if (response.success) {
        setAiConnectionStatus("success");
        
        // Mevcut modellerin durumunu güncelle
        const updatedModels = aiModels.map(model => ({
          ...model,
          isAvailable: response.availableModels?.includes(model.id) || false
        }));
        
        setAiModels(updatedModels);
        
        // Eğer seçili model kullanılamıyorsa, kullanılabilir bir model seç
        const currentModelAvailable = updatedModels.find(m => m.id === selectedAiModel)?.isAvailable;
        if (!currentModelAvailable) {
          const firstAvailableModel = updatedModels.find(m => m.isAvailable);
          if (firstAvailableModel) {
            setSelectedAiModel(firstAvailableModel.id);
          }
        }
      } else {
        setAiConnectionStatus("error");
        setAiConnectionError(response.error || "Yapay zeka bağlantısı kurulamadı.");
      }
    } catch (error) {
      console.error("AI bağlantı testi hatası:", error);
      setAiConnectionStatus("error");
      setAiConnectionError(error instanceof Error ? error.message : "Yapay zeka bağlantısı test edilirken bir hata oluştu");
    } finally {
      setIsTestingAiConnection(false);
    }
  };
  
  // Soru oluşturma işlemi
  const generateQuestions = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen bir konu veya açıklama girin",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingAiQuestions(true);
      toast({
        title: "Yapay Zeka Çalışıyor",
        description: "Sorular oluşturuluyor, lütfen bekleyin...",
      });
      
      // API isteği yapılacak
      // Gerçek uygulamada burada API çağrısı yapılır
      // Şimdilik örnek veri ile devam ediyoruz
      setTimeout(() => {
        // Örnek sorular
        const generatedQuestionsData = [
          {
            id: Date.now() + 1,
            text: "İnsan kaynakları yönetiminin temel amacı nedir?",
            options: [
              { id: Date.now() + 101, text: "Sadece personel alımı yapmak" },
              { id: Date.now() + 102, text: "Organizasyonun hedeflerine ulaşması için insan kaynağını etkin kullanmak" },
              { id: Date.now() + 103, text: "Çalışanların maaşlarını ödemek" },
              { id: Date.now() + 104, text: "Sadece personel çıkarma işlemlerini yönetmek" }
            ],
            correctAnswer: "B",
            explanation: "İnsan kaynakları yönetiminin temel amacı, organizasyonun hedeflerine ulaşması için insan kaynağını en etkin şekilde kullanmaktır. Bu, işe alım, eğitim, performans değerlendirme ve çalışan ilişkileri gibi birçok alanı kapsar.",
            position: questionsCount + 1,
            approved: false
          },
          {
            id: Date.now() + 2,
            text: "Aşağıdakilerden hangisi insan kaynakları yönetiminin fonksiyonlarından biri değildir?",
            options: [
              { id: Date.now() + 201, text: "İşe alım ve yerleştirme" },
              { id: Date.now() + 202, text: "Performans değerlendirme" },
              { id: Date.now() + 203, text: "Ürün fiyatlandırma stratejileri" },
              { id: Date.now() + 204, text: "Eğitim ve geliştirme" }
            ],
            correctAnswer: "C",
            explanation: "Ürün fiyatlandırma stratejileri, pazarlama ve finans departmanlarının sorumluluğundadır, insan kaynakları yönetiminin bir fonksiyonu değildir.",
            position: questionsCount + 2,
            approved: false
          },
          {
            id: Date.now() + 3,
            text: "İşe alım sürecinde kullanılan 'yapılandırılmış mülakat' nedir?",
            options: [
              { id: Date.now() + 301, text: "Adayın özgeçmişinin detaylı incelenmesi" },
              { id: Date.now() + 302, text: "Tüm adaylara aynı soruların sorulduğu standart bir mülakat" },
              { id: Date.now() + 303, text: "Adayın iş yerini ziyaret etmesi" },
              { id: Date.now() + 304, text: "Adayın referanslarının kontrol edilmesi" }
            ],
            correctAnswer: "B",
            explanation: "Yapılandırılmış mülakat, tüm adaylara aynı soruların sorulduğu, böylece adayların daha objektif değerlendirilmesini sağlayan standart bir mülakat türüdür.",
            position: questionsCount + 3,
            approved: false
          }
        ];
        
        onQuestionsGenerated(generatedQuestionsData);
        setIsGeneratingAiQuestions(false);
        
        toast({
          title: "Başarılı",
          description: `${generatedQuestionsData.length} soru başarıyla oluşturuldu. Lütfen soruları inceleyin ve onaylayın.`,
        });
      }, 2000);
    } catch (error) {
      console.error("Soru oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "Sorular oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
      setIsGeneratingAiQuestions(false);
    }
  };
  
  // Bağlantı durumuna göre içerik göster
  if (aiConnectionStatus === "untested") {
    return (
      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <Server className="h-4 w-4" />
        <AlertTitle>Yapay Zeka Bağlantısı Test Ediliyor</AlertTitle>
        <AlertDescription>
          Yapay zeka bağlantısı test ediliyor, lütfen bekleyin...
        </AlertDescription>
      </Alert>
    );
  }
  
  if (aiConnectionStatus === "error") {
    return (
      <Alert className="bg-destructive/10 text-destructive border-destructive/20">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Yapay Zeka Bağlantı Hatası</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{aiConnectionError || "Yapay zeka bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin."}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testAiConnection}
            disabled={isTestingAiConnection}
          >
            {isTestingAiConnection ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Yeniden Deneniyor...
              </>
            ) : (
              <>Yeniden Dene</>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <Alert className="bg-green-50 text-green-800 border-green-200">
        <Check className="h-4 w-4" />
        <AlertTitle>Yapay Zeka Bağlantısı Başarılı</AlertTitle>
        <AlertDescription>
          Yapay zeka bağlantısı başarıyla kuruldu. Soru oluşturmaya başlayabilirsiniz.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ai-model">Yapay Zeka Modeli</Label>
          <Select
            value={selectedAiModel}
            onValueChange={setSelectedAiModel}
          >
            <SelectTrigger id="ai-model">
              <SelectValue placeholder="Model seçin" />
            </SelectTrigger>
            <SelectContent>
              {aiModels.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  disabled={!model.isAvailable}
                >
                  {model.name} ({model.provider})
                  {!model.isAvailable && " - Kullanılamıyor"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedModelInfo && (
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p><strong>Açıklama:</strong> {selectedModelInfo.description}</p>
              <p><strong>Kullanım Alanı:</strong> {selectedModelInfo.useCase}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ai-difficulty">Zorluk Seviyesi</Label>
          <Select
            value={aiDifficulty}
            onValueChange={(value) => setAiDifficulty(value as DifficultyLevel)}
          >
            <SelectTrigger id="ai-difficulty">
              <SelectValue placeholder="Zorluk seviyesi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Kolay</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="hard">Zor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ai-question-count">Soru Sayısı</Label>
        <Select
          value={aiQuestionCount.toString()}
          onValueChange={(value) => setAiQuestionCount(parseInt(value))}
        >
          <SelectTrigger id="ai-question-count">
            <SelectValue placeholder="Soru sayısı seçin" />
          </SelectTrigger>
          <SelectContent>
            {[3, 5, 10, 15, 20].map((count) => (
              <SelectItem key={count} value={count.toString()}>
                {count} soru
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ai-prompt">Konu veya Açıklama</Label>
        <Textarea
          id="ai-prompt"
          placeholder="Yapay zeka ile oluşturulacak sorular için konu veya açıklama girin. Örnek: 'İnsan kaynakları yönetimi temel kavramları hakkında çoktan seçmeli sorular oluştur.'"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          Yapay zeka, girdiğiniz konu veya açıklamaya göre sorular oluşturacaktır. Ne kadar detaylı açıklama yaparsanız, o kadar iyi sonuçlar alırsınız.
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="save-to-pool" 
          checked={saveToQuestionPool} 
          onCheckedChange={(checked) => setSaveToQuestionPool(checked === true)}
        />
        <Label htmlFor="save-to-pool" className="text-sm font-normal">
          Onaylanan soruları soru havuzuna da kaydet
        </Label>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={generateQuestions}
          disabled={!aiPrompt.trim() || isGeneratingAiQuestions}
        >
          {isGeneratingAiQuestions ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sorular Oluşturuluyor...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Yapay Zeka ile Soru Oluştur
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
