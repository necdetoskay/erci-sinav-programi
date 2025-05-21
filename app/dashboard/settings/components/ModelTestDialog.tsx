"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Model } from './types';

interface ModelTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model | null;
  testResult: {
    success: boolean;
    result?: string;
    error?: string;
    responseTime?: number;
    rawResponse?: any;
  } | null;
  isLoading: boolean;
}

export const ModelTestDialog: React.FC<ModelTestDialogProps> = ({
  isOpen,
  onClose,
  model,
  testResult,
  isLoading
}) => {
  if (!model) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Model Test Ediliyor..." : "Model Test Sonucu"}
          </DialogTitle>
          <DialogDescription>
            {isLoading
              ? `${model.name} modeli test ediliyor, lütfen bekleyin...`
              : `${model.name} modeli test sonuçları`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : testResult ? (
            <>
              {testResult.success ? (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-600 dark:text-green-400">Test Başarılı</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    {model.name} aktif ve çalışıyor
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Test Başarısız</AlertTitle>
                  <AlertDescription>
                    {testResult.error || "Bilinmeyen bir hata oluştu"}
                  </AlertDescription>
                </Alert>
              )}

              {testResult.success && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Yanıt Süresi</h3>
                    <p className="text-sm text-muted-foreground">
                      {testResult.responseTime ? `${(testResult.responseTime / 1000).toFixed(2)} saniye` : 'Bilinmiyor'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Model Yanıtı</h3>
                    <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap overflow-auto max-h-60 break-words w-full">
                      {typeof testResult.result === 'string' ? testResult.result : JSON.stringify(testResult.result, null, 2)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Teknik Detaylar</h3>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-h-40 w-full">
                      <pre className="whitespace-pre-wrap break-words overflow-x-auto w-full">
                        {typeof testResult.rawResponse === 'object'
                          ? JSON.stringify(testResult.rawResponse, null, 2)
                          : String(testResult.rawResponse)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              Test sonucu bulunamadı
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} disabled={isLoading}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
