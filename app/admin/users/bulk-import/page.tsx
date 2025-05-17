'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/breadcrumb';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoadingControl } from '@/hooks/use-loading';

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    successfulUsers: Array<{ name: string; email: string }>;
    failedUsers: Array<{ name: string; email: string; error: string }>;
  };
}

export default function BulkImportPage() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoadingControl();
  const [userList, setUserList] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('KentKonut2024!');
  const [autoVerify, setAutoVerify] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState('import');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userList.trim()) {
      toast.error('Lütfen personel listesini girin');
      return;
    }

    if (!defaultPassword.trim()) {
      toast.error('Lütfen varsayılan şifre girin');
      return;
    }

    try {
      setIsSubmitting(true);
      showLoading();

      const response = await fetch('/api/admin/users/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userList,
          defaultPassword,
          autoVerify,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'İşlem sırasında bir hata oluştu');
      }

      setResult(data);
      setActiveTab('results');
      toast.success('Toplu personel kaydı tamamlandı');
    } catch (error) {
      console.error('Toplu personel kaydı hatası:', error);
      toast.error(error instanceof Error ? error.message : 'İşlem sırasında bir hata oluştu');
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  const handleReset = () => {
    setUserList('');
    setResult(null);
    setActiveTab('import');
  };

  return (
    <div className="container mx-auto py-6">
      <Breadcrumb
        items={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Kullanıcılar', href: '/dashboard/users' },
          { label: 'Toplu Personel Kaydı' },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Toplu Personel Kaydı</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
          Kullanıcılara Dön
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="import">Personel Listesi</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>Sonuçlar</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Personel Listesi</CardTitle>
              <CardDescription>
                Virgülle ayrılmış ad soyad ve e-posta formatında personel listesini girin.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Bilgi</AlertTitle>
                  <AlertDescription>
                    Her satıra bir personel bilgisi girin. Format: <code>Ad Soyad,email@kentkonut.com.tr</code>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="userList">Personel Listesi</Label>
                  <Textarea
                    id="userList"
                    placeholder="Örnek:&#10;Ahmet Yılmaz,ahmet.yilmaz@kentkonut.com.tr&#10;Ayşe Demir,ayse.demir@kentkonut.com.tr"
                    rows={10}
                    value={userList}
                    onChange={(e) => setUserList(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultPassword">Varsayılan Şifre</Label>
                  <Input
                    id="defaultPassword"
                    type="text"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Tüm kullanıcılar için aynı şifre kullanılacaktır. Kullanıcılar daha sonra şifrelerini değiştirebilirler.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoVerify"
                    checked={autoVerify}
                    onCheckedChange={(checked) => setAutoVerify(checked as boolean)}
                  />
                  <Label htmlFor="autoVerify">
                    Hesapları otomatik olarak onayla
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Bu seçenek işaretlendiğinde, oluşturulan hesaplar otomatik olarak onaylanır ve kullanıcılar hemen giriş yapabilir. İşaretlenmezse, hesaplar yönetici tarafından manuel olarak onaylanmalıdır.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleReset} disabled={isSubmitting}>
                  Temizle
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'İşleniyor...' : 'Personel Kayıtlarını Oluştur'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {result && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>İşlem Sonucu</CardTitle>
                  <CardDescription>
                    Toplu personel kaydı işlemi sonuçları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert variant={result.success ? "default" : "destructive"}>
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {result.success ? "İşlem Başarılı" : "İşlem Sırasında Hatalar Oluştu"}
                      </AlertTitle>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>

                    {result.data && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm font-medium">Toplam İşlenen</p>
                          <p className="text-2xl font-bold">{result.data.totalProcessed}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">Başarılı</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{result.data.successCount}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">Başarısız</p>
                          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{result.data.failedCount}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {result.data && result.data.successfulUsers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Başarıyla Oluşturulan Kullanıcılar</CardTitle>
                    <CardDescription>
                      Toplam {result.data.successfulUsers.length} kullanıcı başarıyla oluşturuldu
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr className="bg-muted">
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">E-posta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {result.data.successfulUsers.map((user, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.data && result.data.failedUsers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Başarısız Olan Kullanıcılar</CardTitle>
                    <CardDescription>
                      Toplam {result.data.failedUsers.length} kullanıcı oluşturulamadı
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr className="bg-muted">
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">E-posta</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hata</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {result.data.failedUsers.map((user, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-red-600">{user.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={handleReset}>
                  Yeni Liste Oluştur
                </Button>
                <Button onClick={() => router.push('/dashboard/users')}>
                  Kullanıcılara Dön
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
