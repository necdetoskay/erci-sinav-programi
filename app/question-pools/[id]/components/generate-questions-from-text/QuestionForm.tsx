"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Provider, Model } from "./types";

interface QuestionFormProps {
  promptText: string;
  setPromptText: (value: string) => void;
  count: number;
  setCount: (value: number) => void;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (value: "easy" | "medium" | "hard") => void;
  model: string;
  setModel: (value: string) => void;

  providers: Provider[];
  models: Model[];
  isLoadingModels: boolean;
  formErrors: any[];
  handleGenerateClick: () => void;
  isGenerating: boolean;
  apiStatus: 'checking' | 'ready' | 'error';
  apiStatusMessage: string;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  promptText,
  setPromptText,
  count,
  setCount,
  difficulty,
  setDifficulty,
  model,
  setModel,
  providers,
  models,
  isLoadingModels,
  formErrors,
  handleGenerateClick,
  isGenerating,
  apiStatus,
  apiStatusMessage
}) => {
  // Hata mesajını getir
  const getError = (path: string) =>
    (Array.isArray(formErrors) ? formErrors : [])
    .find(err => err && err.path && typeof err.path.includes === 'function' && err.path.includes(path))?.message;

  // Modelleri provider'lara göre grupla
  const groupedModels = (Array.isArray(models) ? models : []).reduce((acc, model) => {
    if (model && model.providerId) {
      const providerId = model.providerId;
      if (!acc[providerId]) {
        acc[providerId] = [];
      }
      acc[providerId].push(model);
    }
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <div className="space-y-4 py-4">
      {/* API Durumu */}
      {apiStatus === 'checking' && (
        <Alert className="bg-yellow-50 border-yellow-400 dark:bg-yellow-900 dark:border-yellow-700">
          <Loader2 className="h-4 w-4 text-yellow-600 dark:text-yellow-300 animate-spin" />
          <AlertTitle className="dark:text-white">Yapay Zeka Durumu Kontrol Ediliyor</AlertTitle>
          <AlertDescription className="dark:text-gray-100">
            {apiStatusMessage}
          </AlertDescription>
        </Alert>
      )}

      {apiStatus === 'error' && (
        <Alert className="bg-red-50 border-red-400 dark:bg-red-900 dark:border-red-700">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
          <AlertTitle className="dark:text-white">Yapay Zeka Servisi Hatası</AlertTitle>
          <AlertDescription className="dark:text-gray-100">
            {apiStatusMessage}
          </AlertDescription>
        </Alert>
      )}

      {apiStatus === 'ready' && (
        <Alert className="bg-green-50 border-green-400 dark:bg-green-900 dark:border-green-700">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
          <AlertTitle className="dark:text-white">Yapay Zeka Servisi Hazır</AlertTitle>
          <AlertDescription className="dark:text-gray-100">
            {apiStatusMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Prompt Text */}
      <div className="space-y-2">
        <Label htmlFor="promptText">Konu veya İçerik</Label>
        <Textarea
          id="promptText"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Sorular hangi konu hakkında olsun? Detaylı açıklama yapın."
          rows={4}
        />
        {getError("promptText") && (
          <p className="text-sm text-red-500">{getError("promptText")}</p>
        )}
      </div>

      {/* Count */}
      <div className="space-y-2">
        <Label htmlFor="count">Soru Sayısı</Label>
        <Input
          id="count"
          type="number"
          min={1}
          max={10}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
        />
        {getError("count") && (
          <p className="text-sm text-red-500">{getError("count")}</p>
        )}
      </div>



      {/* Difficulty */}
      <div className="space-y-2">
        <Label htmlFor="difficulty">Zorluk Seviyesi</Label>
        <Select
          value={difficulty}
          onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}
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

      {/* Model */}
      <div className="space-y-2">
        <Label htmlFor="model">Yapay Zeka Modeli</Label>
        <Select
          value={model}
          onValueChange={setModel}
          disabled={isLoadingModels}
        >
          <SelectTrigger id="model">
            <SelectValue placeholder={isLoadingModels ? "Modeller yükleniyor..." : "Model seçin"} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedModels).map(([providerId, providerModels]) => {
              const provider = (Array.isArray(providers) ? providers : []).find(p => p && p.id === providerId);
              return (
                <React.Fragment key={providerId}>
                  <SelectGroup>
                    <SelectLabel className="dark:text-white font-medium">{provider?.name || "Bilinmeyen Provider"}</SelectLabel>
                    {providerModels.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                </React.Fragment>
              );
            })}
          </SelectContent>
        </Select>
        {getError("model") && (
          <p className="text-sm text-red-500">{getError("model")}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Seçilen modelin API kodu, model ayarlarında tanımlandığı şekilde kullanılır.
          API kodunda <code className="bg-muted px-1 rounded">{'{API_KEY}'}</code> değişkeni provider'ın API anahtarı ile,
          <code className="bg-muted px-1 rounded">{'{PROMPT}'}</code> değişkeni ise metinden soru üretme promptu ile otomatik olarak değiştirilir.
        </p>
      </div>

      <Button
        onClick={handleGenerateClick}
        disabled={isGenerating || apiStatus !== 'ready'}
        className="w-full"
      >
        {isGenerating ? "Sorular Üretiliyor..." : "Soruları Üret"}
      </Button>
    </div>
  );
};
