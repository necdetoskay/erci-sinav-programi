'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Trash, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AddFromPool } from "./components/add-from-pool";
import { AddQuestion } from "./components/add-question";
import { DraggableQuestion } from "./components/draggable-question";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Breadcrumb } from '../../../../components/breadcrumb';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id?: number;
  question_text: string;
  options: Option[];
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  position: number;
}

interface Exam {
  id: number;
  title: string;
  status: string;
  questions: Question[];
}

async function fetchExamAndQuestions(examId: number, setExam: any, setQuestions: any, setLoading: any) {
  try {
    setLoading(true);
    
    // Önce sınavı getir
    const examResponse = await fetch(`/api/admin/exams/${examId}`);
    if (!examResponse.ok) {
      throw new Error('Sınav yüklenirken bir hata oluştu');
    }
    const examData = await examResponse.json();
    setExam(examData);
    
    // API'den gelen soruları uygun formata dönüştür
    const formattedQuestions = (examData.questions || []).map((q: any) => ({
      ...q,
      options: Array.isArray(q.options) 
        ? q.options.map((text: string, index: number) => ({
            id: `${q.id}-option-${index + 1}`,
            text: text
          }))
        : []
    }));
    
    setQuestions(formattedQuestions);
  } catch (error) {
    console.error('Veri yüklenirken hata:', error);
    toast.error('Sınav ve sorular yüklenemedi');
  } finally {
    setLoading(false);
  }
}

export default function ExamQuestionsPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const examId = parseInt(params.examId);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState('edit');
  
  const difficultyOptions = [
    { value: 'easy', label: 'Kolay' },
    { value: 'medium', label: 'Orta' },
    { value: 'hard', label: 'Zor' },
  ];

  // Yeni boş soru oluştur
  const createEmptyQuestion = useCallback((position: number): Question => ({
    question_text: '',
    options: [
      { id: `new-${position}-option-1`, text: '' },
      { id: `new-${position}-option-2`, text: '' },
      { id: `new-${position}-option-3`, text: '' },
      { id: `new-${position}-option-4`, text: '' },
    ],
    correct_answer: 'A',
    explanation: '',
    difficulty: 'medium',
    position,
  }), []);

  // Yeni soru ekle
  const addNewQuestion = useCallback(() => {
    const newPosition = questions.length + 1;
    setQuestions(prev => [...prev, createEmptyQuestion(newPosition)]);
  }, [questions.length, createEmptyQuestion]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchExamAndQuestions(examId, setExam, setQuestions, setLoading);
  }, [examId]);

  // Soruyu sil
  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('En az bir soru olmalıdır');
      return;
    }
    
    const newQuestions = questions.filter((_, i) => i !== index);
    // Pozisyonları güncelle
    const updatedQuestions = newQuestions.map((q, i) => ({
      ...q,
      position: i + 1,
    }));
    
    setQuestions(updatedQuestions);
  };

  // Soru metnini güncelle
  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question_text = text;
    setQuestions(newQuestions);
  };

  // Şık metnini güncelle
  const updateOptionText = (questionIndex: number, optionIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].text = text;
    setQuestions(newQuestions);
  };

  // Doğru cevabı güncelle
  const updateCorrectAnswer = (questionIndex: number, answer: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].correct_answer = answer;
    setQuestions(newQuestions);
  };

  // Açıklamayı güncelle
  const updateExplanation = (questionIndex: number, explanation: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].explanation = explanation;
    setQuestions(newQuestions);
  };

  // Zorluk seviyesini güncelle
  const updateDifficulty = (questionIndex: number, difficulty: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].difficulty = difficulty;
    setQuestions(newQuestions);
  };

  // Soruları kaydet
  const saveQuestions = async () => {
    // Validasyon
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.question_text.trim()) {
        toast.error(`Soru ${i+1}: Soru metni boş olamaz`);
        return;
      }
      
      // Şık validasyonu düzeltildi
      for (const option of q.options) {
        if (!option.text.trim()) {
          toast.error(`Soru ${i+1}: Tüm şıklar doldurulmalıdır`);
          return;
        }
      }
    }
    
    try {
      setSaving(true);
      
      // API'ye gönderilecek şekilde soruları formatla
      const formattedQuestions = questions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options.map(opt => opt.text), // Sadece text değerlerini gönder
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        position: q.position,
      }));
      
      const response = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: formattedQuestions }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sorular kaydedilirken bir hata oluştu');
      }
      
      toast.success('Sorular başarıyla kaydedildi');
      
      // Sınav listesi sayfasına dön
      router.push('/admin/exams');
    } catch (error) {
      console.error('Sorular kaydedilirken hata:', error);
      toast.error(error instanceof Error ? error.message : 'Sorular kaydedilirken bir hata meydana geldi');
    } finally {
      setSaving(false);
    }
  };

  // Önizleme için seçeneğin harf karşılığını döndür
  const getOptionLetter = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  // Sürükleme işlemi tamamlandığında
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex(
          (item) => (item.id?.toString() || `question-${items.indexOf(item)}`) === active.id
        );
        const newIndex = items.findIndex(
          (item) => (item.id?.toString() || `question-${items.indexOf(item)}`) === over.id
        );
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Pozisyonları güncelle
        return newItems.map((item, index) => ({
          ...item,
          position: index + 1,
        }));
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-1/4" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb 
        items={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Sınavlar', href: '/admin/exams' },
          { label: exam?.title || 'Sınav', href: `/admin/exams/${params.examId}` },
          { label: 'Sorular' }
        ]} 
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sınav Soruları</h1>
          <p className="text-muted-foreground">
            {exam?.title} - Toplam {questions.length} Soru
          </p>
        </div>
        <div className="flex gap-4">
          <AddQuestion 
            examId={examId} 
            onQuestionAdded={() => {
              fetchExamAndQuestions(examId, setExam, setQuestions, setLoading);
            }} 
          />
          <AddFromPool 
            examId={examId} 
            onQuestionsAdded={() => {
              fetchExamAndQuestions(examId, setExam, setQuestions, setLoading);
            }} 
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Soruları Düzenle</TabsTrigger>
          <TabsTrigger value="preview">Önizleme</TabsTrigger>
        </TabsList>
        
        {/* Düzenleme Görünümü */}
        <TabsContent value="edit">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Henüz soru eklenmemiş</p>
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q, i) => q.id?.toString() || `question-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {questions.map((question, index) => (
                    <DraggableQuestion
                      key={question.id?.toString() || `question-${index}`}
                      question={question}
                      index={index}
                      onRemove={() => removeQuestion(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>
        
        {/* Önizleme Görünümü */}
        <TabsContent value="preview">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{exam?.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="space-y-4">
                  <div className="font-medium">
                    Soru {qIndex + 1}: {question.question_text}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex} 
                        className={`p-3 rounded-md border ${
                          question.correct_answer === getOptionLetter(oIndex) 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                            : 'border-muted'
                        }`}
                      >
                        <span className="font-medium">{getOptionLetter(oIndex)}.</span> {option.text}
                      </div>
                    ))}
                  </div>
                  
                  {question.explanation && (
                    <div className="mt-2 text-sm p-3 bg-muted/50 rounded-md">
                      <span className="font-medium">Açıklama:</span> {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/exams')}
        >
          İptal
        </Button>
        
        <Button 
          onClick={saveQuestions}
          disabled={saving || questions.length === 0}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Kaydediliyor...' : 'Soruları Kaydet'}
        </Button>
      </div>
    </div>
  );
} 