"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "./WizardContainer";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
}) => {
  const { setCurrentStep, validateStep } = useWizard();

  const handleStepClick = (index: number) => {
    // Sadece önceki adımlara geri dönüşe izin ver
    if (index < currentStep) {
      setCurrentStep(index);
    }
    // Mevcut adımdan bir sonraki adıma geçişe izin ver (doğrulama ile)
    else if (index === currentStep + 1) {
      if (validateStep(currentStep)) {
        setCurrentStep(index);
      }
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Adım göstergesi */}
          <div
            className={cn(
              "flex flex-col items-center cursor-pointer transition-all",
              index <= currentStep ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => handleStepClick(index)}
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                index < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                  ? "border-primary text-primary"
                  : "border-muted-foreground text-muted-foreground"
              )}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium",
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </div>

          {/* Bağlantı çizgisi (son adım hariç) */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2",
                index < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
