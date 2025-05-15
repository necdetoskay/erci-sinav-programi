"use client";

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AppSettingsProps {
  userId: string | null;
}

export const AppSettings = ({ userId }: AppSettingsProps) => {
  const [defaultQuestionCount, setDefaultQuestionCount] = useState("10");
  const [defaultDifficulty, setDefaultDifficulty] = useState("medium");
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Ayarları yükle
  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Kullanıcı ID'si varsa, o kullanıcının ayarlarını getir
        const scope = 'user';
        const url = `/api/settings?scope=${scope}&userId=${userId}`;

        console.log(`Fetching App settings from: ${url} at ${new Date().toISOString()}`);

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

        console.log(`App settings loaded for user ${userId} at ${new Date().toISOString()}:`, settings);

        // Ayarları state'e yükle
        setDefaultQuestionCount(settings.defaultQuestionCount || "10");
        setDefaultDifficulty(settings.defaultDifficulty || "medium");
        setAutoSave(settings.autoSave !== "false");
        setNotifications(settings.notifications !== "false");
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Ayarlar yüklenirken bir hata oluştu');

        // Hata durumunda localStorage'dan yükle (geriye dönük uyumluluk)
        setDefaultQuestionCount(localStorage.getItem('defaultQuestionCount') || "10");
        setDefaultDifficulty(localStorage.getItem('defaultDifficulty') || "medium");
        setAutoSave(localStorage.getItem('autoSave') !== "false");
        setNotifications(localStorage.getItem('notifications') !== "false");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  // Uygulama ayarlarını kaydet
  const handleAppSettingsSave = async () => {
    if (!userId) {
      toast.error('Kullanıcı seçilmedi');
      return;
    }

    try {
      setIsSaving(true);

      // Ayarları API'ye gönder
      const scope = 'user';
      const url = `/api/settings?scope=${scope}&userId=${userId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultQuestionCount,
          defaultDifficulty,
          autoSave: autoSave.toString(),
          notifications: notifications.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Geriye dönük uyumluluk için localStorage'a da kaydet
      // Not: Bu sadece mevcut kullanıcı için yapılmalı
      if (userId === localStorage.getItem('currentUserId')) {
        localStorage.setItem('defaultQuestionCount', defaultQuestionCount);
        localStorage.setItem('defaultDifficulty', defaultDifficulty);
        localStorage.setItem('autoSave', autoSave.toString());
        localStorage.setItem('notifications', notifications.toString());
      }

      toast.success("Uygulama ayarları kaydedildi");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uygulama Ayarları</CardTitle>
        <CardDescription>Soru oluşturma ve diğer ayarları yapılandırın</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="questionCount" className="text-sm font-medium">Varsayılan Soru Sayısı</label>
          <Select
            value={defaultQuestionCount}
            onValueChange={setDefaultQuestionCount}
          >
            <SelectTrigger id="questionCount">
              <SelectValue placeholder="Soru sayısı seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="25">25</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="difficulty" className="text-sm font-medium">Varsayılan Zorluk Seviyesi</label>
          <Select
            value={defaultDifficulty}
            onValueChange={setDefaultDifficulty}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Zorluk seviyesi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Kolay</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="hard">Zor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="autoSave" className="cursor-pointer">Otomatik Kaydetme</Label>
          <Switch
            id="autoSave"
            checked={autoSave}
            onCheckedChange={setAutoSave}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notifications" className="cursor-pointer">Bildirimler</Label>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAppSettingsSave}
          disabled={isLoading || isSaving}
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
