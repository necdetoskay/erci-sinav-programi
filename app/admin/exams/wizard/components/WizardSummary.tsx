"use client";

import React from "react";
import { useWizard } from "./WizardContainer";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const WizardSummary: React.FC = () => {
  const { data } = useWizard();
  const { basicInfo, questions, sharing, scheduling } = data;

  // Zorluk seviyesi Türkçe karşılıkları
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Kolay";
      case "medium":
        return "Orta";
      case "hard":
        return "Zor";
      default:
        return difficulty;
    }
  };



  // Süre formatı
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} dakika`;
    } else if (minutes % 60 === 0) {
      return `${minutes / 60} saat`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours} saat ${mins} dakika`;
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Temel Bilgiler</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sınav Adı:</span>
              <span className="font-medium">{basicInfo.title || "Belirtilmemiş"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Süre:</span>
              <span className="font-medium">{formatDuration(basicInfo.durationMinutes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zorluk:</span>
              <span className="font-medium">{getDifficultyLabel(basicInfo.difficulty)}</span>
            </div>

          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Sorular</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toplam Soru:</span>
              <span className="font-medium">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Soru Başına Puan:</span>
              <span className="font-medium">
                {questions.length > 0
                  ? `${(100 / questions.length).toFixed(2)} puan`
                  : "Belirtilmemiş"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Paylaşım Ayarları</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Erişim Kodu:</span>
              <span className="font-medium font-mono">{sharing.accessCode || "Otomatik"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Görünürlük:</span>
              <Badge variant="outline">
                {sharing.isPublic ? "Herkese Açık" : "Sadece Davetliler"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seçili Personel:</span>
              <span className="font-medium">{sharing.personnel.length} kişi</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Zamanlama</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Başlangıç:</span>
              <span className="font-medium">
                {scheduling.startImmediately
                  ? "Hemen Başlat"
                  : scheduling.startDate
                  ? format(new Date(scheduling.startDate), "PPP HH:mm", {
                      locale: tr,
                    })
                  : "Belirtilmemiş"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-posta Bildirimi:</span>
              <Badge variant="outline">
                {scheduling.sendEmails ? "Aktif" : "Pasif"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {basicInfo.description && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium mb-2">Açıklama</h3>
            <p className="text-muted-foreground">{basicInfo.description}</p>
          </div>
        </>
      )}
    </div>
  );
};
