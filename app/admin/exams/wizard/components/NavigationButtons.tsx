"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { useWizard } from "./WizardContainer";
import { useToast } from "@/components/ui/use-toast";

interface NavigationButtonsProps {
  steps: string[];
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  steps,
}) => {
  const { toast } = useToast();
  const {
    currentStep,
    setCurrentStep,
    validateStep,
    submitExam,
    isSubmitting,
  } = useWizard();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      } else {
        toast({
          title: "Hata",
          description: "Lütfen tüm gerekli alanları doldurun",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = () => {
    submitExam();
  };

  return (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={isFirstStep || isSubmitting}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Geri
      </Button>

      <div className="flex gap-2">
        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sınavı Oluştur
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
          >
            İleri
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
