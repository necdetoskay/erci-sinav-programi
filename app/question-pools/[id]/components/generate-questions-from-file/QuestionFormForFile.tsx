"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Provider, Model } from '../generate-questions-from-text/types'; // Re-use types
import { z } from 'zod';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QuestionFormForFileProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  getRootProps: any; // from useDropzone
  getInputProps: any; // from useDropzone
  isDragActive: boolean;
  count: number;
  setCount: (value: number) => void;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (value: "easy" | "medium" | "hard") => void;
  model: string;
  setModel: (value: string) => void;
  providers: Provider[]; // Assuming providers are loaded similarly
  models: Model[];
  isLoadingModels: boolean;
  formErrors: z.ZodIssue[];
  handleGenerateClick: () => void;
  isGenerating: boolean;
  apiStatus: 'checking' | 'ready' | 'error';
  apiStatusMessage: string;
}

export function QuestionFormForFile({
  files,
  setFiles,
  getRootProps,
  getInputProps,
  isDragActive,
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
  apiStatusMessage,
}: QuestionFormForFileProps) {

  const getError = (fieldName: string) => {
    return formErrors.find(err => err.path.includes(fieldName))?.message;
  };

  return (
    <div className="space-y-6">
      {/* API Status Alert - Moved to top */}
      {apiStatus !== 'checking' && (
         <Alert variant={apiStatus === 'error' ? 'destructive' : (apiStatus === 'ready' ? 'default' : 'default')} 
                className={apiStatus === 'ready' ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' : ''}>
          {apiStatus === 'ready' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{apiStatus === 'ready' ? 'Servis Hazır' : (apiStatus === 'error' ? 'Servis Hatası' : 'Servis Durumu')}</AlertTitle>
          <AlertDescription>
            {apiStatusMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* File Dropzone */}
      <div className="space-y-2">
        <Label htmlFor="file-upload">Dosya Yükle (.txt, .pdf, .docx)</Label>
        <div
          {...getRootProps()}
          id="file-upload"
          className={`p-6 border-2 border-dashed rounded-md cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'}
            ${files.length > 0 ? 'border-green-500' : ''}`}
        >
          <input {...getInputProps()} />
          {files.length > 0 ? (
            <p className="text-center text-green-600 dark:text-green-400">
              Dosya seçildi: {files[0].name}
            </p>
          ) : isDragActive ? (
            <p className="text-center text-primary">Dosyayı buraya bırakın...</p>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Soru üretmek için dosyayı buraya sürükleyin veya tıklayın.
            </p>
          )}
        </div>
        {files.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setFiles([])} className="mt-2">
                Dosyayı Temizle
            </Button>
        )}
      </div>

      {/* AI Parameters Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="count">Soru Sayısı</Label>
          <Input
            id="count"
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            min="1"
            max="10" // Consistent with text generation
          />
          {getError('count') && <p className="text-sm text-red-500">{getError('count')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Zorluk Seviyesi</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Zorluk seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Kolay</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="hard">Zor</SelectItem>
            </SelectContent>
          </Select>
          {getError('difficulty') && <p className="text-sm text-red-500">{getError('difficulty')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Yapay Zeka Modeli</Label>
          <Select value={model} onValueChange={setModel} disabled={isLoadingModels || models.length === 0}>
            <SelectTrigger id="model">
              <SelectValue placeholder={isLoadingModels ? "Modeller yükleniyor..." : "Model seçin"} />
            </SelectTrigger>
            <SelectContent>
              {models.length === 0 && !isLoadingModels && <SelectItem value="" disabled>Aktif model bulunamadı</SelectItem>}
              {models.map((m) => (
                <SelectItem key={m.id} value={m.codeName}>
                  {m.name} ({m.provider?.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getError('model') && <p className="text-sm text-red-500">{getError('model')}</p>}
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleGenerateClick} disabled={isGenerating || files.length === 0 || apiStatus !== 'ready'}>
          {isGenerating ? 'Sorular Üretiliyor...' : 'Soruları Üret'}
        </Button>
      </div>
    </div>
  );
}
