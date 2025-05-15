'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// API anahtarını formatlamaya gerek yok, doğrudan kullanacağız

export default function AIModelTestPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState('orta');
  const [jsonResult, setJsonResult] = useState<any>(null);

  // localStorage'dan değerleri yükle
  useEffect(() => {
    // Sadece client tarafında ve kullanıcı yüklendikten sonra çalıştır
    if (typeof window !== 'undefined' && user) {
      try {
        console.log('Loading values from localStorage');
        const savedApiKey = localStorage.getItem('ai_model_test_api_key') || '';
        const savedModelName = localStorage.getItem('ai_model_test_model_name') || '';
        const savedContent = localStorage.getItem('ai_model_test_content') || '';
        const savedNumberOfQuestions = localStorage.getItem('ai_model_test_number_of_questions');
        const savedDifficulty = localStorage.getItem('ai_model_test_difficulty') || 'orta';

        console.log('Loaded values:', {
          apiKey: savedApiKey ? '***' : '',
          modelName: savedModelName,
          contentLength: savedContent.length,
          numberOfQuestions: savedNumberOfQuestions,
          difficulty: savedDifficulty
        });

        if (savedApiKey) setApiKey(savedApiKey);
        if (savedModelName) setModelName(savedModelName);
        if (savedContent) setContent(savedContent);
        if (savedNumberOfQuestions) {
          setNumberOfQuestions(parseInt(savedNumberOfQuestions));
        }
        if (savedDifficulty) setDifficulty(savedDifficulty);
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  }, [user]);

  // SUPERADMIN kontrolü
  useEffect(() => {
    if (user && user.role !== 'SUPERADMIN') {
      toast.error('Yetkisiz Erişim', {
        description: 'Bu sayfaya erişim yetkiniz bulunmamaktadır.',
      });
      router.push('/dashboard');
    }
  }, [user, router]);

  // Zorluk seviyesi Türkçe karşılıkları (doğrudan prompt'ta kullanıldığı için artık gerekli değil)
  // const difficultyMapping = {
  //   'kolay': 'easy',
  //   'orta': 'medium',
  //   'zor': 'hard'
  // };

  // Değerleri localStorage'a kaydet
  const saveToLocalStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        console.log('Saving values to localStorage');
        localStorage.setItem('ai_model_test_api_key', apiKey);
        localStorage.setItem('ai_model_test_model_name', modelName);
        localStorage.setItem('ai_model_test_content', content);
        localStorage.setItem('ai_model_test_number_of_questions', numberOfQuestions.toString());
        localStorage.setItem('ai_model_test_difficulty', difficulty);
        console.log('Values saved successfully');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  };

  // Input değerleri değiştiğinde localStorage'a kaydet
  // Sadece kullanıcı yüklendikten ve değerler değiştikten sonra kaydet
  useEffect(() => {
    if (user) {
      // Değerler boş değilse kaydet
      if (apiKey || modelName || content) {
        saveToLocalStorage();
      }
    }
  }, [apiKey, modelName, content, numberOfQuestions, difficulty, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey || !modelName || !content) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    // Form gönderildiğinde de localStorage'a kaydet
    try {
      console.log('Saving form values on submit');
      saveToLocalStorage();
    } catch (error) {
      console.error('Error saving form values on submit:', error);
    }

    setLoading(true);
    setError('');
    setResult('');
    setJsonResult(null);

    try {
      // Prompt oluştur
      const difficultyInTurkish = difficulty;
      const prompt = `Aşağıdaki içerik hakkında ${numberOfQuestions} adet ${difficultyInTurkish} seviyede çoktan seçmeli soru üret.

ÖNEMLİ KURALLAR:
1. Her soru için SADECE 4 seçenek olmalı (A, B, C, D) - daha fazla değil, daha az değil.
2. E, F veya başka harflerle şık OLUŞTURMA. Sadece A, B, C, D şıklarını kullan.
3. Doğru cevap da sadece A, B, C veya D olabilir.
4. Her doğru cevap için kısa bir açıklama ekle.
5. Markdown formatı kullanma, düz metin olarak yanıt ver.
6. Yanıtında ** işaretleri kullanma.

İçerik:
${content}

Örnek format:
1. Soru metni?
A) Seçenek A
B) Seçenek B
C) Seçenek C
D) Seçenek D
Doğru Cevap: B
Açıklama: B'nin doğru cevap olmasının kısa açıklaması.

TEKRAR UYARI: Sadece A, B, C, D şıklarını kullan. Başka şık ekleme. Markdown formatı kullanma ve ** işaretleri kullanma.`;

      // API anahtarını doğrudan kullan ve logla
      console.log('Using API Key:', apiKey);

      // Doğrudan OpenRouter API'sine istek yap - verilen kodu kullan
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://kentkonut.com.tr", // Site URL
          "X-Title": "Kent Konut Sinav Portali", // Site title (Türkçe karakter kullanmıyoruz)
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": modelName,
          "messages": [
            {
              "role": "user",
              "content": prompt
            }
          ]
        })
      });

      // API yanıtını logla
      console.log('API Response Status:', response.status, response.statusText);

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        // Daha detaylı hata mesajı
        const errorMessage = data.error?.message ||
                            data.error ||
                            data.message ||
                            `API isteği başarısız oldu (${response.status}: ${response.statusText})`;
        console.error('Error details:', errorMessage);
        throw new Error(errorMessage);
      }

      // OpenRouter API yanıtını işle
      let result = '';
      if (data.choices && data.choices[0]?.message?.content) {
        result = data.choices[0].message.content;
      } else {
        result = JSON.stringify(data);
      }

      setResult(result);

      // JSON formatında sonucu da göster
      setJsonResult({
        prompt,
        model: modelName,
        result: result,
        rawResponse: data
      });

    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
      toast.error('İşlem Başarısız', {
        description: err.message || 'Model testi sırasında bir hata oluştu.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role !== 'SUPERADMIN') {
    return null; // Yetkisiz kullanıcılar için içerik gösterme
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Brain className="h-8 w-8 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Yapay Zeka Model Test</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Test Parametreleri</CardTitle>
            <CardDescription>
              Yapay zeka modelini test etmek için gerekli parametreleri girin.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Anahtarı</Label>
                <Input
                  id="apiKey"
                  type="text"
                  placeholder="API anahtarınızı girin (Bearer öneki olmadan)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  OpenRouter API anahtarınızı tam olarak girin. Örn: sk_or_v1_...
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelName">Model Adı</Label>
                <Input
                  id="modelName"
                  placeholder="Örn: deepseek/deepseek-chat-v3-0324:free"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Örnek modeller: deepseek/deepseek-chat-v3-0324:free, anthropic/claude-3-sonnet:beta, meta/llama-3-8b-instruct:free
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfQuestions">Soru Sayısı</Label>
                  <Input
                    id="numberOfQuestions"
                    type="number"
                    min={1}
                    max={10}
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Zorluk Seviyesi</Label>
                  <select
                    id="difficulty"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">İçerik</Label>
                <Textarea
                  id="content"
                  placeholder="Sorular için kaynak içeriği girin"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Hata</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  'Modeli Test Et'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Model Yanıtı</CardTitle>
              <CardDescription>
                {modelName} modelinin ürettiği yanıt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                {result}
              </div>
            </CardContent>
          </Card>
        )}

        {jsonResult && (
          <Card>
            <CardHeader>
              <CardTitle>JSON Formatında Sonuç</CardTitle>
              <CardDescription>
                API yanıtının tüm detayları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Kullanılan Model</h3>
                  <div className="bg-muted p-2 rounded-md">
                    <code>{jsonResult.model}</code>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Prompt</h3>
                  <div className="bg-muted p-2 rounded-md max-h-40 overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">{jsonResult.prompt}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Ham API Yanıtı</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(jsonResult.rawResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
