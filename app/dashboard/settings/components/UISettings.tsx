"use client";

import React from 'react';
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const UISettings = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // İstemci tarafında bileşenin monte edildiğini kontrol et
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Kullanıcı arayüzü ayarlarını kaydet
  const handleUISettingsSave = () => {
    // Burada API çağrısı yapılabilir veya localStorage'a kaydedilebilir
    localStorage.setItem('theme', theme || 'light');
    toast.success("Kullanıcı arayüzü ayarları kaydedildi");
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
            onValueChange={setTheme}
          >
            <SelectTrigger id="theme">
              <SelectValue placeholder="Tema seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Açık</SelectItem>
              <SelectItem value="dark">Koyu</SelectItem>
              <SelectItem value="system">Sistem</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleUISettingsSave}>Kaydet</Button>
      </CardFooter>
    </Card>
  );
};
