"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UISettingsProps {
  userId: string | null;
}

export const UISettings = ({ userId }: UISettingsProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // İstemci tarafında bileşenin monte edildiğini kontrol et ve ayarları yükle
  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) {
        setMounted(true);
        return;
      }

      try {
        // Kullanıcı ID'si varsa, o kullanıcının ayarlarını getir
        const scope = 'user';
        const url = `/api/settings?scope=${scope}&userId=${userId}`;

        console.log(`Fetching UI settings from: ${url} at ${new Date().toISOString()}`);

        const response = await fetch(url, {
          // Cache'i devre dışı bırak
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const settings = await response.json();

        console.log(`UI settings loaded for user ${userId} at ${new Date().toISOString()}:`, settings);

        // Tema ayarını yükle (eğer varsa)
        if (settings.theme) {
          console.log(`Setting theme to: ${settings.theme} for user ${userId}`);

          // Tema ayarını sadece state'e kaydet, localStorage'a kaydetme
          // Bu sayede her kullanıcının kendi teması olacak
          setTheme(settings.theme);

          // Tema değişikliğini localStorage'a kaydetme
          // localStorage.setItem('theme', settings.theme);
        } else {
          console.log(`No theme setting found, using default for user ${userId}`);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Hata durumunda bir şey yapma, varsayılan tema kullanılacak
      } finally {
        setMounted(true);
      }
    };

    fetchSettings();
  }, [setTheme, userId]);

  const [isSaving, setIsSaving] = useState(false);

  // Kullanıcı arayüzü ayarlarını kaydet
  const handleUISettingsSave = async () => {
    if (!userId) {
      toast.error('Kullanıcı seçilmedi');
      return;
    }

    try {
      setIsSaving(true);

      // Tema ayarını API'ye gönder
      const scope = 'user';
      const url = `/api/settings?scope=${scope}&userId=${userId}`;

      console.log(`Saving UI settings to: ${url}`);
      console.log(`UI settings to save:`, { theme: theme || 'light' });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme || 'light',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      console.log(`UI settings save result:`, result);

      toast.success("Kullanıcı arayüzü ayarları kaydedildi");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Eğer bileşen henüz monte edilmediyse, sunucu tarafında render edilirken
  // varsayılan değerleri kullan (hidratlama sorununu önlemek için)
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Arayüzü Ayarları</CardTitle>
          <CardDescription>Arayüz görünümünü özelleştirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="theme" className="text-sm font-medium">Tema</label>
            <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2">
              Yükleniyor...
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled>Kaydet</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kullanıcı Arayüzü Ayarları</CardTitle>
        <CardDescription>Arayüz görünümünü özelleştirin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="theme" className="text-sm font-medium">Tema</label>
          <Select
            value={theme || "light"}
            onValueChange={(value) => {
              setTheme(value);
              // Tema değiştiğinde otomatik olarak localStorage'a kaydedilir
              // next-themes tarafından "user-theme" anahtarı ile
            }}
          >
            <SelectTrigger id="theme">
              <SelectValue placeholder="Tema seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Açık</SelectItem>
              <SelectItem value="dark">Koyu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUISettingsSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            "Kaydet"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
