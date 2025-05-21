"use client";

import React, { Suspense } from "react";
import { WizardProvider, useWizard, WizardContainer } from "./components/WizardContainer";
import { Step1BasicInfo } from "./components/Step1BasicInfo";
import { Step2Questions } from "./components/Step2Questions";
import { Step3Sharing } from "./components/Step3Sharing";
import { Step4Scheduling } from "./components/Step4Scheduling";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";

// Sihirbaz adımları
const STEPS = [
  "Temel Bilgiler",
  "Sorular",
  "Paylaşım",
  "Zamanlama",
];

// Sihirbaz içeriği
const WizardContent: React.FC = () => {
  const { currentStep } = useWizard();

  // Mevcut adıma göre içerik göster
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1BasicInfo />;
      case 1:
        return <Step2Questions />;
      case 2:
        return <Step3Sharing />;
      case 3:
        return <Step4Scheduling />;
      default:
        return <div>Bilinmeyen adım</div>;
    }
  };

  return (
    <div className="space-y-6">
      {renderStepContent()}
    </div>
  );
};

// Sihirbaz sayfası
const ExamWizardPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="container py-6">
      <Breadcrumb
        items={[
          { label: "Yönetim", href: "/admin" },
          { label: "Sınavlar", href: "/admin/exams" },
          { label: "Sınav Oluşturma Sihirbazı" },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sınav Oluşturma Sihirbazı</h1>
          <p className="text-muted-foreground">
            Adım adım sınav oluşturma rehberi
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/exams")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Sınav Listesine Dön
        </Button>
      </div>

      <WizardProvider>
        <WizardContainer steps={STEPS}>
          <WizardContent />
        </WizardContainer>
      </WizardProvider>
    </div>
  );
};

// Suspense ile sarmalanmış sayfa
export default function ExamWizardPageWithSuspense() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ExamWizardPage />
    </Suspense>
  );
}
