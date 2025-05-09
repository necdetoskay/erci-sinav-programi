"use client";

import React, { useState } from 'react';
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AppSettings = () => {
  const [defaultQuestionCount, setDefaultQuestionCount] = useState(
    localStorage.getItem('defaultQuestionCount') || "10"
  );
  const [defaultDifficulty, setDefaultDifficulty] = useState(
    localStorage.getItem('defaultDifficulty') || "medium"
  );
  const [autoSave, setAutoSave] = useState(
    localStorage.getItem('autoSave') !== "false"
  );
  const [notifications, setNotifications] = useState(
    localStorage.getItem('notifications') !== "false"
  );

  // Uygulama ayarlarını kaydet
  const handleAppSettingsSave = () => {
    // Burada API çağrısı yapılabilir veya localStorage'a kaydedilebilir
    localStorage.setItem('defaultQuestionCount', defaultQuestionCount);
    localStorage.setItem('defaultDifficulty', defaultDifficulty);
    localStorage.setItem('autoSave', autoSave.toString());
    localStorage.setItem('notifications', notifications.toString());
    toast.success("Uygulama ayarları kaydedildi");
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
        <Button onClick={handleAppSettingsSave}>Kaydet</Button>
      </CardFooter>
    </Card>
  );
};
