"use client";

import { useState, Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function UpdateAnswersFormComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpdate = async () => {
    if (!confirm("Bu işlem tüm soruların doğru cevaplarını 0,1,2,3 formatından A,B,C,D formatına dönüştürecek. Devam etmek istiyor musunuz?")) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/update-answers", {
        method: "POST",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      setResult(data);
      toast.success(data.message || "Sorular başarıyla güncellendi");
    } catch (error) {
      console.error("Hata:", error);
      toast.error("Sorular güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Soru Cevaplarını Güncelle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Bu işlem, tüm soruların doğru cevaplarını 0,1,2,3 formatından A,B,C,D formatına dönüştürecek.
          </p>
          
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Güncelleniyor..." : "Tüm Cevapları Güncelle"}
          </Button>
          
          {result && (
            <div className="mt-6 p-4 border rounded-md bg-green-50">
              <h3 className="font-medium text-green-800">Güncelleme Başarılı</h3>
              <pre className="mt-2 text-sm overflow-auto p-2 bg-white rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpdateAnswersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdateAnswersFormComponent />
    </Suspense>
  );
}
