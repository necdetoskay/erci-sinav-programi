"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { QuestionSelector } from "./QuestionSelector";
import { QuestionPool, PoolQuestion, AddQuestionFunction } from "./types";

interface QuestionPoolTabProps {
  data: any;
  addQuestion: AddQuestionFunction;
  onSuccess: () => void;
}

export const QuestionPoolTab: React.FC<QuestionPoolTabProps> = ({
  data,
  addQuestion,
  onSuccess,
}) => {
  const { toast } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<QuestionPool | null>(null);
  const [poolQuestions, setPoolQuestions] = useState<PoolQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingQuestions, setIsAddingQuestions] = useState(false);
  
  // Soru havuzlarını yükle
  useEffect(() => {
    const fetchQuestionPools = async () => {
      try {
        setIsLoading(true);

        // authFetch kullanarak kimlik doğrulama hatalarını yönet
        const poolsData = await authFetch("/api/question-pools", {
          formState: data, // Mevcut sihirbaz verilerini kaydet
          formStateKey: "exam-wizard-data" // localStorage anahtarı
        });

        setQuestionPools(poolsData);
      } catch (error) {
        // JWT_EXPIRED hatası dışındaki hataları göster
        if (error instanceof Error && error.message !== "JWT_EXPIRED") {
          console.error("Soru havuzları yüklenirken hata:", error);
          toast({
            title: "Hata",
            description: "Soru havuzları yüklenirken bir hata oluştu",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionPools();
  }, [toast, data]);
  
  // Soru havuzu seçildiğinde soruları yükle
  const handlePoolSelect = async (poolId: number) => {
    try {
      setIsLoading(true);
      const pool = questionPools.find((p) => p.id === poolId);
      setSelectedPool(pool || null);

      // authFetch kullanarak kimlik doğrulama hatalarını yönet
      const questionData = await authFetch(`/api/question-pools/${poolId}/questions`, {
        formState: data, // Mevcut sihirbaz verilerini kaydet
        formStateKey: "exam-wizard-data" // localStorage anahtarı
      });

      setPoolQuestions(questionData);
      setSelectedQuestions([]);
    } catch (error) {
      // JWT_EXPIRED hatası dışındaki hataları göster
      if (error instanceof Error && error.message !== "JWT_EXPIRED") {
        console.error("Sorular yüklenirken hata:", error);
        toast({
          title: "Hata",
          description: "Sorular yüklenirken bir hata oluştu",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filtrelenmiş soruları getir
  const getFilteredQuestions = () => {
    return poolQuestions.filter((question) => {
      const matchesSearch = searchTerm
        ? question.questionText.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesDifficulty =
        difficultyFilter === "all" || question.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  };
  
  // Soru seçme/kaldırma
  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };
  
  // Tüm soruları seç/kaldır
  const handleSelectAllQuestions = () => {
    if (selectedQuestions.length === poolQuestions.length) {
      // Tüm seçimleri kaldır
      setSelectedQuestions([]);
    } else {
      // Tüm soruları seç
      setSelectedQuestions(poolQuestions.map(q => q.id));
    }
  };
  
  // Seçili soruları ekle
  const addSelectedQuestions = async () => {
    try {
      setIsAddingQuestions(true);

      // Seçili soruları al
      const questionsToAdd = poolQuestions.filter((q) =>
        selectedQuestions.includes(q.id)
      );

      // Sınava ekle
      for (const q of questionsToAdd) {
        const newQuestion = {
          id: Date.now() + q.id, // Benzersiz ID oluştur
          text: q.questionText,
          options: q.options.map((opt) => ({
            id: Date.now() + parseInt(opt.label.charCodeAt(0).toString()),
            text: opt.text,
          })),
          correctAnswer: q.correctAnswer,
          position: data.questions.length + 1,
        };
        addQuestion(newQuestion);
      }

      toast({
        title: "Başarılı",
        description: `${questionsToAdd.length} soru başarıyla eklendi`,
      });

      setSelectedQuestions([]);
      onSuccess();
    } catch (error) {
      console.error("Sorular eklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Sorular eklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsAddingQuestions(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Soru Havuzu</Label>
          <Select
            onValueChange={(value) =>
              handlePoolSelect(parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Soru havuzu seçin" />
            </SelectTrigger>
            <SelectContent>
              {questionPools.map((pool) => (
                <SelectItem
                  key={pool.id}
                  value={pool.id.toString()}
                >
                  {pool.title} ({pool.questionCount} soru)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Zorluk Seviyesi</Label>
          <Select
            value={difficultyFilter}
            onValueChange={setDifficultyFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Zorluk seviyesi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="easy">Kolay</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="hard">Zor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Soru Ara</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Soru metni ile ara..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <QuestionSelector
        questions={getFilteredQuestions()}
        selectedQuestions={selectedQuestions}
        onToggleSelection={toggleQuestionSelection}
        onSelectAll={handleSelectAllQuestions}
        isLoading={isLoading}
      />
      <div className="flex justify-end">
        <Button
          onClick={addSelectedQuestions}
          disabled={
            selectedQuestions.length === 0 || isAddingQuestions
          }
        >
          {isAddingQuestions ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ekleniyor...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Seçili Soruları Ekle ({selectedQuestions.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
