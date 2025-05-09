"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Wand2 } from 'lucide-react';
import { AILoading } from '@/components/ui/ai-loading';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';

// Assuming types and utils are in a shared location or copied/adapted
import { Provider, Model, GeneratedQuestion, formSchema as textFormSchema } from '../generate-questions-from-text/types';
import { parseGeneratedText, shuffleQuestionOptions } from '../generate-questions-from-text/utils';
import { QuestionReview } from '../generate-questions-from-text/QuestionReview'; // Re-use review component
import { QuestionFormForFile } from './QuestionFormForFile'; // New form component for file + AI params

// Define a new schema for file-based generation if needed, or adapt existing one
// For now, we'll adapt the textFormSchema by removing promptText as it comes from the file
const fileFormSchema = textFormSchema.omit({ promptText: true });


interface GenerateQuestionsFromFileProps {
  poolId: number | undefined;
  poolTitle: string | undefined;
  onQuestionsGenerated: () => void;
}

export function GenerateQuestionsFromFile({ poolId, poolTitle, onQuestionsGenerated }: GenerateQuestionsFromFileProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Form, 1: Review
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const [apiStatus, setApiStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [apiStatusMessage, setApiStatusMessage] = useState('Yapay Zeka servisi kontrol ediliyor...');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [count, setCount] = useState(1);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [model, setModel] = useState("");
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  // API durumunu kontrol et (similar to GenerateQuestionsFromText)
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        setApiStatus('checking');
        setApiStatusMessage('Yapay Zeka servisi kontrol ediliyor...');
        const modelParam = model ? `?model=${encodeURIComponent(model)}` : '';
        const response = await fetch(`/api/llm-status${modelParam}`);
        if (!response.ok) {
          const errorText = await response.text();
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
          setApiStatus('error');
          setApiStatusMessage('API yanıtı geçerli JSON formatında değil');
        }
      } catch (error) {
        setApiStatus('error');
        setApiStatusMessage('Yapay Zeka durum kontrolü sırasında bir hata oluştu');
      }
    };
    if (open) checkApiStatus();
  }, [open, model]);

  // Provider ve Model verilerini yükle (similar to GenerateQuestionsFromText)
  useEffect(() => {
    const fetchProvidersAndModels = async () => {
      try {
        setIsLoadingModels(true);
        const providersResponse = await fetch('/api/ai-providers');
        if (!providersResponse.ok) throw new Error('Provider verileri alınamadı');
        const providersData = await providersResponse.json();
        setProviders(providersData);

        const modelsResponse = await fetch('/api/ai-models');
        if (!modelsResponse.ok) throw new Error('Model verileri alınamadı');
        const modelsData = await modelsResponse.json();
        const activeModels = modelsData
          .filter((m: Model) => m.isEnabled)
          .sort((a: Model, b: Model) => a.orderIndex - b.orderIndex);
        setModels(activeModels);
        if (activeModels.length > 0) setModel(activeModels[0].codeName);
      } catch (error) {
        toast.error('Model verileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchProvidersAndModels();
  }, []);

  const resetFormAndState = () => {
    setFiles([]);
    setCount(1);
    setDifficulty("medium");
    if (models.length > 0) setModel(models[0].codeName);
    else setModel("");
    setCurrentStep(0);
    setGeneratedQuestions([]);
    setIsGenerating(false);
    setFormErrors([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetFormAndState();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} dosya seçildi: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });


  const handleGenerateClick = async () => {
    setFormErrors([]);
    if (files.length === 0) {
      toast.error("Lütfen soru üretmek için bir dosya seçin.");
      return;
    }

    const formDataForValidation = { count, difficulty, model };
    const validationResult = fileFormSchema.safeParse(formDataForValidation);

    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues);
      toast.error("Lütfen formdaki hataları düzeltin.");
      return;
    }

    const validatedData = validationResult.data;

    setIsGenerating(true);
    const file = files[0];
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    if (poolId) apiFormData.append('poolId', poolId.toString());
    if (poolTitle) apiFormData.append('poolTitle', poolTitle);
    // Pass AI parameters to backend to be used by generateQuestions
    apiFormData.append('numberOfQuestions', validatedData.count.toString());
    apiFormData.append('difficulty', validatedData.difficulty);
    apiFormData.append('model', validatedData.model);


    try {
      const response = await fetch('/api/generate-questions-from-file', {
        method: 'POST',
        body: apiFormData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Sorular üretilirken bir hata oluştu (Status: ${response.status})`);
      }
      
      // The API now returns parsed questions directly in responseData.questions
      // if the parsing on backend is successful.
      // If API returns raw text, we parse it here. Assuming API returns structured questions.
      const parsedQs = responseData.questions as any[]; // Type assertion based on API contract

      if (!parsedQs || parsedQs.length === 0) {
        toast.error("API yanıtı işlenemedi veya boş döndü.");
        setGeneratedQuestions([]);
      } else {
        const questionsWithShuffledOptions = parsedQs.map((q: any) => ({
            id: q.id || Math.random().toString(36).substring(2, 15), // Ensure ID
            questionText: q.questionText,
            options: Array.isArray(q.options) ? q.options : Object.entries(q.options).map(([label, text]) => ({label, text})), // Ensure options format
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            approved: false,
        })).map(shuffleQuestionOptions);
        setGeneratedQuestions(questionsWithShuffledOptions);
      }
      setCurrentStep(1); // Move to review step
    } catch (error: any) {
      toast.error(error.message || "Sorular üretilirken bilinmeyen bir hata oluştu");
    } finally {
      setIsGenerating(false);
    }
  };

  async function saveApprovedQuestions() {
    try {
      const approvedQuestions = generatedQuestions.filter(q => q.approved);
      if (approvedQuestions.length === 0) {
        toast.error("Lütfen en az bir soru onaylayın");
        return;
      }
      const batchApiUrl = `/api/question-pools/${poolId}/questions/batch`;
      const response = await fetch(batchApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: approvedQuestions }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Sorular kaydedilirken bir hata oluştu: ${errorBody}`);
      }
      toast.success("Onaylanan sorular başarıyla kaydedildi");
      setOpen(false);
      resetFormAndState();
      onQuestionsGenerated();
    } catch (error: any) {
      toast.error(error.message || "Sorular kaydedilirken bilinmeyen bir hata oluştu");
    }
  }

  function toggleApproval(questionId: string) {
    setGeneratedQuestions(prev => {
      const newQuestions = prev.map(q =>
        q.id === questionId ? { ...q, approved: !q.approved } : q
      );
      // Logic for auto-advancing in review, if desired
      // const currentQuestion = newQuestions.find(q => q.id === questionId);
      // const currentIndex = newQuestions.findIndex(q => q.id === questionId);
      // if (currentQuestion?.approved && currentIndex < newQuestions.length - 1) {
      //   setTimeout(() => setCurrentStep(currentIndex + 1 + 1), 300); // This logic might need adjustment
      // }
      return newQuestions;
    });
  }
  
  const currentQuestionForReview = generatedQuestions[currentStep -1]; // For QuestionReview, step is 1-based index

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Dosyadan Soru Üret
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dosyadan Yapay Zeka ile Soru Üret</DialogTitle>
          <DialogDescription>
            {currentStep === 0
              ? "Dosya yükleyin, üretilecek soru sayısını ve modeli seçin."
              : "Üretilen soruları inceleyin ve onaylayın."}
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <AILoading className="my-8" />
        ) : currentStep === 0 ? (
          <QuestionFormForFile
            files={files}
            setFiles={setFiles} // Pass setFiles to allow clearing
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
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
          <QuestionReview // Re-use the existing review component
            currentQuestion={currentQuestionForReview} // generatedQuestions is 0-indexed, currentStep is 1-based for review UI
            currentStep={currentStep} // Pass the current question index for review UI
            totalSteps={generatedQuestions.length}
            toggleApproval={toggleApproval}
            saveApprovedQuestions={saveApprovedQuestions}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
