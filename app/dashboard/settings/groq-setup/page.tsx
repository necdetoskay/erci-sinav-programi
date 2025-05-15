'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GroqSetupPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error('Lütfen API anahtarını girin');
      return;
    }
    
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/admin/setup-groq-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Groq provider oluşturulurken bir hata oluştu');
      }
      
      setResult({
        success: true,
        message: data.message || 'Groq provider başarıyla oluşturuldu',
      });
      
      toast.success(data.message || 'Groq provider başarıyla oluşturuldu');
    } catch (error) {
      console.error('Error setting up Groq provider:', error);
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Groq provider oluşturulurken bir hata oluştu',
      });
      
      toast.error(error instanceof Error ? error.message : 'Groq provider oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Groq API Kurulumu</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Groq API Anahtarı</CardTitle>
          <CardDescription>
            Groq API anahtarınızı girerek Llama 3 ve Mixtral modellerini kullanabilirsiniz.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {result && (
            <Alert 
              variant={result.success ? "default" : "destructive"}
              className="mb-4"
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.success ? 'Başarılı' : 'Hata'}
              </AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Groq API Anahtarı</Label>
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  API anahtarınızı <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Groq Console</a> sayfasından alabilirsiniz.
                </p>
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'İşleniyor...' : 'Groq API Anahtarını Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-start">
          <h3 className="text-sm font-medium mb-2">Kurulum Sonrası:</h3>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Groq API anahtarınız kaydedildikten sonra, Llama 3 ve Mixtral modelleri otomatik olarak eklenir.</li>
            <li>Yapay zeka ile soru üretme sayfasında bu modelleri kullanabilirsiniz.</li>
            <li>Groq, OpenRouter'a göre daha hızlı yanıt verir ve daha düşük maliyetlidir.</li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  );
}
