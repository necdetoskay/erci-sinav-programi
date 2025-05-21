"use client";

import React from "react";
import { useWizard } from "./WizardContainer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export const Step1BasicInfo: React.FC = () => {
  const { data, updateBasicInfo, errors } = useWizard();
  const { basicInfo } = data;

  // Sınav süresi seçenekleri
  const durationOptions = [
    { value: 15, label: "15 dakika" },
    { value: 30, label: "30 dakika" },
    { value: 45, label: "45 dakika" },
    { value: 60, label: "1 saat" },
    { value: 90, label: "1 saat 30 dakika" },
    { value: 120, label: "2 saat" },
    { value: 180, label: "3 saat" },
  ];

  // Zorluk seviyesi seçenekleri
  const difficultyOptions = [
    { value: "easy", label: "Kolay" },
    { value: "medium", label: "Orta" },
    { value: "hard", label: "Zor" },
  ];



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temel Sınav Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sınav Adı */}
          <div className="space-y-2">
            <Label htmlFor="title" className="required">
              Sınav Adı
            </Label>
            <Input
              id="title"
              value={basicInfo.title}
              onChange={(e) => updateBasicInfo({ title: e.target.value })}
              placeholder="Sınav adını giriniz"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title[0]}</p>
            )}
          </div>

          {/* Sınav Açıklaması */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={basicInfo.description}
              onChange={(e) => updateBasicInfo({ description: e.target.value })}
              placeholder="Sınav açıklaması giriniz (isteğe bağlı)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sınav Süresi */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="required">
                Sınav Süresi
              </Label>
              <Select
                value={basicInfo.durationMinutes.toString()}
                onValueChange={(value) =>
                  updateBasicInfo({ durationMinutes: parseInt(value) })
                }
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Süre seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zorluk Seviyesi */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Zorluk Seviyesi</Label>
              <Select
                value={basicInfo.difficulty}
                onValueChange={(value) =>
                  updateBasicInfo({ difficulty: value })
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Zorluk seviyesi seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İpuçları</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Sınav adı, katılımcıların sınavı tanıması için kullanılır. Açıklayıcı bir isim seçin.
            </li>
            <li>
              Açıklama alanına sınavın amacı, kapsamı ve önemli notlar ekleyebilirsiniz.
            </li>
            <li>
              Sınav süresini, soruların zorluğuna ve sayısına göre belirleyin.
            </li>
            <li>
              Zorluk seviyesi, sınavları filtrelemek ve gruplamak için kullanılır.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
