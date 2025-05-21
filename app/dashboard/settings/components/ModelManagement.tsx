"use client";

import React, { useState } from 'react';
import { toast } from "sonner";
import { Model, Provider } from './types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ModelTestDialog } from './ModelTestDialog';
import { CollapsibleSection } from "@/components/ui/collapsible";

interface ModelManagementProps {
  models: Model[];
  setModels: React.Dispatch<React.SetStateAction<Model[]>>;
  providers: Provider[];
  selectedProviderId: string | null;
  userId?: string | null; // Kullanıcı ID'si
}

export const ModelManagement: React.FC<ModelManagementProps> = ({
  models,
  setModels,
  providers,
  selectedProviderId,
  userId
}) => {
  // Model form state'leri
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [currentModel, setCurrentModel] = useState<Model>({
    id: '',
    name: '',
    details: '', // Açıklama alanı formdan kaldırıldı ama model yapısında korunuyor
    apiCode: '',
    providerId: '',
    orderIndex: 0,
    isEnabled: true
  });

  // Test dialog state'leri
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testModel, setTestModel] = useState<Model | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    result?: string;
    error?: string;
    responseTime?: number;
    rawResponse?: any;
  } | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Validasyon hataları
  const [modelErrors, setModelErrors] = useState<{[key: string]: string}>({});

  // Model form validasyonu
  const validateModelForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!currentModel.name.trim()) {
      errors.name = "Model adı gereklidir";
    }

    if (!currentModel.providerId) {
      errors.providerId = "Provider seçimi gereklidir";
    }

    if (!currentModel.apiCode.trim()) {
      errors.apiCode = "Model API kodu gereklidir";
    }

    setModelErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Yeni model ekleme
  const handleAddModel = async () => {
    if (validateModelForm()) {
      try {
        // API'ye yeni model ekle
        const url = userId ? `/api/ai-models?userId=${userId}` : '/api/ai-models';
        console.log(`Adding model to: ${url}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentModel.name,
            details: currentModel.details,
            apiCode: currentModel.apiCode,
            providerId: currentModel.providerId,
            orderIndex: currentModel.orderIndex,
            isEnabled: currentModel.isEnabled,
            userId: userId // Kullanıcı ID'sini de gönder
          }),
        });

        if (!response.ok) {
          throw new Error('Model eklenirken bir hata oluştu');
        }

        const newModel = await response.json();

        // State'i güncelle
        setModels([...models, newModel]);
        setIsModelDialogOpen(false);
        setCurrentModel({
          id: '',
          name: '',
          details: '',
          apiCode: '',
          providerId: '',
          orderIndex: 0,
          isEnabled: true
        });
        toast.success("Model başarıyla eklendi");
      } catch (error) {
        console.error('Model ekleme hatası:', error);
        toast.error('Model eklenirken bir hata oluştu');
      }
    }
  };

  // Model düzenleme
  const handleEditModel = async () => {
    if (validateModelForm()) {
      try {
        // API'ye model güncelleme isteği gönder
        const url = userId
          ? `/api/ai-models/${currentModel.id}?userId=${userId}`
          : `/api/ai-models/${currentModel.id}`;

        console.log(`Updating model at: ${url}`);

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentModel.name,
            details: currentModel.details,
            apiCode: currentModel.apiCode,
            providerId: currentModel.providerId,
            orderIndex: currentModel.orderIndex,
            isEnabled: currentModel.isEnabled,
            userId: userId // Kullanıcı ID'sini de gönder
          }),
        });

        if (!response.ok) {
          throw new Error('Model güncellenirken bir hata oluştu');
        }

        const updatedModel = await response.json();

        // State'i güncelle
        setModels(models.map(model =>
          model.id === currentModel.id ? updatedModel : model
        ));
        setIsModelDialogOpen(false);
        setIsEditingModel(false);
        setCurrentModel({
          id: '',
          name: '',
          details: '', // Açıklama alanı formdan kaldırıldı ama model yapısında korunuyor
          apiCode: '',
          providerId: '',
          orderIndex: 0,
          isEnabled: true
        });
        toast.success("Model başarıyla güncellendi");
      } catch (error) {
        console.error('Model güncelleme hatası:', error);
        toast.error('Model güncellenirken bir hata oluştu');
      }
    }
  };

  // Model silme
  const handleDeleteModel = async (id: string) => {
    try {
      // API'ye model silme isteği gönder
      const url = userId
        ? `/api/ai-models/${id}?userId=${userId}`
        : `/api/ai-models/${id}`;

      console.log(`Deleting model at: ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Model silinirken bir hata oluştu');
      }

      // State'i güncelle
      setModels(models.filter(model => model.id !== id));
      toast.success("Model başarıyla silindi");
    } catch (error) {
      console.error('Model silme hatası:', error);
      toast.error('Model silinirken bir hata oluştu');
    }
  };

  // Model düzenleme formunu aç
  const openEditModelDialog = (model: Model) => {
    setCurrentModel(model);
    setIsEditingModel(true);
    setIsModelDialogOpen(true);
  };

  // Model durumunu değiştir (aktif/pasif)
  const handleToggleModelStatus = async (id: string, isEnabled: boolean) => {
    try {
      // API'ye model güncelleme isteği gönder
      const url = userId
        ? `/api/ai-models/${id}?userId=${userId}`
        : `/api/ai-models/${id}`;

      console.log(`Toggling model status at: ${url}`);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled,
          userId: userId // Kullanıcı ID'sini de gönder
        }),
      });

      if (!response.ok) {
        throw new Error('Model durumu değiştirilirken bir hata oluştu');
      }

      const updatedModel = await response.json();

      // State'i güncelle
      setModels(models.map(model =>
        model.id === id ? updatedModel : model
      ));

      toast.success(`Model ${isEnabled ? 'aktif' : 'pasif'} duruma getirildi`);
    } catch (error) {
      console.error('Model durumu değiştirme hatası:', error);
      toast.error('Model durumu değiştirilirken bir hata oluştu');
    }
  };

  // Model test etme işlevi
  const handleTestModel = async (model: Model) => {
    setTestModel(model);
    setTestResult(null);
    setIsTestLoading(true);
    setIsTestDialogOpen(true);

    try {
      const response = await fetch('/api/ai-models/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: model.id
        }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Model test hatası:', error);
      setTestResult({
        success: false,
        error: 'Test sırasında bir hata oluştu'
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  // Provider adını getir
  const getProviderName = (providerId: string): string => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Bilinmeyen Provider';
  };

  // Filtrelenmiş modelleri al
  const filteredModels = selectedProviderId
    ? models.filter(model => model.providerId === selectedProviderId)
    : models;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {selectedProviderId
                ? `${getProviderName(selectedProviderId)} Modelleri`
                : "Tüm Yapay Zeka Modelleri"}
            </CardTitle>
            <CardDescription>
              {selectedProviderId
                ? "Seçili provider için modelleri yönetin"
                : "Tüm yapay zeka modellerini yönetin"}
            </CardDescription>
          </div>
          <Button onClick={() => {
            setCurrentModel({
              id: '',
              name: '',
              details: '', // Açıklama alanı formdan kaldırıldı ama model yapısında korunuyor
              apiCode: '',
              providerId: selectedProviderId || '',
              orderIndex: 0,
              isEnabled: true
            });
            setIsEditingModel(false);
            setIsModelDialogOpen(true);
          }}>
            Yeni Model Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {filteredModels.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {selectedProviderId
                ? "Bu provider için henüz model eklenmemiş"
                : "Henüz model eklenmemiş"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Adı</TableHead>
                  {!selectedProviderId && <TableHead>Provider</TableHead>}
                  <TableHead>API Kodu</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    {!selectedProviderId && (
                      <TableCell>{getProviderName(model.providerId)}</TableCell>
                    )}
                    <TableCell className="font-mono text-sm">{model.apiCode}</TableCell>
                    <TableCell>{model.orderIndex}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={model.isEnabled}
                          onCheckedChange={(checked) => handleToggleModelStatus(model.id, checked)}
                        />
                        <Badge variant={model.isEnabled ? "default" : "outline"}>
                          {model.isEnabled ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestModel(model)}
                      >
                        Test Et
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModelDialog(model)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModel(model.id)}
                      >
                        Sil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Model Ekleme/Düzenleme Dialog */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent
          onPointerDownOutside={(e) => {
            // Dışarı tıklamayı engelle
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditingModel ? "Model Düzenle" : "Yeni Model Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditingModel
                ? "Model bilgilerini güncelleyin"
                : "Yeni bir yapay zeka modeli ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="modelName">Model Adı *</Label>
                <Input
                  id="modelName"
                  value={currentModel.name}
                  onChange={(e) => setCurrentModel({ ...currentModel, name: e.target.value })}
                  placeholder="Örn: GPT-4, Claude 3"
                />
                {modelErrors.name && (
                  <p className="text-xs text-destructive">{modelErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="modelProvider">Provider *</Label>
                <Select
                  value={currentModel.providerId}
                  onValueChange={(value) => setCurrentModel({ ...currentModel, providerId: value })}
                >
                  <SelectTrigger id="modelProvider">
                    <SelectValue placeholder="Provider seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modelErrors.providerId && (
                  <p className="text-xs text-destructive">{modelErrors.providerId}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="modelApiCode">API Kodu *</Label>
              <Textarea
                id="modelApiCode"
                value={currentModel.apiCode}
                onChange={(e) => setCurrentModel({ ...currentModel, apiCode: e.target.value })}
                placeholder="Örn: gpt-4, claude-3-opus, anthropic/claude-3-opus-20240229"
                className="font-mono text-sm"
                rows={6}
              />
              {modelErrors.apiCode && (
                <p className="text-xs text-destructive">{modelErrors.apiCode}</p>
              )}

              <CollapsibleSection
                title="API Kodu Hakkında Bilgi"
                defaultOpen={false}
                className="mt-2 border-l-2 border-muted pl-3"
                titleClassName="text-sm text-muted-foreground"
              >
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    API isteklerinde kullanılacak model kodu. OpenRouter için "anthropic/claude-3-opus-20240229" gibi tam model adını girin.
                    Llama modelleri için "meta-llama/llama-4-maverick:free" formatını kullanın.
                    <span className="font-semibold text-amber-600 dark:text-amber-400"> Önemli: </span>
                    Model ID'si değil, model adı veya kodu kullanın. UUID veya benzeri ID formatları hatalara neden olabilir.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Gelişmiş Kullanım:</span> JSON formatında API isteği gönderebilirsiniz.
                    <code className="bg-muted px-1 rounded">{'{API_KEY}'}</code> değişkeni, provider'ın API anahtarı ile otomatik olarak değiştirilecektir.
                    <code className="bg-muted px-1 rounded">{'{PROMPT}'}</code> değişkeni, test mesajı veya soru üretme promptu ile değiştirilecektir.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bu yapı hem model test sayfasında hem de soru üretme işlemlerinde aynı şekilde çalışır.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Özel API Formatları:</span> Farklı API formatları için özel yapılandırma kullanabilirsiniz.
                    <code className="bg-muted px-1 rounded">url</code>, <code className="bg-muted px-1 rounded">method</code> ve
                    <code className="bg-muted px-1 rounded">headers</code> alanlarını belirterek istediğiniz API'ye istek gönderebilirsiniz.
                  </p>
                  <div className="bg-muted p-2 rounded-md mt-1 text-xs font-mono">
                    {`// Basit model adı
meta-llama/llama-4-maverick:free

// JSON formatı örneği
{
  "model": "meta-llama/llama-4-maverick:free",
  "messages": [{"role": "user", "content": "{PROMPT}"}],
  "headers": {
    "Authorization": "Bearer {API_KEY}",
    "HTTP-Referer": "https://kentkonut.com.tr",
    "X-Title": "Kent Konut Sinav Portali",
    "Content-Type": "application/json"
  }
}

// Özel API endpoint örneği
{
  "url": "https://api.example.com/v1/chat",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {API_KEY}",
    "Content-Type": "application/json"
  },
  "model": "custom-model",
  "prompt": "{PROMPT}",
  "max_tokens": 1000
}

// JavaScript fetch kodu örneği
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer {API_KEY}",
    "HTTP-Referer": "https://kentkonut.com.tr",
    "X-Title": "Kent Konut Sinav Portali",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "meta-llama/llama-4-maverick:free",
    "messages": [
      {
        "role": "user",
        "content": "PROMPT"
      }
    ]
  })
})`}
                  </div>
                </div>
              </CollapsibleSection>
            </div>

            <div className="space-y-1">
              <Label htmlFor="modelOrder">Sıralama</Label>
              <Input
                id="modelOrder"
                type="number"
                value={currentModel.orderIndex.toString()}
                onChange={(e) => setCurrentModel({
                  ...currentModel,
                  orderIndex: parseInt(e.target.value) || 0
                })}
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <Switch
                id="modelStatus"
                checked={currentModel.isEnabled}
                onCheckedChange={(checked) => setCurrentModel({
                  ...currentModel,
                  isEnabled: checked
                })}
              />
              <Label htmlFor="modelStatus">Aktif</Label>
            </div>


          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={isEditingModel ? handleEditModel : handleAddModel}>
              {isEditingModel ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Test Dialog */}
      <ModelTestDialog
        isOpen={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        model={testModel}
        testResult={testResult}
        isLoading={isTestLoading}
      />
    </>
  );
};
