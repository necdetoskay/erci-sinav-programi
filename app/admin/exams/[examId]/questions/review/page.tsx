'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Question {
  id?: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  position?: number;
}

interface ExamData {
  id: number;
  title: string;
}

export default function ReviewQuestionsPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const examId = params.examId;
  
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // API endpoint oluşturulduğunda bu kısım düzenlenecek
        const examResponse = await fetch(`/api/admin/exams/${examId}`);
        const questionsResponse = await fetch(`/api/admin/exams/${examId}/generated-questions`);
        
        if (!examResponse.ok || !questionsResponse.ok) {
          throw new Error('Veriler yüklenirken bir hata oluştu');
        }
        
        const examData = await examResponse.json();
        const questionsData = await questionsResponse.json();
        
        setExam(examData);
        setQuestions(questionsData.questions || []);
        
        // Varsayılan olarak tüm soruları seç
        if (questionsData.questions && questionsData.questions.length > 0) {
          setSelectedQuestions(questionsData.questions.map((_: any, index: number) => index));
        }
        
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        toast.error('Sorular yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    }

    // Örnek veri
    setExam({ id: parseInt(examId), title: 'Örnek Sınav' });
    
    const sampleQuestions: Question[] = [
      {
        question_text: 'Türkiye\'nin başkenti hangi şehirdir?',
        options: [
          'A) İstanbul',
          'B) Ankara',
          'C) İzmir',
          'D) Bursa'
        ],
        correct_answer: 'B',
        explanation: 'Türkiye Cumhuriyeti\'nin başkenti 13 Ekim 1923\'ten beri Ankara\'dır.'
      },
      {
        question_text: 'Aşağıdakilerden hangisi bir programlama dili değildir?',
        options: [
          'A) JavaScript',
          'B) Python',
          'C) HTML',
          'D) Java'
        ],
        correct_answer: 'C',
        explanation: 'HTML bir işaretleme dilidir, programlama dili değildir.'
      }
    ];
    
    setQuestions(sampleQuestions);
    setSelectedQuestions([0, 1]); // Tüm soruları seç
    setIsLoading(false);
    
    // fetchData();
  }, [examId]);

  const handleToggleQuestion = (index: number) => {
    setSelectedQuestions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleEditQuestion = (question: Question, index: number) => {
    setEditingQuestion({...question});
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editingQuestion || editingIndex === null) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[editingIndex] = editingQuestion;
    setQuestions(updatedQuestions);
    setIsEditing(false);
    setEditingQuestion(null);
    setEditingIndex(null);
    
    toast.success('Soru güncellendi');
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    if (!editingQuestion) return;
    
    const updatedOptions = [...editingQuestion.options];
    updatedOptions[optionIndex] = value;
    
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions
    });
  };

  const handleCorrectAnswerChange = (correctAnswer: string) => {
    if (!editingQuestion) return;
    
    setEditingQuestion({
      ...editingQuestion,
      correct_answer: correctAnswer
    });
  };

  const handleCompleteExam = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Lütfen en az bir soru seçin');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Seçilen soruları al
      const finalQuestions = selectedQuestions.map(index => ({
        ...questions[index],
        position: index + 1  // Soru sırasını belirle
      }));
      
      // API endpoint oluşturulduğunda bu kısım düzenlenecek
      const response = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: finalQuestions
        }),
      });
      
      if (!response.ok) {
        throw new Error('Sorular kaydedilirken bir hata oluştu');
      }
      
      toast.success('Sınav başarıyla tamamlandı');
      router.push(`/admin/exams/${examId}`);
    } catch (error) {
      console.error('Sınav tamamlanırken hata:', error);
      toast.error('Sınav tamamlanırken bir hata meydana geldi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMoreQuestions = () => {
    router.push(`/admin/exams/${examId}/questions`);
  };

  const handleCancel = () => {
    router.push('/admin/exams');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Soruları Onayla</h1>
        <p className="text-muted-foreground mt-2">
          Sınav: {exam?.title}
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={index} className={cn(
            "border",
            selectedQuestions.includes(index) ? "border-primary" : "border-muted"
          )}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-start space-x-4">
                <Checkbox 
                  id={`question-${index}`}
                  checked={selectedQuestions.includes(index)}
                  onCheckedChange={() => handleToggleQuestion(index)}
                  className="mt-1"
                />
                <div>
                  <CardTitle className="text-lg">Soru {index + 1}</CardTitle>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEditQuestion(question, index)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            </CardHeader>
            <CardContent className="px-10">
              <div className="space-y-4">
                <p className="font-medium">{question.question_text}</p>
                
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={cn(
                        "flex items-center p-2 rounded-md",
                        option.startsWith(question.correct_answer) ? "bg-green-50 border border-green-200" : ""
                      )}
                    >
                      <div className="flex-1">{option}</div>
                      {option.startsWith(question.correct_answer) && (
                        <div className="text-green-600 font-medium">✓</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium">Açıklama:</h4>
                  <p className="text-muted-foreground">{question.explanation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              onClick={handleAddMoreQuestions}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Başka Sorular Ekle
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            İptal
          </Button>
          <Button 
            onClick={handleCompleteExam}
            disabled={isSubmitting || selectedQuestions.length === 0}
          >
            {isSubmitting ? 'Tamamlanıyor...' : 'Sınavı Tamamla'}
          </Button>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Soruyu Düzenle</DialogTitle>
            <DialogDescription>
              Soru metnini, seçenekleri, doğru cevabı ve açıklamayı düzenleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          
          {editingQuestion && (
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">Soru Metni</Label>
                <Textarea
                  id="question-text"
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="space-y-4">
                <Label>Seçenekler</Label>
                {editingQuestion.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <div className="w-8 shrink-0">
                      {option.charAt(0)}:
                    </div>
                    <Input
                      value={option.substring(3)} // "A) " kısmını çıkar
                      onChange={(e) => handleOptionChange(optIndex, `${option.charAt(0)}) ${e.target.value}`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCorrectAnswerChange(option.charAt(0))}
                      className={cn(
                        "w-20",
                        editingQuestion.correct_answer === option.charAt(0) ? "bg-green-100" : ""
                      )}
                    >
                      {editingQuestion.correct_answer === option.charAt(0) ? "Doğru ✓" : "Doğru Yap"}
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="explanation">Açıklama</Label>
                <Textarea
                  id="explanation"
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveEdit}>
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 