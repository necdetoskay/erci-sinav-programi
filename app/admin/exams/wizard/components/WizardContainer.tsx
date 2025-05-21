"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StepIndicator } from "./StepIndicator";
import { NavigationButtons } from "./NavigationButtons";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { loadFormState, clearFormState } from "@/lib/auth-fetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// Sihirbaz veri modeli
export interface ExamWizardData {
  // Adım 1: Temel Bilgiler
  basicInfo: {
    title: string;
    description: string;
    durationMinutes: number;
    difficulty: string;
  };

  // Adım 2: Sorular
  questions: {
    id: number;
    text: string;
    options: Array<{
      id: number;
      text: string;
    }>;
    correctAnswer: string;
    position: number;
  }[];

  // Adım 3: Paylaşım
  sharing: {
    personnel: {
      id: string;
      name: string;
      email: string;
    }[];
    accessCode: string;
    isPublic: boolean;
  };

  // Adım 4: Zamanlama
  scheduling: {
    startDate: Date | null;
    startImmediately: boolean;
    sendEmails: boolean;
    emailSubject: string;
    emailBody: string;
  };
}

// Varsayılan sihirbaz verisi
const defaultWizardData: ExamWizardData = {
  basicInfo: {
    title: "",
    description: "",
    durationMinutes: 60,
    difficulty: "medium",
  },
  questions: [],
  sharing: {
    personnel: [],
    accessCode: "",
    isPublic: false,
  },
  scheduling: {
    startDate: null,
    startImmediately: false,
    sendEmails: true,
    emailSubject: "",
    emailBody: "",
  },
};

// LocalStorage anahtarı
const WIZARD_STORAGE_KEY = 'exam-wizard-data';

// Sihirbaz context tipi
interface WizardContextType {
  // Veri
  data: ExamWizardData;

  // Durum
  currentStep: number;
  isSubmitting: boolean;
  errors: Record<string, string[]>;
  showRestoredAlert: boolean;
  setShowRestoredAlert: (show: boolean) => void;

  // Metodlar
  setCurrentStep: (step: number) => void;
  updateBasicInfo: (data: Partial<ExamWizardData['basicInfo']>) => void;
  addQuestion: (question: ExamWizardData['questions'][0]) => void;
  removeQuestion: (questionId: number) => void;
  updateQuestion: (questionId: number, data: Partial<ExamWizardData['questions'][0]>) => void;
  reorderQuestions: (questions: ExamWizardData['questions']) => void;
  updateSharing: (data: Partial<ExamWizardData['sharing']>) => void;
  addPersonnel: (personnel: ExamWizardData['sharing']['personnel'][0]) => void;
  removePersonnel: (personnelId: string) => void;
  updateScheduling: (data: Partial<ExamWizardData['scheduling']>) => void;
  validateStep: (step: number) => boolean;
  submitExam: () => Promise<void>;
  resetWizard: () => void;
}

// Sihirbaz context'i oluştur
const WizardContext = createContext<WizardContextType | undefined>(undefined);

// Sihirbaz context hook'u
export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};

// Sihirbaz provider props
interface WizardProviderProps {
  children: ReactNode;
}

