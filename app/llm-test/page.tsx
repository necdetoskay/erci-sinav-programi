'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function LLMTestPage() {
  const [content, setContent] = useState('')
  const [numberOfQuestions, setNumberOfQuestions] = useState(3)
  const [optionsPerQuestion, setOptionsPerQuestion] = useState(4)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'ready' | 'error'>('checking')

  // LLM servisinin durumunu kontrol et
  useEffect(() => {
    checkServiceStatus()
  }, [])

  const checkServiceStatus = async () => {
    try {
      setServiceStatus('checking')
      const response = await fetch('/api/llm-status')
      const data = await response.json()
      
      if (data.status === 'ready') {
        setServiceStatus('ready')
      } else {
        setServiceStatus('error')
        setError('LLM servisi hazır değil: ' + data.message)
      }
    } catch (error) {
      setServiceStatus('error')
      setError('LLM servis durumu kontrol edilemedi')
    }
  }

  const handleGenerateQuestions = async () => {
    if (!content.trim()) {
      setError('Lütfen soru hazırlanacak içeriği girin')
      return
    }

    try {
      setLoading(true)
      setError('')
      setResult('')

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          numberOfQuestions,
          optionsPerQuestion,
          model: 'anthropic/claude-3-sonnet:beta'
        }),
        cache: 'no-store'
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data.questions)
      } else {
        setError(data.error || 'Sorular oluşturulurken bir hata oluştu')
      }
    } catch (error) {
      console.error('İstek hatası:', error)
      setError('Sorular oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LLM Test Sayfası</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Servis Durumu */}
          {serviceStatus === 'checking' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Kontrol Ediliyor</AlertTitle>
              <AlertDescription>
                LLM servisi kontrol ediliyor...
              </AlertDescription>
            </Alert>
          )}
          
          {serviceStatus === 'ready' && (
            <Alert className="bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Hazır</AlertTitle>
              <AlertDescription>
                LLM servisi kullanıma hazır
              </AlertDescription>
            </Alert>
          )}
          
          {serviceStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* İçerik Girişi */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Soru Hazırlanacak İçerik
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="İçeriği buraya yapıştırın..."
              className="min-h-[200px]"
            />
          </div>

          {/* Soru Sayısı */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Soru Sayısı: {numberOfQuestions}
            </label>
            <Slider
              value={[numberOfQuestions]}
              onValueChange={(value) => setNumberOfQuestions(value[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          {/* Seçenek Sayısı */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Her Soru İçin Seçenek Sayısı: {optionsPerQuestion}
            </label>
            <Slider
              value={[optionsPerQuestion]}
              onValueChange={(value) => setOptionsPerQuestion(value[0])}
              min={2}
              max={6}
              step={1}
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-4">
            <Button
              onClick={handleGenerateQuestions}
              disabled={loading || serviceStatus !== 'ready' || !content.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sorular Hazırlanıyor...
                </>
              ) : (
                'Soruları Hazırla'
              )}
            </Button>
            
            <Button
              onClick={checkServiceStatus}
              variant="outline"
              disabled={loading || serviceStatus === 'checking'}
            >
              Servisi Kontrol Et
            </Button>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sonuç */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Hazırlanan Sorular</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-50 p-4 rounded-lg overflow-auto whitespace-pre-wrap">
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