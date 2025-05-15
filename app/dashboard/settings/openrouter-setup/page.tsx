'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OpenRouterSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: any[] } | null>(null);

  const handleSetupModels = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch('/api/admin/setup-openrouter-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'OpenRouter modelleri eklenirken bir hata oluştu');
      }
      
      setResult({
        success: true,
        message: data.message || 'OpenRouter modelleri başarıyla güncellendi',
        results: data.results
      });
      
      toast.success(data.message || 'OpenRouter modelleri başarıyla güncellendi');
    } catch (error) {
      console.error('Error setting up OpenRouter models:', error);
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'OpenRouter modelleri eklenirken bir hata oluştu'
      });
      
      toast.error(error instanceof Error ? error.message : 'OpenRouter modelleri eklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">OpenRouter Modelleri Kurulumu</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>OpenRouter Modelleri</CardTitle>
          <CardDescription>
            OpenRouter provider'ına yeni modeller ekleyin.
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
          
          {result?.success && result.results && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mesaj</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {result.results.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'added' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {item.status === 'added' ? 'Eklendi' : 'Atlandı'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Bu işlem, OpenRouter provider'ına aşağıdaki modelleri ekleyecektir:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>LLama 4 Scout (meta-llama/llama-4-scout-17b-16e-instruct)</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button onClick={handleSetupModels} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'İşleniyor...' : 'OpenRouter Modellerini Güncelle'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
