"use client";

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Provider } from './types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";

interface ProviderManagementProps {
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  setSelectedProviderId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProviderId: string | null;
  userId?: string | null; // Kullanıcı ID'si
}

export const ProviderManagement: React.FC<ProviderManagementProps> = ({
  providers,
  setProviders,
  setSelectedProviderId,
  selectedProviderId,
  userId
}) => {
  // Provider form state'leri
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<Provider>({ id: '', name: '', description: '', apiKey: '' });

  // Validasyon hataları
  const [providerErrors, setProviderErrors] = useState<{[key: string]: string}>({});



  // Provider form validasyonu
  const validateProviderForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!currentProvider.name.trim()) {
      errors.name = "Provider adı gereklidir";
    }

    if (!currentProvider.apiKey.trim() && !isEditingProvider) {
      errors.apiKey = "API anahtarı gereklidir";
    }

    setProviderErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Yeni provider ekleme
  const handleAddProvider = async () => {
    if (validateProviderForm()) {
      try {
        // API'ye yeni provider ekle
        const url = userId ? `/api/ai-providers?userId=${userId}` : '/api/ai-providers';
        console.log(`Adding provider to: ${url}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentProvider.name,
            description: currentProvider.description || '',
            apiKey: currentProvider.apiKey,
            userId: userId // Kullanıcı ID'sini de gönder
          }),
        });

        if (!response.ok) {
          throw new Error('Provider eklenirken bir hata oluştu');
        }

        const newProvider = await response.json();

        // State'i güncelle
        setProviders([...providers, newProvider]);
        setIsProviderDialogOpen(false);
        setCurrentProvider({ id: '', name: '', description: '', apiKey: '' });
        toast.success("Provider başarıyla eklendi");
      } catch (error) {
        console.error('Provider ekleme hatası:', error);
        toast.error('Provider eklenirken bir hata oluştu');
      }
    }
  };

  // Provider düzenleme
  const handleEditProvider = async () => {
    if (validateProviderForm()) {
      try {
        // API anahtarı boş bırakıldıysa, güncelleme isteğinden çıkar
        const updateData: Record<string, string> = {
          name: currentProvider.name,
          description: currentProvider.description || '',
        };

        // API anahtarı boş değilse, güncelleme isteğine ekle
        if (currentProvider.apiKey.trim() !== '') {
          updateData.apiKey = currentProvider.apiKey;
        }

        // API'ye provider güncelleme isteği gönder
        const url = userId
          ? `/api/ai-providers/${currentProvider.id}?userId=${userId}`
          : `/api/ai-providers/${currentProvider.id}`;

        console.log(`Updating provider at: ${url}`);

        // Kullanıcı ID'sini de ekle
        if (userId) {
          updateData.userId = userId;
        }

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error('Provider güncellenirken bir hata oluştu');
        }

        const updatedProvider = await response.json();

        // State'i güncelle
        setProviders(providers.map(provider =>
          provider.id === currentProvider.id ? updatedProvider : provider
        ));
        setIsProviderDialogOpen(false);
        setIsEditingProvider(false);
        setCurrentProvider({ id: '', name: '', description: '', apiKey: '' });
        toast.success("Provider başarıyla güncellendi");
      } catch (error) {
        console.error('Provider güncelleme hatası:', error);
        toast.error('Provider güncellenirken bir hata oluştu');
      }
    }
  };

  // Provider silme
  const handleDeleteProvider = async (id: string) => {
    try {
      // API'ye provider silme isteği gönder
      const url = userId
        ? `/api/ai-providers/${id}?userId=${userId}`
        : `/api/ai-providers/${id}`;

      console.log(`Deleting provider at: ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Provider silinirken bir hata oluştu');
      }

      // State'i güncelle
      setProviders(providers.filter(provider => provider.id !== id));

      // Seçili provider silindiyse, seçimi kaldır
      if (selectedProviderId === id) {
        setSelectedProviderId(null);
      }

      toast.success("Provider ve ilişkili modeller silindi");
    } catch (error) {
      console.error('Provider silme hatası:', error);
      toast.error('Provider silinirken bir hata oluştu');
    }
  };

  // Provider düzenleme formunu aç
  const openEditProviderDialog = (provider: Provider) => {
    // API anahtarını boş bırak, kullanıcı değiştirmek isterse yeni anahtar girecek
    setCurrentProvider({
      ...provider,
      apiKey: '' // API anahtarını boş bırak
    });
    setIsEditingProvider(true);
    setIsProviderDialogOpen(true);
  };



  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Yapay Zeka Sağlayıcıları</CardTitle>
            <CardDescription>API anahtarlarını ve sağlayıcıları yönetin</CardDescription>
          </div>
          <Button onClick={() => {
            setCurrentProvider({ id: '', name: '', description: '', apiKey: '' });
            setIsEditingProvider(false);
            setIsProviderDialogOpen(true);
          }}>
            Yeni Provider Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Henüz provider eklenmemiş
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>API Anahtarı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow
                    key={provider.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedProviderId(provider.id)}
                  >
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>{provider.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs">{provider.apiKey}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditProviderDialog(provider);
                        }}
                      >
                        Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProvider(provider.id);
                        }}
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

      {/* Provider Ekleme/Düzenleme Dialog */}
      <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
        <DialogContent
          onPointerDownOutside={(e) => {
            // Dışarı tıklamayı engelle
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditingProvider ? "Provider Düzenle" : "Yeni Provider Ekle"}
            </DialogTitle>
            <DialogDescription>
              {isEditingProvider
                ? "Provider bilgilerini güncelleyin"
                : "Yeni bir yapay zeka sağlayıcısı ekleyin"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="providerName">Provider Adı *</Label>
              <Input
                id="providerName"
                value={currentProvider.name}
                onChange={(e) => setCurrentProvider({ ...currentProvider, name: e.target.value })}
                placeholder="Örn: OpenAI, Microsoft Azure, Anthropic"
              />
              {providerErrors.name && (
                <p className="text-sm text-destructive">{providerErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerDescription">Açıklama</Label>
              <Textarea
                id="providerDescription"
                value={currentProvider.description || ''}
                onChange={(e) => setCurrentProvider({ ...currentProvider, description: e.target.value })}
                placeholder="Provider hakkında kısa açıklama"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">
                API Anahtarı {isEditingProvider ? "" : "*"}
              </Label>
              <Input
                id="apiKey"
                type="text"
                value={currentProvider.apiKey}
                onChange={(e) => setCurrentProvider({ ...currentProvider, apiKey: e.target.value })}
                placeholder={isEditingProvider ? "Değiştirmek için yeni anahtar girin" : "API anahtarını girin"}
              />
              {providerErrors.apiKey && (
                <p className="text-sm text-destructive">{providerErrors.apiKey}</p>
              )}
              {isEditingProvider && (
                <p className="text-sm text-muted-foreground">
                  Boş bırakırsanız mevcut API anahtarı korunacaktır
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={isEditingProvider ? handleEditProvider : handleAddProvider}>
              {isEditingProvider ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
