"use client";

import { useState } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";
import { AILoading } from "@/components/ui/ai-loading";

const formSchema = z.object({
  count: z.number().min(1).max(25),
  model: z.enum([
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "meta-llama/llama-4-scout:free",
    "qwen/qwen3-235b-a22b:free",
    "deepseek-ai/deepseek-coder-33b-instruct",
    "google/gemini-pro"
  ]),
  difficulty: z.enum(["easy", "medium", "hard"])
});

type FormData = z.infer<typeof formSchema>;

type GeneratedQuestion = {
  id: string;
  questionText: string;
  options: Array<{
    text: string;
    label: string;
  }>;
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  approved?: boolean;
};

interface GenerateQuestionsProps {
  poolId: number;
}

export function GenerateQuestions({ poolId }: GenerateQuestionsProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      count: 1,
      model: "google/gemini-2.0-flash-exp:free",
      difficulty: "medium"
    },
  });

  // Form ve state'leri sıfırlama fonksiyonu
  const resetForm = () => {
    form.reset({
      count: 1,
      model: "google/gemini-2.0-flash-exp:free",
      difficulty: "medium"
    });
    setCurrentStep(0);
    setGeneratedQuestions([]);
    setIsGenerating(false);
  };

  // Dialog kapanma fonksiyonu
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  async function onSubmit(data: FormData) {
    try {
      setIsGenerating(true);
      const response = await fetch(`/api/question-pools/${poolId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Sorular üretilirken bir hata oluştu");
      }

      const questions = await response.json();
      setGeneratedQuestions(questions.map((q: GeneratedQuestion) => ({ ...q, approved: false })));
      setCurrentStep(1);
    } catch (error) {
      toast.error("Sorular üretilirken bir hata oluştu");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveApprovedQuestions() {
    try {
      const approvedQuestions = generatedQuestions.filter(q => q.approved);
      
      if (approvedQuestions.length === 0) {
        toast.error("Lütfen en az bir soru onaylayın");
        return;
      }

      const response = await fetch(`/api/question-pools/${poolId}/questions/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions: approvedQuestions }),
      });

      if (!response.ok) {
        throw new Error("Sorular kaydedilirken bir hata oluştu");
      }

      toast.success("Onaylanan sorular başarıyla kaydedildi");
      setOpen(false);
      resetForm();
      router.refresh();
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("Sorular kaydedilirken bir hata oluştu");
    }
  }

  function toggleApproval(questionId: string) {
    setGeneratedQuestions(prev => {
      const newQuestions = prev.map(q =>
        q.id === questionId ? { ...q, approved: !q.approved } : q
      );
      
      // Eğer soru onaylandıysa ve başka sorular varsa, otomatik olarak sonraki soruya geç
      const currentQuestion = newQuestions.find(q => q.id === questionId);
      if (currentQuestion?.approved && currentStep < totalSteps) {
        setTimeout(() => setCurrentStep(currentStep + 1), 500);
      }
      
      return newQuestions;
    });
  }

  const currentQuestion = generatedQuestions[currentStep - 1];
  const totalSteps = generatedQuestions.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
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
          <Form form={form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soru Sayısı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={25}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zorluk Seviyesi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Zorluk seviyesi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Kolay</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="hard">Zor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Model seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash</SelectItem>
                          <SelectItem value="deepseek/deepseek-chat-v3-0324:free">DeepSeek Chat v3</SelectItem>
                          <SelectItem value="meta-llama/llama-4-scout:free">Llama 4 Scout</SelectItem>
                          <SelectItem value="qwen/qwen3-235b-a22b:free">Qwen 3</SelectItem>
                          <SelectItem value="deepseek-ai/deepseek-coder-33b-instruct">DeepSeek Coder</SelectItem>
                          <SelectItem value="google/gemini-pro">Gemini Pro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? "Üretiliyor..." : "Soru Üret"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
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
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }} />
                  </div>

                  <div className="space-y-2">
                    {currentQuestion.options.map((option) => (
                      <div
                        key={option.label}
                        className={cn(
                          "p-3 rounded-lg",
                          option.label === currentQuestion.correctAnswer
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-200"
                        )}
                      >
                        <span className="font-medium mr-2">{option.label})</span>
                        <span dangerouslySetInnerHTML={{ __html: option.text }} />
                      </div>
                    ))}
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <h4>Açıklama</h4>
                    <div dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Zorluk:</span>
                      <span className="text-sm">{currentQuestion.difficulty}</span>
                    </div>
                    <Button
                      variant={currentQuestion.approved ? "destructive" : "secondary"}
                      onClick={() => toggleApproval(currentQuestion.id)}
                    >
                      {currentQuestion.approved ? "Onayı Kaldır" : "Onayla"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === totalSteps && (
              <div className="flex justify-end pt-4">
                <Button onClick={saveApprovedQuestions}>
                  Onaylanan Soruları Kaydet
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 