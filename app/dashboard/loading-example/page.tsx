"use client";

import { Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { LoadingExample } from "@/components/examples/loading-example";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingLink } from "@/components/ui/loading-link";
import { Button } from "@/components/ui/button";

function LoadingExampleContent() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Yükleme Ekranı Örneği</h1>
        <Button asChild variant="outline">
          <LoadingLink href="/dashboard">Geri Dön</LoadingLink>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Yükleme Ekranı Kullanımı</CardTitle>
            <CardDescription>
              Bu sayfa, global yükleme ekranının nasıl kullanılacağını gösterir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Yükleme ekranı iki şekilde kullanılabilir:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Otomatik Kullanım:</strong> Sayfa geçişleri sırasında otomatik olarak gösterilir.
                Aşağıdaki linklerden birine tıklayarak test edebilirsiniz.
              </li>
              <li>
                <strong>Manuel Kullanım:</strong> <code>useLoadingControl</code> hook&#39;u ile manuel olarak kontrol edilebilir.
                Aşağıdaki butona tıklayarak test edebilirsiniz.
              </li>
            </ol>

            <div className="flex flex-wrap gap-4 mt-4">
              <Button asChild>
                <LoadingLink href="/dashboard">Ana Sayfa</LoadingLink>
              </Button>
              <Button asChild>
                <LoadingLink href="/dashboard/settings">Ayarlar</LoadingLink>
              </Button>
              <Button asChild>
                <LoadingLink href="/question-pools">Soru Havuzları</LoadingLink>
              </Button>
            </div>
          </CardContent>
        </Card>

        <LoadingExample />
      </div>
    </div>
  );
}

export default function LoadingExamplePage() {
  return (
    <Suspense fallback={<div>Loading example...</div>}>
      <LoadingExampleContent />
    </Suspense>
  );
}
