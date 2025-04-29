'use client';

import { useState, useEffect } from 'react';
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

interface Exam {
  id: number;
  title: string;
  status: string;
}

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

export default function QuestionsPage({ params }: { params: { examId: string } }) {
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

  useEffect(() => {
    // Sınav ve soruları yükle
    async function fetchExamAndQuestions() {
      try {
        setLoading(true);
        
        // Önce sınavı getir
        const examResponse = await fetch(`/api/admin/exams/${examId}`);
        if (!examResponse.ok) {
          throw new Error('Sınav yüklenirken bir hata oluştu');
        }
        const examData = await examResponse.json();
        setExam(examData);
        
        // Sonra sınava ait soruları getir
        setQuestions(examData.questions || []);
        
        // Soru yoksa, bir tane boş soru ekle
        if (examData.questions.length === 0) {
          addNewQuestion();
        }
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        toast.error('Sınav ve sorular yüklenemedi');
      } finally {
        setLoading(false);
      }
    }
    
    fetchExamAndQuestions();
  }, [examId]);

  // Yeni boş soru oluştur
  const createEmptyQuestion = (position: number): Question => ({
    question_text: '',
    options: [
      { id: '1', text: '' },
      { id: '2', text: '' },
      { id: '3', text: '' },
      { id: '4', text: '' },
    ],
    correct_answer: 'A',
    explanation: '',
    difficulty: 'medium',
    position,
  });

  // Yeni soru ekle
  const addNewQuestion = () => {
    const newPosition = questions.length + 1;
    setQuestions([...questions, createEmptyQuestion(newPosition)]);
  };

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

  // Soruyu yukarı taşı
  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    
    // Pozisyonları güncelle
    newQuestions[index - 1].position = index;
    newQuestions[index].position = index + 1;
    
    setQuestions(newQuestions);
  };

  // Soruyu aşağı taşı
  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    
    // Pozisyonları güncelle
    newQuestions[index].position = index + 1;
    newQuestions[index + 1].position = index + 2;
    
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
      
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          toast.error(`Soru ${i+1}: Tüm şıklar doldurulmalıdır`);
          return;
        }
      }
    }
    
    try {
      setSaving(true);
      
      // API'ye gönderilecek şekilde soruları formatla
      const formattedQuestions = questions.map((q) => ({
        ...q,
        options: q.options.map(opt => opt.text),
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
      
      // Sınav sayfasına dön
      router.push(`/admin/exams/${examId}`);
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

  // İptal
  const handleCancel = () => {
    router.push(`/admin/exams/${examId}`);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sınav Soruları</h1>
        <div className="flex items-center gap-2">
          <Badge variant={exam?.status === 'published' ? 'default' : 'secondary'}>
            {exam?.status === 'published' ? 'Yayında' : 'Taslak'}
          </Badge>
          <h2 className="text-xl font-semibold">{exam?.title}</h2>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Soruları Düzenle</TabsTrigger>
          <TabsTrigger value="preview">Önizleme</TabsTrigger>
        </TabsList>
        
        {/* Düzenleme Görünümü */}
        <TabsContent value="edit">
          {questions.map((question, qIndex) => (
            <Card key={qIndex} className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Soru {qIndex + 1}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => moveQuestionUp(qIndex)}
                    disabled={qIndex === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => moveQuestionDown(qIndex)}
                    disabled={qIndex === questions.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeQuestion(qIndex)}
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`question-${qIndex}`}>Soru Metni</Label>
                  <Textarea 
                    id={`question-${qIndex}`}
                    value={question.question_text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    placeholder="Soru metnini giriniz"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {question.options.map((option, oIndex) => (
                    <div key={option.id} className="space-y-2">
                      <Label htmlFor={`question-${qIndex}-option-${oIndex}`}>
                        Şık {getOptionLetter(oIndex)}
                      </Label>
                      <Input
                        id={`question-${qIndex}-option-${oIndex}`}
                        value={option.text}
                        onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                        placeholder={`${getOptionLetter(oIndex)} şıkkını giriniz`}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${qIndex}-answer`}>Doğru Cevap</Label>
                    <Select
                      value={question.correct_answer}
                      onValueChange={(value) => updateCorrectAnswer(qIndex, value)}
                    >
                      <SelectTrigger id={`question-${qIndex}-answer`}>
                        <SelectValue placeholder="Doğru cevabı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((_, oIndex) => (
                          <SelectItem key={oIndex} value={getOptionLetter(oIndex)}>
                            {getOptionLetter(oIndex)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`question-${qIndex}-difficulty`}>Zorluk</Label>
                    <Select
                      value={question.difficulty}
                      onValueChange={(value) => updateDifficulty(qIndex, value)}
                    >
                      <SelectTrigger id={`question-${qIndex}-difficulty`}>
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
                  <Label htmlFor={`question-${qIndex}-explanation`}>Açıklama (İsteğe Bağlı)</Label>
                  <Textarea 
                    id={`question-${qIndex}-explanation`}
                    value={question.explanation || ''}
                    onChange={(e) => updateExplanation(qIndex, e.target.value)}
                    placeholder="Cevabın neden doğru olduğunu açıklayın (isteğe bağlı)"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-center mb-6">
            <Button 
              variant="outline" 
              onClick={addNewQuestion}
              className="w-full max-w-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Soru Ekle
            </Button>
          </div>
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
          onClick={handleCancel}
        >
          İptal
        </Button>
        
        <Button 
          onClick={saveQuestions}
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Kaydediliyor...' : 'Soruları Kaydet'}
        </Button>
      </div>
    </div>
  );
} 