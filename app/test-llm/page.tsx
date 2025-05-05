'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { ModelType } from '@/lib/openrouter'

const MODELS: { id: ModelType; name: string }[] = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0' },
  { id: 'anthropic/claude-3-opus:beta', name: 'Claude 3 Opus' },
  { id: 'anthropic/claude-3-sonnet:beta', name: 'Claude 3 Sonnet' },
  { id: 'qwen/qwq-32b:free', name: 'Qwen 32B' },
  { id: 'meta/llama-3-70b:beta', name: 'Llama 3 70B' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1' },
]

export default function TestLLM() {
  const [content, setContent] = useState(`Web geliştirme, web siteleri ve web uygulamaları oluşturma sürecidir. 
Frontend geliştirme, kullanıcı arayüzü ve etkileşimini içerirken, 
backend geliştirme sunucu tarafı işlemleri ve veritabanı yönetimini kapsar. 
HTML sayfa yapısını, CSS stilleri, JavaScript ise etkileşimi sağlar.`)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(2)
  const [selectedModel, setSelectedModel] = useState<ModelType>('google/gemini-2.0-flash-exp:free')
  const [llmStatus, setLlmStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [apiStatusMessage, setApiStatusMessage] = useState('')

  // LLM durumunu kontrol et
  useEffect(() => {
    async function checkLlmStatus() {
      try {
        setLlmStatus('loading')
        
        const response = await fetch('/api/llm-status')
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('LLM Status Error:', errorText)
          setLlmStatus('error')
          setApiStatusMessage('LLM servisi bağlantı hatası')
          return
        }
        
        const text = await response.text()
        
        try {
          const data = JSON.parse(text)
          if (data.status === 'ready') {
            setLlmStatus('ready')
          } else {
            setLlmStatus('error')
            setApiStatusMessage(data.message || 'LLM servisi hazır değil')
          }
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError, 'Raw response:', text)
          setLlmStatus('error')
          setApiStatusMessage('API yanıtı geçerli JSON formatında değil')
        }
      } catch (error) {
        console.error('LLM Status Check Error:', error)
        setLlmStatus('error')
        setApiStatusMessage('LLM durum kontrolü sırasında bir hata oluştu')
      }
    }

    checkLlmStatus()
  }, [])

  const handleTest = async () => {
    try {
      setLoading(true)
      setError('')
      setResult('')

      const response = await fetch('/api/test-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content,
          difficulty,
          numberOfQuestions,
          model: selectedModel
        }),
      })

      // Metni önce alıp sonra JSON.parse etmeye çalışalım
      const responseText = await response.text()
      // console.log('Raw API response:', responseText); // Removed log
      
      try {
        const data = JSON.parse(responseText)
        
        if (data.success) {
          let parsedData
          
          // API'den dönen data değerini kontrol et
          if (typeof data.data === 'string') {
            try {
              // JSON içeriğini bulmak için regex kullan
              const jsonMatch = data.data.match(/(\[|\{)(.|\n)*(\]|\})/);
              if (jsonMatch) {
                // Eşleşen JSON kısmını çıkart
                const jsonString = jsonMatch[0];
                parsedData = JSON.parse(jsonString);
              } else if (data.data.trim().startsWith('{') || data.data.trim().startsWith('[')) {
                // Direkt JSON ise parse et
                parsedData = JSON.parse(data.data);
              } else {
                // JSON değilse ve eşleşme yoksa bildirimdeki tüm metni göster
                parsedData = data.data;
              }
            } catch (innerParseError) {
              console.error('Inner JSON Parse Error:', innerParseError);
              // Parse edilemezse ham veriyi göster
              parsedData = data.data;
            }
          } else {
            // Zaten JSON objesi ise doğrudan kullan
            parsedData = data.data;
          }
          
          // Sonucu ekranda göster
          if (typeof parsedData === 'object') {
            setResult(JSON.stringify(parsedData, null, 2));
          } else {
            setResult(String(parsedData));
          }
        } else {
          setError(data.error || 'Bir hata oluştu')
        }
      } catch (parseError) {
        console.error('Response JSON Parse Error:', parseError, 'Raw response:', responseText)
        setError('API yanıtı geçerli bir JSON formatında değil')
      }
    } catch (error) {
      console.error('Request Error:', error)
      setError('İstek sırasında bir hata oluştu: ' + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>LLM Test Sayfası</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {llmStatus === 'loading' && (
            <Alert className="bg-yellow-50 border-yellow-400">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>LLM Durumu Kontrol Ediliyor</AlertTitle>
              <AlertDescription>
                LLM servisinin durumu kontrol ediliyor, lütfen bekleyin...
              </AlertDescription>
            </Alert>
          )}
          
          {llmStatus === 'error' && (
            <Alert className="bg-red-50 border-red-400">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle>LLM Servisi Hatası</AlertTitle>
              <AlertDescription>
                {apiStatusMessage || 'LLM servisi şu anda kullanılamıyor.'}
              </AlertDescription>
            </Alert>
          )}
          
          {llmStatus === 'ready' && (
            <Alert className="bg-green-50 border-green-400">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>LLM Servisi Hazır</AlertTitle>
              <AlertDescription>
                LLM servisi bağlantısı başarılı, test işlemine devam edebilirsiniz.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Test Metni
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              rows={6}
              placeholder="Soru üretilecek metni buraya girin..."
              className="min-h-[150px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Model
              </label>
              <Select
                value={selectedModel}
                onValueChange={(value: ModelType) => setSelectedModel(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Model seçin" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Zorluk Seviyesi
              </label>
              <Select
                value={difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zorluk seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Kolay</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="hard">Zor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Soru Sayısı
              </label>
              <Select
                value={numberOfQuestions.toString()}
                onValueChange={(value) => setNumberOfQuestions(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Soru sayısı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Soru
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleTest} 
            disabled={loading || !content.trim() || llmStatus !== 'ready'}
            className="w-full"
          >
            {loading ? 'Sorular Üretiliyor...' : 'Test Et'}
          </Button>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex items-center space-x-2 mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-lg font-medium">Yapay Zeka Çalışıyor...</span>
              </div>
              <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse-width rounded-full"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Seçilen model: {MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
              </p>
              <p className="text-sm text-gray-500">
                {numberOfQuestions} adet {difficulty === 'easy' ? 'kolay' : difficulty === 'medium' ? 'orta' : 'zor'} seviye soru üretiliyor...
              </p>
            </div>
          )}

          {error && (
            <Card className="border-red-500">
              <CardContent className="pt-6">
                <p className="text-red-500">{error}</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Sonuç</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary p-4 rounded-lg overflow-auto whitespace-pre-wrap">
                  {result}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
