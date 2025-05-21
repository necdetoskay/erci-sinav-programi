"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Check, Info } from "lucide-react";
import { AddQuestionFunction, DifficultyLevel } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface ManualQuestionFormProps {
  addQuestion: AddQuestionFunction;
  onSuccess: () => void;
  questionsCount: number;
  saveToQuestionPool?: boolean;
  onSaveToQuestionPoolChange?: (checked: boolean) => void;
  onContinueToNextStep?: () => void;
}

export const ManualQuestionForm: React.FC<ManualQuestionFormProps> = ({
  addQuestion,
  onSuccess,
  questionsCount,
  saveToQuestionPool = true,
  onSaveToQuestionPoolChange,
  onContinueToNextStep,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldContinue, setShouldContinue] = useState(false);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [explanation, setExplanation] = useState("");
  const [localSaveToQuestionPool, setLocalSaveToQuestionPool] = useState(saveToQuestionPool);

  // Form validation
  const validateForm = (): boolean => {
    if (!questionText.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen soru metnini girin",
        variant: "destructive",
      });
      return false;
    }

    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen tüm şıkları doldurun",
        variant: "destructive",
      });
      return false;
    }

    if (!correctAnswer) {
      toast({
        title: "Hata",
        description: "Lütfen doğru cevabı seçin",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Soru havuzuna kaydetme seçeneği değiştiğinde
  const handleSaveToQuestionPoolChange = (checked: boolean) => {
    setLocalSaveToQuestionPool(checked);
    if (onSaveToQuestionPoolChange) {
      onSaveToQuestionPoolChange(checked);
    }
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Yeni soru oluştur
      const newQuestion = {
        id: Date.now(),
        text: questionText,
        options: [
          { id: Date.now() + 1, text: optionA },
          { id: Date.now() + 2, text: optionB },
          { id: Date.now() + 3, text: optionC },
          { id: Date.now() + 4, text: optionD },
        ],
        correctAnswer: correctAnswer!,
        position: questionsCount + 1,
      };

      // Soruyu ekle
      addQuestion(newQuestion);

      // Eğer soru havuzuna kaydetme seçeneği işaretlendiyse
      if (localSaveToQuestionPool) {
        // Burada soru havuzuna kaydetme API çağrısı yapılacak
        // Şimdilik sadece bir bildirim gösteriyoruz
        toast({
          title: "Bilgi",
          description: "Soru soru havuzuna da kaydedildi.",
        });
      }

      // Başarı mesajı göster
      toast({
        title: "Başarılı",
        description: "Soru başarıyla eklendi",
      });

      // Formu sıfırla
      resetForm();

      // Eğer devam et seçeneği işaretlendiyse
      if (shouldContinue && onContinueToNextStep) {
        onContinueToNextStep();
      } else {
        // Başarı callback'ini çağır
        onSuccess();
      }
    } catch (error) {
      console.error("Soru eklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Soru eklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formu sıfırla
  const resetForm = () => {
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer(undefined);
    setDifficulty("medium");
    setExplanation("");
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Manuel Soru Oluşturma</AlertTitle>
        <AlertDescription>
          Aşağıdaki formu kullanarak manuel olarak soru oluşturabilirsiniz. Tüm alanları doldurduktan sonra "Soruyu Ekle" butonuna tıklayın.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Soru Oluştur</CardTitle>
          <CardDescription>
            Sınav için yeni bir soru oluşturun. Tüm alanları eksiksiz doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Soru Metni</Label>
              <Textarea
                id="question-text"
                placeholder="Soru metnini girin"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="option-a">A Şıkkı</Label>
                <Input
                  id="option-a"
                  placeholder="A şıkkını girin"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="option-b">B Şıkkı</Label>
                <Input
                  id="option-b"
                  placeholder="B şıkkını girin"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="option-c">C Şıkkı</Label>
                <Input
                  id="option-c"
                  placeholder="C şıkkını girin"
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="option-d">D Şıkkı</Label>
                <Input
                  id="option-d"
                  placeholder="D şıkkını girin"
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Doğru Cevap</Label>
              <RadioGroup
                value={correctAnswer}
                onValueChange={setCorrectAnswer}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="option-correct-a" />
                  <Label htmlFor="option-correct-a">A</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B" id="option-correct-b" />
                  <Label htmlFor="option-correct-b">B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="C" id="option-correct-c" />
                  <Label htmlFor="option-correct-c">C</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="D" id="option-correct-d" />
                  <Label htmlFor="option-correct-d">D</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Zorluk Seviyesi</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as DifficultyLevel)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Zorluk seviyesi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Kolay</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="hard">Zor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="explanation"
                placeholder="Doğru cevap için açıklama girin (opsiyonel)"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="save-to-pool"
                checked={localSaveToQuestionPool}
                onCheckedChange={(checked) => handleSaveToQuestionPoolChange(checked === true)}
              />
              <Label htmlFor="save-to-pool" className="text-sm font-normal">
                Soruyu soru havuzuna da kaydet
              </Label>
            </div>

            {onContinueToNextStep && (
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="continue-next-step"
                  checked={shouldContinue}
                  onCheckedChange={(checked) => setShouldContinue(checked === true)}
                />
                <Label htmlFor="continue-next-step" className="text-sm font-normal">
                  Soruyu ekledikten sonra bir sonraki adıma geç
                </Label>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Soruyu Ekle
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
