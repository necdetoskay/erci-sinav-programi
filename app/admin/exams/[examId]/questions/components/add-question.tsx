"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddQuestionProps {
  examId: number;
  onQuestionAdded: () => void;
}

interface Question {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  position: number;
}

export function AddQuestion({ examId, onQuestionAdded }: AddQuestionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question>({
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "A",
    explanation: "",
    difficulty: "medium",
    position: 0,
  });

  const difficultyOptions = [
    { value: "easy", label: "Kolay" },
    { value: "medium", label: "Orta" },
    { value: "hard", label: "Zor" },
  ];

  const getOptionLetter = (index: number): string => {
    return String.fromCharCode(65 + index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasyon
    if (!question.question_text.trim()) {
      toast.error("Soru metni boş olamaz");
      return;
    }

    for (let i = 0; i < question.options.length; i++) {
      if (!question.options[i].trim()) {
        toast.error("Tüm şıklar doldurulmalıdır");
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: [question],
        }),
      });

      if (!response.ok) {
        throw new Error("Soru eklenirken bir hata oluştu");
      }

      toast.success("Soru başarıyla eklendi");
      onQuestionAdded();
      setOpen(false);
      // Formu sıfırla
      setQuestion({
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: "A",
        explanation: "",
        difficulty: "medium",
        position: 0,
      });
    } catch (error) {
      console.error("Soru eklenirken hata:", error);
      toast.error("Soru eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-48">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Soru Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Yeni Soru Ekle</DialogTitle>
          <DialogDescription>
            Sınava eklemek istediğiniz sorunun bilgilerini girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-text">Soru Metni</Label>
            <Textarea
              id="question-text"
              value={question.question_text}
              onChange={(e) =>
                setQuestion({ ...question, question_text: e.target.value })
              }
              placeholder="Soru metnini giriniz"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`option-${index}`}>
                  Şık {getOptionLetter(index)}
                </Label>
                <Input
                  id={`option-${index}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...question.options];
                    newOptions[index] = e.target.value;
                    setQuestion({ ...question, options: newOptions });
                  }}
                  placeholder={`${getOptionLetter(index)} şıkkını giriniz`}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correct-answer">Doğru Cevap</Label>
              <Select
                value={question.correct_answer}
                onValueChange={(value) =>
                  setQuestion({ ...question, correct_answer: value })
                }
              >
                <SelectTrigger id="correct-answer">
                  <SelectValue placeholder="Doğru cevabı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {question.options.map((_, index) => (
                    <SelectItem key={index} value={getOptionLetter(index)}>
                      {getOptionLetter(index)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Zorluk</Label>
              <Select
                value={question.difficulty}
                onValueChange={(value) =>
                  setQuestion({ ...question, difficulty: value })
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Zorluk seviyesi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Açıklama (İsteğe Bağlı)</Label>
            <Textarea
              id="explanation"
              value={question.explanation}
              onChange={(e) =>
                setQuestion({ ...question, explanation: e.target.value })
              }
              placeholder="Cevabın neden doğru olduğunu açıklayın (isteğe bağlı)"
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Ekleniyor..." : "Soru Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 