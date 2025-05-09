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

interface ModelManagementProps {
  models: Model[];
  setModels: React.Dispatch<React.SetStateAction<Model[]>>;
  providers: Provider[];
  selectedProviderId: string | null;
}

export const ModelManagement: React.FC<ModelManagementProps> = ({
  models,
  setModels,
  providers,
  selectedProviderId
}) => {
  // Model form state'leri
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [currentModel, setCurrentModel] = useState<Model>({
    id: '',
    name: '',
    details: '',
    codeName: '',
    providerId: '',
    orderIndex: 0,
    isEnabled: true
  });

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

    if (!currentModel.codeName.trim()) {
      errors.codeName = "Model kod adı gereklidir";
    }

    setModelErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Yeni model ekleme
  const handleAddModel = async () => {
    if (validateModelForm()) {
      try {
        // API'ye yeni model ekle
        const response = await fetch('/api/ai-models', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentModel.name,
            details: currentModel.details,
            codeName: currentModel.codeName,
            providerId: currentModel.providerId,
            orderIndex: currentModel.orderIndex,
            isEnabled: currentModel.isEnabled,
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
          codeName: '',
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
        const response = await fetch(`/api/ai-models/${currentModel.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentModel.name,
            details: currentModel.details,
            codeName: currentModel.codeName,
            providerId: currentModel.providerId,
            orderIndex: currentModel.orderIndex,
            isEnabled: currentModel.isEnabled,
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
          details: '',
          codeName: '',
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
      const response = await fetch(`/api/ai-models/${id}`, {
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
      const response = await fetch(`/api/ai-models/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled
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
              details: '',
              codeName: '',
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
                  <TableHead>Kod Adı</TableHead>
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
                    <TableCell className="font-mono text-sm">{model.codeName}</TableCell>
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modelName">Model Adı *</Label>
              <Input
                id="modelName"
                value={currentModel.name}
                onChange={(e) => setCurrentModel({ ...currentModel, name: e.target.value })}
                placeholder="Örn: GPT-4, Claude 3, Phi-3"
              />
              {modelErrors.name && (
                <p className="text-sm text-destructive">{modelErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
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
                <p className="text-sm text-destructive">{modelErrors.providerId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelCodeName">Kod Adı *</Label>
              <Input
                id="modelCodeName"
                value={currentModel.codeName}
                onChange={(e) => setCurrentModel({ ...currentModel, codeName: e.target.value })}
                placeholder="Örn: gpt-4, claude-3-opus-20240229, phi-3"
              />
              {modelErrors.codeName && (
                <p className="text-sm text-destructive">{modelErrors.codeName}</p>
              )}
              <p className="text-sm text-muted-foreground">
                API isteklerinde kullanılacak model tanımlayıcısı
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelDetails">Açıklama</Label>
              <Textarea
                id="modelDetails"
                value={currentModel.details || ''}
                onChange={(e) => setCurrentModel({ ...currentModel, details: e.target.value })}
                placeholder="Model hakkında kısa açıklama"
                rows={3}
              />
            </div>

            <div className="space-y-2">
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
              <p className="text-sm text-muted-foreground">
                Modellerin listede gösterilme sırası (küçük değerler üstte gösterilir)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="modelStatus">Aktif</Label>
              <Switch
                id="modelStatus"
                checked={currentModel.isEnabled}
                onCheckedChange={(checked) => setCurrentModel({
                  ...currentModel,
                  isEnabled: checked
                })}
              />
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
    </>
  );
};