// Sihirbaz provider bileşeni
export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ExamWizardData>(defaultWizardData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [restoredSession, setRestoredSession] = useState(false);
  const [showRestoredAlert, setShowRestoredAlert] = useState(false);

  // LocalStorage ve oturum durumunu kontrol et
  useEffect(() => {
    // Oturum yenileme parametresini kontrol et
    const sessionRestored = searchParams.get('sessionRestored') === 'true';

    // Önce normal localStorage verilerini kontrol et
    const savedData = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } catch (error) {
        console.error("Failed to parse saved wizard data:", error);
      }
    }

    // Eğer oturum yenilendiyse, kaydedilmiş form verilerini kontrol et
    if (sessionRestored) {
      const savedFormState = loadFormState<ExamWizardData>("exam-wizard-data");
      if (savedFormState && savedFormState.formData) {
        setData(savedFormState.formData);
        setRestoredSession(true);
        setShowRestoredAlert(true);

        // Form verilerini normal localStorage'a taşı
        localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(savedFormState.formData));

        // Geçici form verilerini temizle
        clearFormState("exam-wizard-data");

        toast({
          title: "Form verileri geri yüklendi",
          description: "Oturum süreniz dolduğunda kaydedilen form verileriniz başarıyla geri yüklendi.",
        });
      }
    }
  }, [searchParams, toast]);

  // Verileri LocalStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Temel bilgileri güncelle
  const updateBasicInfo = (newData: Partial<ExamWizardData['basicInfo']>) => {
    setData((prevData) => ({
      ...prevData,
      basicInfo: {
        ...prevData.basicInfo,
        ...newData,
      },
    }));
  };

  // Soru ekle
  const addQuestion = (question: ExamWizardData['questions'][0]) => {
    setData((prevData) => ({
      ...prevData,
      questions: [...prevData.questions, question],
    }));
  };

  // Soru sil
  const removeQuestion = (questionId: number) => {
    setData((prevData) => ({
      ...prevData,
      questions: prevData.questions.filter((q) => q.id !== questionId),
    }));
  };

  // Soru güncelle
  const updateQuestion = (
    questionId: number,
    newData: Partial<ExamWizardData['questions'][0]>
  ) => {
    setData((prevData) => ({
      ...prevData,
      questions: prevData.questions.map((q) =>
        q.id === questionId ? { ...q, ...newData } : q
      ),
    }));
  };

  // Soruları yeniden sırala
  const reorderQuestions = (questions: ExamWizardData['questions']) => {
    setData((prevData) => ({
      ...prevData,
      questions,
    }));
  };

  // Paylaşım ayarlarını güncelle
  const updateSharing = (newData: Partial<ExamWizardData['sharing']>) => {
    setData((prevData) => ({
      ...prevData,
      sharing: {
        ...prevData.sharing,
        ...newData,
      },
    }));
  };

  // Personel ekle
  const addPersonnel = (personnel: ExamWizardData['sharing']['personnel'][0]) => {
    setData((prevData) => ({
      ...prevData,
      sharing: {
        ...prevData.sharing,
        personnel: [...prevData.sharing.personnel, personnel],
      },
    }));
  };

  // Personel sil
  const removePersonnel = (personnelId: string) => {
    setData((prevData) => ({
      ...prevData,
      sharing: {
        ...prevData.sharing,
        personnel: prevData.sharing.personnel.filter((p) => p.id !== personnelId),
      },
    }));
  };

  // Zamanlama ayarlarını güncelle
  const updateScheduling = (newData: Partial<ExamWizardData['scheduling']>) => {
    setData((prevData) => ({
      ...prevData,
      scheduling: {
        ...prevData.scheduling,
        ...newData,
      },
    }));
  };

  // Adım doğrulama
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string[]> = {};

    switch (step) {
      case 0: // Temel Bilgiler
        if (!data.basicInfo.title.trim()) {
          newErrors.title = ["Sınav adı zorunludur"];
        }
        break;
      case 1: // Sorular
        if (data.questions.length === 0) {
          newErrors.questions = ["En az bir soru eklemelisiniz"];
        }
        break;
      case 2: // Paylaşım
        // Paylaşım ayarları için doğrulama kuralları
        break;
      case 3: // Zamanlama
        // Zamanlama ayarları için doğrulama kuralları
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sınavı oluştur
  const submitExam = async (): Promise<void> => {
    try {
      setIsSubmitting(true);

      // Tüm adımları doğrula
      for (let i = 0; i < 4; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i);
          toast({
            title: "Hata",
            description: "Lütfen tüm gerekli alanları doldurun",
            variant: "destructive",
          });
          return;
        }
      }

      // 1. Sınav oluştur
      const examResponse = await fetch("/api/admin/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.basicInfo.title,
          description: data.basicInfo.description,
          duration_minutes: data.basicInfo.durationMinutes,
          access_code: data.sharing.accessCode,
          status: "draft", // Başlangıçta taslak olarak oluştur
        }),
      });

      if (!examResponse.ok) {
        const errorData = await examResponse.json();
        throw new Error(errorData.error || "Sınav oluşturulurken bir hata oluştu");
      }

      const examData = await examResponse.json();
      const examId = examData.id;

      // 2. Soruları ekle
      if (data.questions.length > 0) {
        const questionsResponse = await fetch(`/api/admin/exams/${examId}/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questions: data.questions.map((q, index) => ({
              question_text: q.text,
              options: q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt.text}`),
              correct_answer: q.correctAnswer,
              explanation: "",
              difficulty: data.basicInfo.difficulty,
              position: index + 1,
            })),
          }),
        });

        if (!questionsResponse.ok) {
          const errorData = await questionsResponse.json();
          throw new Error(errorData.error || "Sorular eklenirken bir hata oluştu");
        }
      }

      // 3. Sınav durumunu güncelle (eğer hemen başlatılacaksa)
      if (data.scheduling.startImmediately) {
        const statusResponse = await fetch(`/api/admin/exams/${examId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "published",
          }),
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.error || "Sınav durumu güncellenirken bir hata oluştu");
        }
      }

      // 4. E-posta gönder (gerekirse)
      if (data.scheduling.sendEmails && data.sharing.personnel.length > 0) {
        const emailResponse = await fetch("/api/admin/send-exam-invitations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            examId: examId,
            users: data.sharing.personnel,
            subject: data.scheduling.emailSubject || `${data.basicInfo.title} Sınavı Daveti`,
            body: data.scheduling.emailBody || `Sayın {AD_SOYAD},\n\n${data.basicInfo.title} sınavına katılmanız için davet edildiniz.\n\nSınav Kodu: {SINAV_KODU}\n\nSınava giriş yapmak için aşağıdaki linki kullanabilirsiniz:\n{SINAV_LINKI}\n\nSaygılarımızla,\nKent Konut A.Ş.`,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error("E-posta gönderme hatası:", errorData);
          // E-posta gönderme hatası sınav oluşturmayı etkilemeyecek
        }
      }

      toast({
        title: "Başarılı",
        description: "Sınav başarıyla oluşturuldu",
      });

      // Sınav detay sayfasına yönlendir
      window.location.href = `/admin/exams/${examId}`;

      // Sihirbazı sıfırla
      resetWizard();
    } catch (error) {
      console.error("Failed to submit exam:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Sınav oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sihirbazı sıfırla
  const resetWizard = () => {
    setData(defaultWizardData);
    setCurrentStep(0);
    setErrors({});
    localStorage.removeItem(WIZARD_STORAGE_KEY);
  };

  return (
    <WizardContext.Provider
      value={{
        data,
        currentStep,
        isSubmitting,
        errors,
        showRestoredAlert,
        setShowRestoredAlert,
        setCurrentStep,
        updateBasicInfo,
        addQuestion,
        removeQuestion,
        updateQuestion,
        reorderQuestions,
        updateSharing,
        addPersonnel,
        removePersonnel,
        updateScheduling,
        validateStep,
        submitExam,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};

// Sihirbaz kapsayıcı props
interface WizardContainerProps {
  children: ReactNode;
  steps: string[];
}

// Sihirbaz kapsayıcı bileşeni
export const WizardContainer: React.FC<WizardContainerProps> = ({
  children,
  steps,
}) => {
  const { currentStep } = useWizard();

  const { showRestoredAlert, setShowRestoredAlert } = useWizard();

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {showRestoredAlert && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertTitle>Form verileriniz geri yüklendi</AlertTitle>
            <AlertDescription className="flex flex-col space-y-2">
              <p>Oturum süreniz dolduğunda kaydedilen form verileriniz başarıyla geri yüklendi. Kaldığınız yerden devam edebilirsiniz.</p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowRestoredAlert(false)}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Bu mesajı kapat
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <StepIndicator steps={steps} currentStep={currentStep} />
        <div className="mt-8">{children}</div>
        <NavigationButtons steps={steps} />
      </CardContent>
    </Card>
  );
};
