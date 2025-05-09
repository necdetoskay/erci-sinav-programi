"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionPool {
  id: number;
  title: string;
  subject: string;
  grade: string;
  difficulty: string;
  questionCount: number;
}

interface PoolQuestion {
  id: number;
  questionText: string;
  options: Array<{
    text: string;
    label: string;
  }>;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
}

interface AddFromPoolProps {
  examId: number;
  onQuestionsAdded: () => void;
}

export function AddFromPool({ examId, onQuestionsAdded }: AddFromPoolProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pools" | "questions">("pools");
  const [pools, setPools] = useState<QuestionPool[]>([]);
  const [questions, setQuestions] = useState<PoolQuestion[]>([]);
  const [selectedPool, setSelectedPool] = useState<QuestionPool | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  // Soru havuzlarını yükle
  useEffect(() => {
    async function fetchPools() {
      try {
        setLoading(true);
        const response = await fetch("/api/question-pools");
        if (!response.ok) {
          throw new Error("Soru havuzları yüklenemedi");
        }
        const data = await response.json();
        setPools(data);
      } catch (error) {
        console.error("Soru havuzları yüklenirken hata:", error);
        toast.error("Soru havuzları yüklenemedi");
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchPools();
    }
  }, [open]);

  // Seçilen havuzdaki soruları yükle
  async function loadPoolQuestions(poolId: number) {
    try {
      setLoading(true);
      const response = await fetch(`/api/question-pools/${poolId}/questions`);
      if (!response.ok) {
        throw new Error("Sorular yüklenemedi");
      }
      const data = await response.json();
      setQuestions(data);
      setStep("questions");
    } catch (error) {
      console.error("Sorular yüklenirken hata:", error);
      toast.error("Sorular yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  // Soru seçimini değiştir
  function toggleQuestion(questionId: number) {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }

  // Seçilen soruları sınava ekle
  async function addSelectedQuestions() {
    try {
      setLoading(true);
      const selectedQuestionData = questions.filter((q) =>
        selectedQuestions.includes(q.id)
      );

      const response = await fetch(`/api/admin/exams/${examId}/questions/add-from-pool`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: selectedQuestionData,
        }),
      });

      if (!response.ok) {
        throw new Error("Sorular eklenirken bir hata oluştu");
      }

      toast.success("Seçilen sorular başarıyla eklendi");
      onQuestionsAdded();
      setOpen(false);
      resetState();
    } catch (error) {
      console.error("Sorular eklenirken hata:", error);
      toast.error("Sorular eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  // Durumu sıfırla
  function resetState() {
    setStep("pools");
    setSelectedPool(null);
    setSelectedQuestions([]);
    setSearchTerm("");
    setDifficultyFilter("all");
  }

  // Filtrelenmiş soruları getir
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.questionText
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === "all" || question.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Soru Havuzundan Ekle
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Dışarı tıklamayı engelle
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "pools" ? "Soru Havuzu Seç" : "Soru Seç"}
          </DialogTitle>
          <DialogDescription>
            {step === "pools"
              ? "Sorularını kullanmak istediğiniz havuzu seçin"
              : "Sınava eklemek istediğiniz soruları seçin"}
          </DialogDescription>
        </DialogHeader>

        {step === "pools" ? (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Havuz Adı</TableHead>
                    <TableHead>Ders</TableHead>
                    <TableHead>Sınıf</TableHead>
                    <TableHead>Zorluk</TableHead>
                    <TableHead className="text-right">Soru Sayısı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((pool) => (
                    <TableRow
                      key={pool.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedPool(pool);
                        loadPoolQuestions(pool.id);
                      }}
                    >
                      <TableCell className="font-medium">{pool.title}</TableCell>
                      <TableCell>{pool.subject}</TableCell>
                      <TableCell>{pool.grade}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pool.difficulty}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {pool.questionCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Soru Ara</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Soru metni ile ara..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="difficulty">Zorluk Seviyesi</Label>
                <Select
                  value={difficultyFilter}
                  onValueChange={setDifficultyFilter}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Zorluk seviyesi seç" />
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

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredQuestions.length > 0 && selectedQuestions.length === filteredQuestions.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedQuestions(filteredQuestions.map(q => q.id));
                          } else {
                            setSelectedQuestions([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Soru</TableHead>
                    <TableHead>Zorluk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={() => toggleQuestion(question.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: question.questionText.substring(0, 200) + "...",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{question.difficulty}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setStep("pools")}>
                Geri
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedQuestions.length} soru seçildi
                </span>
                <Button
                  onClick={addSelectedQuestions}
                  disabled={selectedQuestions.length === 0 || loading}
                >
                  Seçilen Soruları Ekle
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}