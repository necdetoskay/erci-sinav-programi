"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemSettingsProps {
  userId?: string;
}

export const SystemSettings = ({ userId }: SystemSettingsProps) => {
  const [publicServerUrl, setPublicServerUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Ayarları yükle
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        // Global ayarları getir (userId belirtilmediğinde global ayarlar gelir)
        const response = await fetch(`/api/settings?scope=global`);
        
        if (!response.ok) {
          throw new Error('Ayarlar yüklenirken bir hata oluştu');
        }
        
        const settings = await response.json();
        
        console.log('Sistem ayarları yüklendi:', settings);
        
        // Dış erişim URL'sini ayarla
        setPublicServerUrl(settings.PUBLIC_SERVER_URL || "");
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        toast.error('Sistem ayarları yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Sistem ayarlarını kaydet
  const handleSystemSettingsSave = async () => {
    try {
      setIsSaving(true);
      
      // Ayarları API'ye gönder
      const response = await fetch(`/api/settings?scope=global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          PUBLIC_SERVER_URL: publicServerUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Ayarlar kaydedilirken bir hata oluştu');
      }
      
      toast.success('Sistem ayarları başarıyla kaydedildi');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Sistem ayarları kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistem Ayarları</CardTitle>
        <CardDescription>
          Sınav portalının genel sistem ayarlarını yapılandırın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="publicServerUrl">Dış Erişim URL'si</Label>
          <Input
            id="publicServerUrl"
            placeholder="https://sinav.kentkonut.com.tr"
            value={publicServerUrl}
            onChange={(e) => setPublicServerUrl(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Sınav giriş linkleri oluşturulurken kullanılacak dış erişim URL'si. 
            Bu URL, sınav katılımcılarının dışarıdan erişebileceği adres olmalıdır.
          </p>
        </div>

        <Button 
          onClick={handleSystemSettingsSave} 
          disabled={isSaving}
        >
          {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </Button>
      </CardContent>
    </Card>
  );
};
